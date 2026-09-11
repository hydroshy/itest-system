import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { NetworkServersService } from '../../network-servers/network-servers.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { HmiScreenEntity, HmiWidget } from './entities/hmi-screen.entity';
import { TelemetryEntity } from '../../lorawan/entities/telemetry.entity';
import {
  CreateHmiScreenDto,
  UpdateHmiScreenDto,
  CloneHmiScreenDto,
  PublishHmiScreenDto,
} from './dto/hmi-screen.dto';

@Injectable()
export class HmiStudioService implements OnModuleInit {
  private readonly logger = new Logger(HmiStudioService.name);

  constructor(
    private readonly dynamicDatabaseService: DynamicDatabaseService,
    private readonly networkServersService: NetworkServersService,
    private readonly realtimeService: RealtimeService,
  ) {}


  async onModuleInit() {
    // Seed default sample screen if repository is available
    try {
      const repo = this.getRepository();
      const count = await repo.count();
      if (count === 0) {
        await this.seedSampleScreen();
      }
    } catch (e: any) {
      this.logger.warn(`Could not seed default HMI screen on startup: ${e.message}`);
    }
  }

  private getRepository(): Repository<HmiScreenEntity> {
    return this.dynamicDatabaseService.getRepositoryForTable(
      'hmi_screens',
      HmiScreenEntity,
    );
  }

  async findAll(): Promise<HmiScreenEntity[]> {
    const repo = this.getRepository();
    return await repo.find({
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async findPublished(userRole?: string): Promise<HmiScreenEntity[]> {
    const repo = this.getRepository();
    const screens = await repo.find({
      where: { isPublished: true },
      order: { updatedAt: 'DESC' },
    });

    if (!userRole || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      return screens;
    }

    return screens.filter(
      (s) =>
        !s.allowedRoles ||
        s.allowedRoles.length === 0 ||
        s.allowedRoles.includes(userRole),
    );
  }

  async findOne(id: string): Promise<HmiScreenEntity> {
    const repo = this.getRepository();
    const screen = await repo.findOne({ where: { id } });
    if (!screen) {
      throw new NotFoundException(`HMI Screen with ID '${id}' not found`);
    }
    return screen;
  }

  async create(dto: CreateHmiScreenDto, author?: string): Promise<HmiScreenEntity> {
    const repo = this.getRepository();
    const slug = (dto.name || 'screen')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const id = dto.id || `${slug}-${Date.now().toString(36)}`;

    const existing = await repo.findOne({ where: { id } });
    if (existing) {
      throw new BadRequestException(`Screen ID '${id}' already exists`);
    }

    const screen = repo.create({
      id,
      name: dto.name.trim(),
      description: dto.description || '',
      canvasConfig: dto.canvasConfig || {
        width: 1280,
        height: 720,
        background: '#0b0f19',
        grid: 10,
        showGrid: true,
      },
      widgets: dto.widgets || [],
      isPublished: dto.isPublished ?? false,
      allowedRoles: dto.allowedRoles || [
        'ADMIN',
        'SUPER_ADMIN',
        'OPERATOR',
        'VIEWER',
      ],
      author: author || 'Admin',
    });

    return await repo.save(screen);
  }

  async update(
    id: string,
    dto: UpdateHmiScreenDto,
    author?: string,
  ): Promise<HmiScreenEntity> {
    const repo = this.getRepository();
    const screen = await this.findOne(id);

    if (dto.name !== undefined) screen.name = dto.name.trim();
    if (dto.description !== undefined) screen.description = dto.description;
    if (dto.canvasConfig !== undefined) screen.canvasConfig = dto.canvasConfig;
    if (dto.widgets !== undefined) screen.widgets = dto.widgets;
    if (dto.isPublished !== undefined) screen.isPublished = dto.isPublished;
    if (dto.allowedRoles !== undefined) screen.allowedRoles = dto.allowedRoles;
    if (author) screen.author = author;

    return await repo.save(screen);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const repo = this.getRepository();
    const screen = await this.findOne(id);
    await repo.remove(screen);
    return {
      success: true,
      message: `Screen '${screen.name}' deleted successfully`,
    };
  }

  async publish(
    id: string,
    dto: PublishHmiScreenDto,
  ): Promise<HmiScreenEntity> {
    const repo = this.getRepository();
    const screen = await this.findOne(id);
    screen.isPublished = dto.isPublished;
    return await repo.save(screen);
  }

  async clone(
    id: string,
    dto: CloneHmiScreenDto,
    author?: string,
  ): Promise<HmiScreenEntity> {
    const source = await this.findOne(id);
    const newName = dto.name || `${source.name} (Copy)`;
    const slug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newId = `${slug}-${Date.now().toString(36)}`;

    const repo = this.getRepository();
    const cloned = repo.create({
      id: newId,
      name: newName,
      description: source.description,
      canvasConfig: JSON.parse(JSON.stringify(source.canvasConfig)),
      widgets: JSON.parse(JSON.stringify(source.widgets)),
      isPublished: false,
      allowedRoles: [...(source.allowedRoles || ['ADMIN'])],
      author: author || 'Admin',
    });

    return await repo.save(cloned);
  }

  async executeDownlink(
    body: {
      devEUI?: string;
      fPort?: number;
      payloadHex?: string;
      actionType?: string;
      confirmed?: boolean;
    },
    user?: any,
  ): Promise<{
    success: boolean;
    timestamp: string;
    devEUI?: string;
    fPort: number;
    payloadHex?: string;
    status: string;
    message: string;
    networkServerType?: string;
    networkServerName?: string;
    details?: any;
  }> {
    const author = user?.username || user?.fullName || 'Operator';
    const devEUI = (body.devEUI || '').trim().toUpperCase();
    const fPort = Math.max(1, Math.min(223, Number(body.fPort) || 1));
    const payloadHex = (body.payloadHex || '01').replace(/[^0-9a-fA-F]/g, '').toUpperCase();

    this.logger.log(
      `HMI Downlink command dispatched by [${author}]: devEUI=${devEUI || 'DEFAULT'}, fPort=${fPort}, hex=${payloadHex}`,
    );

    const downlinkRes = await this.networkServersService.sendDownlink({
      devEUI,
      fPort,
      payloadHex,
      confirmed: body.confirmed,
      author,
    });

    const result = {
      success: downlinkRes.success,
      timestamp: new Date().toISOString(),
      devEUI,
      fPort,
      payloadHex,
      status: downlinkRes.status,
      message: downlinkRes.message,
      networkServerType: downlinkRes.networkServerType,
      networkServerName: downlinkRes.networkServerName,
      details: downlinkRes.details,
    };

    // Broadcast realtime event to WebSocket clients and SSE stream
    try {
      this.realtimeService.publishDownlink(result);
    } catch (e) {}

    return result;
  }

  async getTelemetryTrend(query: {
    devEUIs?: string[];
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<TelemetryEntity[]> {
    const telemetryRepo = this.dynamicDatabaseService.getRepositoryForTable(
      'uplink_telemetry',
      TelemetryEntity,
    );

    const qb = telemetryRepo
      .createQueryBuilder('telemetry')
      .orderBy('telemetry.timestamp', 'ASC');

    if (query.devEUIs && query.devEUIs.length > 0) {
      const euis = query.devEUIs.map((e) => e.trim().toUpperCase()).filter(Boolean);
      if (euis.length === 1) {
        qb.andWhere('UPPER(telemetry.devEui) = :eui', { eui: euis[0] });
      } else if (euis.length > 1) {
        qb.andWhere('UPPER(telemetry.devEui) IN (:...euis)', { euis });
      }
    }

    if (query.from) {
      const fromDate = new Date(query.from);
      if (!isNaN(fromDate.getTime())) {
        qb.andWhere('telemetry.timestamp >= :from', { from: fromDate });
      }
    }

    if (query.to) {
      const toDate = new Date(query.to);
      if (!isNaN(toDate.getTime())) {
        qb.andWhere('telemetry.timestamp <= :to', { to: toDate });
      }
    }

    const limit = Math.min(Math.max(1, query.limit || 500), 2000);
    qb.take(limit);

    return await qb.getMany();
  }

  async getDeviceTelemetryFields(devEUI: string): Promise<{
    devEUI: string;
    fields: Array<{
      key: string;
      label: string;
      latestValue: any;
      dataType: string;
      unit?: string;
      source: 'decoded_payload' | 'lora_metric' | 'default';
      lastSeen?: Date | string;
    }>;
    lastTelemetryAt?: Date | string;
    totalRecordsScanned: number;
  }> {
    const normEUI = (devEUI || '').trim().toUpperCase();
    const telemetryRepo = this.dynamicDatabaseService.getRepositoryForTable(
      'uplink_telemetry',
      TelemetryEntity,
    );

    const records = await telemetryRepo.createQueryBuilder('telemetry')
      .where('UPPER(telemetry.devEui) = :devEUI', { devEUI: normEUI })
      .orderBy('telemetry.timestamp', 'DESC')
      .take(30)
      .getMany();

    const fieldMap = new Map<string, {
      key: string;
      label: string;
      latestValue: any;
      dataType: string;
      unit?: string;
      source: 'decoded_payload' | 'lora_metric' | 'default';
      lastSeen?: Date | string;
    }>();

    // Standard LoRaWAN RF metrics
    const standardLoraFields = [
      { key: 'battery', label: 'Battery Level', unit: '%', def: 100 },
      { key: 'rssi', label: 'Signal RSSI', unit: 'dBm', def: -75 },
      { key: 'snr', label: 'Signal SNR', unit: 'dB', def: 9.5 },
      { key: 'fCnt', label: 'Frame Counter (fCnt)', unit: '', def: 1 },
      { key: 'dr', label: 'Data Rate (DR)', unit: '', def: 3 },
      { key: 'fPort', label: 'fPort', unit: '', def: 1 },
      { key: 'frequency', label: 'Frequency', unit: 'Hz', def: 868300000 },
    ];

    for (const sf of standardLoraFields) {
      fieldMap.set(sf.key, {
        key: sf.key,
        label: sf.label,
        latestValue: sf.def,
        dataType: 'number',
        unit: sf.unit,
        source: 'lora_metric',
      });
    }

    let lastTelemetryAt: Date | undefined;

    if (records && records.length > 0) {
      lastTelemetryAt = records[0].timestamp;

      for (const rec of records) {
        if (rec.rssi !== undefined && rec.rssi !== null) {
          fieldMap.set('rssi', { key: 'rssi', label: 'Signal RSSI', latestValue: rec.rssi, dataType: 'number', unit: 'dBm', source: 'lora_metric', lastSeen: rec.timestamp });
        }
        if (rec.snr !== undefined && rec.snr !== null) {
          fieldMap.set('snr', { key: 'snr', label: 'Signal SNR', latestValue: rec.snr, dataType: 'number', unit: 'dB', source: 'lora_metric', lastSeen: rec.timestamp });
        }
        if (rec.fCnt !== undefined && rec.fCnt !== null) {
          fieldMap.set('fCnt', { key: 'fCnt', label: 'Frame Counter', latestValue: rec.fCnt, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
        }
        if (rec.dr !== undefined && rec.dr !== null) {
          fieldMap.set('dr', { key: 'dr', label: 'Data Rate', latestValue: rec.dr, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
        }
        if (rec.fPort !== undefined && rec.fPort !== null) {
          fieldMap.set('fPort', { key: 'fPort', label: 'fPort', latestValue: rec.fPort, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
        }

        // Scan object and decodedData (supports recursive flattening for inner tags e.g. data.HUMIDITY)
        const parseIfString = (val: any) => {
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return null; }
          }
          return val;
        };

        const detectUnit = (key: string): string => {
          const lowerK = key.toLowerCase();
          if (lowerK.includes('temp')) return '°C';
          if (lowerK.includes('hum')) return '%RH';
          if (lowerK.includes('press') || lowerK.includes('bar') || lowerK.includes('kpa')) return 'bar';
          if (lowerK.includes('volt')) return 'V';
          if (lowerK.includes('curr') || lowerK.includes('amp')) return 'A';
          if (lowerK.includes('kwh') || lowerK.includes('energy')) return 'kWh';
          if (lowerK.includes('kvarh')) return 'kVARh';
          if (lowerK.includes('level') || lowerK.includes('tank')) return '%';
          if (lowerK.includes('flow') || lowerK.includes('speed')) return 'm³/h';
          if (lowerK.includes('power') && !lowerK.includes('source') && !lowerK.includes('level')) return 'W';
          if (lowerK.includes('ppm') || lowerK.includes('co2')) return 'ppm';
          if (lowerK.includes('lux') || lowerK.includes('light')) return 'lux';
          if (lowerK.includes('freq') || lowerK.includes('hz')) return 'Hz';
          if (lowerK.includes('ph')) return 'pH';
          if (lowerK.includes('conductivity') || lowerK.includes('ec')) return 'µS/cm';
          return '';
        };

        const formatLabel = (key: string): string => {
          return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
        };

        const registerField = (tagKey: string, val: any, timestamp?: Date) => {
          if (val === undefined || val === null) return;
          const label = formatLabel(tagKey);
          const unit = detectUnit(tagKey);
          const dataType = typeof val;

          const existing = fieldMap.get(tagKey);
          if (!existing || existing.source === 'default' || existing.source === 'lora_metric') {
            fieldMap.set(tagKey, {
              key: tagKey,
              label: label || tagKey,
              latestValue: val,
              dataType: typeof val === 'object' ? 'json' : dataType,
              unit,
              source: 'decoded_payload',
              lastSeen: timestamp,
            });
          }
        };

        const scanRecursive = (obj: any, prefix = '', timestamp?: Date) => {
          if (!obj || typeof obj !== 'object') return;
          for (const [k, v] of Object.entries(obj)) {
            if (k === 'error' || k === 'errors' || k === 'warnings') continue;
            const fullKey = prefix ? `${prefix}.${k}` : k;
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
              scanRecursive(v, fullKey, timestamp);
            } else if (v !== undefined && v !== null) {
              let cleanKey = fullKey;
              if (cleanKey.startsWith('data.')) {
                cleanKey = cleanKey.substring(5);
              }
              registerField(cleanKey, v, timestamp);
              if (cleanKey !== k && !fieldMap.has(k)) {
                registerField(k, v, timestamp);
              }
            }
          }
        };

        const objectsToScan = [rec.object, rec.decodedData].filter(Boolean);
        for (const raw of objectsToScan) {
          const parsed = parseIfString(raw);
          if (parsed && typeof parsed === 'object') {
            scanRecursive(parsed, '', rec.timestamp);
          }
        }
      }
    }

    const fields = Array.from(fieldMap.values()).sort((a, b) => {
      if (a.source === 'decoded_payload' && b.source !== 'decoded_payload') return -1;
      if (a.source !== 'decoded_payload' && b.source === 'decoded_payload') return 1;
      return a.key.localeCompare(b.key);
    });

    return {
      devEUI: normEUI,
      fields,
      lastTelemetryAt,
      totalRecordsScanned: records.length,
    };
  }


  private async seedSampleScreen(): Promise<void> {
    const repo = this.getRepository();
    const sampleWidgets: HmiWidget[] = [
      {
        id: 'header-title',
        type: 'static-label',
        x: 30,
        y: 20,
        w: 480,
        h: 40,
        zIndex: 1,
        props: {
          text: 'DAVITEQ INDUSTRIAL WATER TREATMENT SCADA',
          fontSize: 16,
          fontWeight: 'bold',
          textColor: '#38bdf8',
          subText: 'Realtime Tank Farm, Pump Stations & Sensor Telemetry',
        },
      },
      {
        id: 'bit-lamp-pump1',
        type: 'bit-lamp',
        x: 540,
        y: 25,
        w: 130,
        h: 36,
        zIndex: 2,
        props: {
          title: 'PUMP 01 STATUS',
          colorOn: '#10b981',
          colorOff: '#64748b',
          shape: 'circle',
          labelOn: 'RUNNING',
          labelOff: 'STOPPED',
        },
        bindings: {
          status: {
            field: 'relay_1',
          },
        },
      },
      {
        id: 'alarm-banner-top',
        type: 'alarm-banner',
        x: 700,
        y: 25,
        w: 540,
        h: 36,
        zIndex: 2,
        props: {
          title: 'SYSTEM ALARM MONITOR',
          idleMessage: 'All parameters normal. No active alarms.',
        },
      },
      {
        id: 'linear-tank-1',
        type: 'linear-tank',
        x: 40,
        y: 90,
        w: 220,
        h: 330,
        zIndex: 2,
        props: {
          title: 'RAW WATER TANK A',
          capacity: 100,
          unit: 'm³',
          min: 0,
          max: 100,
          liquidColor: '#0284c7',
        },
        bindings: {
          level: {
            field: 'water_level',
          },
        },
        states: [
          { condition: 'val < 20', color: '#ef4444', alarmText: 'Tank A level LOW!' },
          { condition: 'val >= 20 && val <= 85', color: '#0284c7' },
          { condition: 'val > 85', color: '#f59e0b', alarmText: 'Tank A level HIGH!' },
        ],
      },
      {
        id: 'dial-gauge-pressure',
        type: 'dial-gauge',
        x: 300,
        y: 90,
        w: 260,
        h: 260,
        zIndex: 2,
        props: {
          title: 'DISCHARGE PRESSURE',
          min: 0,
          max: 16,
          unit: 'Bar',
          zones: [
            { from: 0, to: 10, color: '#10b981' },
            { from: 10, to: 13, color: '#f59e0b' },
            { from: 13, to: 16, color: '#ef4444' },
          ],
        },
        bindings: {
          value: {
            field: 'pressure',
          },
        },
      },
      {
        id: 'led-numeric-flow',
        type: 'led-numeric',
        x: 300,
        y: 360,
        w: 260,
        h: 70,
        zIndex: 2,
        props: {
          title: 'FLOW RATE',
          unit: 'm³/h',
          digits: 5,
          color: '#38bdf8',
        },
        bindings: {
          value: {
            field: 'flow_rate',
          },
        },
      },
      {
        id: 'realtime-trend-chart',
        type: 'realtime-trend',
        x: 600,
        y: 90,
        w: 640,
        h: 340,
        zIndex: 2,
        props: {
          title: 'LIVE MULTI-TAG TELEMETRY TREND',
          historyPoints: 30,
          tags: ['water_level', 'pressure', 'flow_rate'],
        },
      },
      {
        id: 'switch-pump1-ctrl',
        type: 'toggle-switch',
        x: 40,
        y: 450,
        w: 180,
        h: 80,
        zIndex: 2,
        props: {
          title: 'REMOTE PUMP 1 CONTROL',
          labelOn: 'AUTO ON',
          labelOff: 'MANUAL OFF',
        },
        action: {
          type: 'downlink',
          fPort: 10,
          payloadHex: '0101',
          confirmMessage: 'Are you sure you want to toggle Pump 1?',
        },
      },
      {
        id: 'action-btn-flush',
        type: 'action-button',
        x: 250,
        y: 450,
        w: 180,
        h: 80,
        zIndex: 2,
        props: {
          label: 'EMERGENCY FLUSH',
          buttonColor: '#e11d48',
          icon: 'fa-solid fa-triangle-exclamation',
        },
        action: {
          type: 'downlink',
          fPort: 10,
          payloadHex: 'FFFF',
          confirmMessage: 'WARNING: Initiate emergency line flush?',
        },
      },
      {
        id: 'mono-box-temp',
        type: 'mono-box',
        x: 460,
        y: 450,
        w: 200,
        h: 80,
        zIndex: 2,
        props: {
          title: 'WATER TEMPERATURE',
          unit: '°C',
          icon: 'fa-solid fa-temperature-half',
        },
        bindings: {
          value: {
            field: 'temperature',
          },
        },
      },
    ];

    const sample = repo.create({
      id: 'demo-water-plant',
      name: 'Water Treatment & Tank Farm Overview',
      description:
        'Standard Wecon-style HMI dashboard demo with Linear Tank, Dial Gauge, LED Numeric, Realtime Trend, and Downlink Switch.',
      canvasConfig: {
        width: 1280,
        height: 720,
        background: '#0b0f19',
        grid: 10,
        showGrid: true,
      },
      widgets: sampleWidgets,
      isPublished: true,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'OPERATOR', 'VIEWER'],
      author: 'System Default',
    });

    await repo.save(sample);
    this.logger.log('✅ Seeded default Wecon-style HMI screen [demo-water-plant]');
  }
}
