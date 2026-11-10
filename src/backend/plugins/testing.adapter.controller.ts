import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Optional,
  Headers,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  Req,
  UseGuards,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { RealtimeService } from '../realtime/modules/realtime/realtime.service';
import { TestingDeviceEntity } from '../core-models/testing-device.entity';
import { DevicePacketEntity } from '../core-models/device-packet.entity';
import { GatewayTestSessionEntity } from '../core-models/gateway-test-session.entity';
import { TraceabilitySoEntity } from '../core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../core-models/traceability-wa.entity';
import { ChirpstackNetworkServerEntity } from '../core-models/chirpstack-network-server.entity';
import { DecoderAdapterController } from './decoder.adapter.controller';
import { DeviceAutoCheckProfileEntity } from '../core-models/device-autocheck-profile.entity';

export interface RegisterTestingDeviceDto {
  serialNumber: string;
  deviceName: string;
  deviceType?: string;
  networkId?: string;
  pluginId?: string;
  soId?: string;
  soNumber?: string;
  waId?: string;
  waNumber?: string;
  itemCode?: string;
  metadata?: Record<string, any>;
  status?: string;
}

export interface IngestPacketDto {
  deviceId?: string;
  networkId?: string;
  packetType?: string;
  fPort?: number;
  fCnt?: number | string;
  rawPayload?: string;
  decodedPayload?: Record<string, any>;
  rfInfo?: Record<string, any>;
}

export interface CreateGatewaySessionDto {
  gatewayId: string;
  gatewayName?: string;
  sessionName?: string;
  status?: string;
  summary?: Record<string, any>;
  soNumber?: string;
  waNumber?: string;
  serialNumber?: string;
  eui?: string;
  itemCode?: string;
  sku?: string;
  gatewayNotes?: string;
  notes?: string;
  hardwareVersion?: string;
  firmwareVersion?: string;
  mechanicalVersion?: string;
  lteModuleSerialNumber?: string;
  lteModuleImei?: string;
  gatewayIp?: string;
  internetTestType?: string;
  regionTest?: string;
  networkServerId?: string;
  lorawanFrequencyPlan?: string;
  configSnapshot?: Record<string, any>;
  forwarderConfig?: Record<string, any>;
}

export interface RunSimulationDto {
  devEui: string;
  serialNumber?: string;
  soNumber?: string;
  waNumber?: string;
  itemCode?: string;
  name?: string;
  region?: string;
  packetType?: string;
  fPort?: number;
  fCnt?: number;
  payloadHex?: string;
  decodedPayload?: Record<string, any>;
  intervalMs?: number;
  burstCount?: number;
  rfInfo?: {
    rssi?: number;
    snr?: number;
    frequency?: number;
    gatewayId?: string;
  };
}

export interface EvaluateAutoCheckDto {
  target?: {
    packetId?: string;
    deviceId?: string;
    networkId?: string;
    serialNumber?: string;
    packet?: any;
    packets?: any[];
    referencePackets?: any[];
    reference_packets?: any[];
    simulatorPackets?: any[];
    simulator_packets?: any[];
    multiReferencePackets?: Record<string, any[]>;
    multi_reference_packets?: Record<string, any[]>;
    [key: string]: any;
  };
  criteria?: {
    minRssi?: number;
    maxRssi?: number;
    minSnr?: number;
    expectedFPort?: number;
    requiredFields?: string[];
    fieldRules?: Record<string, { min?: number; max?: number; equals?: any }>;
    dut?: {
      item_code?: string;
      fw_version?: string;
      rules?: Array<{ field: string; count?: number; min?: number; max?: number; equals?: any }>;
    };
    reference?: {
      item_code?: string;
      fw_version?: string;
      rules?: Array<{ field: string; count?: number; min?: number; max?: number; equals?: any }>;
    };
    references?: Array<{
      reference_id?: string;
      referenceId?: string;
      dev_eui?: string;
      devEui?: string;
      serial_number?: string;
      serialNumber?: string;
      item_code?: string;
      fw_version?: string;
      rules?: Array<{ field: string; count?: number; min?: number; max?: number; equals?: any }>;
      [key: string]: any;
    }>;
    simulator?: any;
    comparisons?: Array<{
      dut_field?: string;
      dutField?: string;
      reference_field?: string;
      referenceField?: string;
      reference_id?: string;
      referenceId?: string;
      tolerance?: number;
    }>;
    measurement_windows?: any[];
    measurementWindows?: any[];
    average_rules?: any[];
    averageRules?: any[];
    functionRules?: any[];
    rules?: any[];
    [key: string]: any;
  };
  profileId?: string;
}

@Controller()
export class TestingAdapterController implements OnApplicationBootstrap {
  private readonly logger = new Logger(TestingAdapterController.name);
  private simulationResults: any[] = [];
  private autoCheckEvaluations: any[] = [];

  constructor(
    private readonly databaseService: DynamicDatabaseService,
    @Optional() private readonly realtimeService?: RealtimeService,
  ) {}

  async onApplicationBootstrap() {
    await this.bootstrapChirpstackHttpIntegration();
  }

  private async bootstrapChirpstackHttpIntegration() {
    const callbackUrl = (process.env.TESTING_CHIRPSTACK_WEBHOOK_URL || '').trim();
    const secret = (process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN || '').trim();
    if (!callbackUrl || !secret) {
      this.logger.log(
        'ℹ️ [ChirpStack Bootstrap] Bỏ qua đăng ký HTTP Integration tự động (chưa cấu hình TESTING_CHIRPSTACK_WEBHOOK_URL hoặc TESTING_CHIRPSTACK_WEBHOOK_TOKEN).',
      );
      return;
    }
    try {
      this.logger.log(
        `⏳ [ChirpStack Bootstrap] Đang đăng ký HTTP Integration tới ChirpStack với Webhook: ${callbackUrl}...`,
      );
      const result = await this.performChirpstackHttpRegistration(callbackUrl, secret);
      this.logger.log(
        `✅ [ChirpStack Bootstrap] Đã đăng ký thành công HTTP Integration (Application: ${result.applicationId}, Updated: ${result.updated})`,
      );
    } catch (err: any) {
      this.logger.warn(
        `⚠️ [ChirpStack Bootstrap] Không thể đăng ký HTTP Integration khi khởi động: ${err.message}`,
      );
    }
  }

  // ============================================================================
  // 1. LOOKUP ENDPOINTS (Traceability Integration)
  // ============================================================================

  @Get(['api/plugins/testing/lookup/so', 'api/v1/plugins/testing/lookup/so'])
  async lookupSalesOrders(
    @Query('search') search?: string,
    @Query('soNumber') soNumber?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const qb = soRepo.createQueryBuilder('so');

      const term = (search || soNumber || '').trim();
      if (term) {
        qb.andWhere('(so.so_number ILIKE :term OR so.customer_name ILIKE :term)', {
          term: `%${term}%`,
        });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('so.created_at', 'DESC');

      const [items, total] = await qb.getManyAndCount();

      return {
        data: items.map((item) => ({
          id: item.id,
          soNumber: item.so_number,
          customerName: item.customer_name,
          partnerEmail: item.partner_email,
          notes: item.notes,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error: any) {
      this.logger.error(`Failed to lookup Sales Orders: ${error.message}`);
      throw new HttpException(
        `Failed to lookup Sales Orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/testing/lookup/wa', 'api/v1/plugins/testing/lookup/wa'])
  async lookupWorkAuthorizations(
    @Query('soId') soId?: string,
    @Query('soNumber') soNumber?: string,
    @Query('waNumber') waNumber?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '100',
  ) {
    try {
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const qb = waRepo
        .createQueryBuilder('wa')
        .leftJoinAndSelect('wa.so', 'so')
        .orderBy('wa.created_at', 'DESC');

      if (soId) {
        qb.andWhere('wa.so_id = :soId', { soId });
      }
      if (soNumber) {
        qb.andWhere('so.so_number ILIKE :soNumber', { soNumber: `%${soNumber.trim()}%` });
      }
      if (waNumber) {
        qb.andWhere('wa.wa_number ILIKE :waNumber', { waNumber: `%${waNumber.trim()}%` });
      }

      const term = (search || '').trim();
      if (term) {
        qb.andWhere(
          '(wa.wa_number ILIKE :term OR wa.item_code ILIKE :term OR so.so_number ILIKE :term)',
          { term: `%${term}%` },
        );
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);

      const [items, total] = await qb.getManyAndCount();

      return {
        data: items.map((w) => ({
          id: w.id,
          soId: w.so_id,
          soNumber: w.so?.so_number,
          waNumber: w.wa_number,
          itemCode: w.item_code,
          plannedQuantity: w.planned_quantity,
          notes: w.notes,
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error: any) {
      this.logger.error(`Failed to lookup Work Authorizations: ${error.message}`);
      throw new HttpException(
        `Failed to lookup Work Authorizations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/testing/lookup/items', 'api/v1/plugins/testing/lookup/items'])
  async lookupItemCodes(
    @Query('soId') soId?: string,
    @Query('waId') waId?: string,
    @Query('search') search?: string,
  ) {
    try {
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const qb = waRepo
        .createQueryBuilder('wa')
        .select('DISTINCT wa.item_code', 'itemCode')
        .addSelect('wa.wa_number', 'waNumber')
        .addSelect('wa.id', 'waId')
        .addSelect('wa.so_id', 'soId')
        .where('wa.item_code IS NOT NULL AND wa.item_code != \'\'');

      if (soId) {
        qb.andWhere('wa.so_id = :soId', { soId });
      }
      if (waId) {
        qb.andWhere('wa.id = :waId', { waId });
      }
      if (search && search.trim()) {
        qb.andWhere('wa.item_code ILIKE :search', { search: `%${search.trim()}%` });
      }

      const rawItems = await qb.getRawMany();
      return rawItems.map((r) => ({
        itemCode: r.itemCode,
        waNumber: r.waNumber,
        waId: r.waId,
        soId: r.soId,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to lookup Item Codes: ${error.message}`);
      throw new HttpException(
        `Failed to lookup Item Codes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 2. DEVICE REGISTRATION & MANAGEMENT
  // ============================================================================

  @Get(['api/plugins/testing/devices', 'api/v1/plugins/testing/devices'])
  async getDevices(
    @Query('search') search?: string,
    @Query('deviceType') deviceType?: string,
    @Query('status') status?: string,
    @Query('soId') soId?: string,
    @Query('soNumber') soNumber?: string,
    @Query('waId') waId?: string,
    @Query('waNumber') waNumber?: string,
    @Query('itemCode') itemCode?: string,
    @Query('pluginId') pluginId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const qb = deviceRepo.createQueryBuilder('dev');

      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        qb.andWhere(
          '(dev.serial_number ILIKE :term OR dev.device_name ILIKE :term OR dev.network_id ILIKE :term OR dev.item_code ILIKE :term)',
          { term },
        );
      }
      if (deviceType) {
        qb.andWhere('dev.device_type = :deviceType', { deviceType });
      }
      if (status) {
        qb.andWhere('dev.status = :status', { status });
      }
      if (soId) {
        qb.andWhere('dev.so_id = :soId', { soId });
      }
      if (soNumber) {
        qb.andWhere('dev.so_number ILIKE :soNumber', { soNumber: `%${soNumber.trim()}%` });
      }
      if (waId) {
        qb.andWhere('dev.wa_id = :waId', { waId });
      }
      if (waNumber) {
        qb.andWhere('dev.wa_number ILIKE :waNumber', { waNumber: `%${waNumber.trim()}%` });
      }
      if (itemCode) {
        qb.andWhere('dev.item_code ILIKE :itemCode', { itemCode: `%${itemCode.trim()}%` });
      }
      if (pluginId) {
        qb.andWhere('dev.plugin_id = :pluginId', { pluginId });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('dev.created_at', 'DESC');

      const [items, total] = await qb.getManyAndCount();

      // Check which devices are currently running in an active test batch
      const runningBatchMap: Record<string, string> = {};
      try {
        const ds = this.databaseService.getDataSourceForTable('devices');
        if (ds && items.length > 0) {
          const serials = items.map((i) => i.serial_number).filter(Boolean);
          if (serials.length > 0) {
            const runningRows = await ds.query(
              `SELECT bi.serial_number, b.batch_code
               FROM system_schema.device_test_batch_items bi
               JOIN system_schema.device_test_batches b ON bi.batch_id = b.id
               WHERE b.status = 'RUNNING' AND bi.serial_number = ANY($1)`,
              [serials],
            );
            for (const r of runningRows) {
              if (r.serial_number) {
                runningBatchMap[r.serial_number.toLowerCase()] = r.batch_code;
              }
            }
          }
        }
      } catch (err: any) {
        this.logger.debug(`Could not query running batch items: ${err.message}`);
      }

      return {
        data: items.map((d) => {
          const runningInBatch = d.serial_number ? runningBatchMap[d.serial_number.toLowerCase()] : null;
          return {
            id: d.id,
            serialNumber: d.serial_number,
            networkId: d.network_id,
            deviceName: d.device_name,
            deviceType: d.device_type,
            pluginId: d.plugin_id,
            soId: d.so_id,
            soNumber: d.so_number,
            waId: d.wa_id,
            waNumber: d.wa_number,
            itemCode: d.item_code,
            status: runningInBatch ? 'RUNNING_BATCH' : d.status,
            isRunningBatch: !!runningInBatch,
            runningBatchCode: runningInBatch || null,
            metadata: d.metadata || {},
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          };
        }),
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get devices: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve testing devices: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get([
    'api/plugins/testing/devices/simulation',
    'api/v1/plugins/testing/devices/simulation',
    'api/plugins/testing/simulation/devices',
    'api/v1/plugins/testing/simulation/devices',
    'api/plugins/testing/simulation-devices',
    'api/v1/plugins/testing/simulation-devices',
  ])
  async getSimulationDevices(@Query('label') label?: string) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (ds) {
        try {
          const rows = await ds.query(`
            SELECT
              id,
              serial_number,
              network_id,
              device_name,
              device_type,
              status,
              plugin_id,
              so_number,
              wa_number,
              item_code,
              metadata,
              created_at,
              updated_at
            FROM system_schema.v_simulation_devices
            WHERE status = 'simulation'
            ORDER BY updated_at DESC
          `);
          if (Array.isArray(rows)) {
            return {
              success: true,
              total: rows.length,
              data: rows.map((d: any) => ({
                id: d.id,
                serialNumber: d.serial_number,
                networkId: d.network_id,
                deviceName: d.device_name,
                deviceType: d.device_type,
                status: d.status,
                pluginId: d.plugin_id,
                soNumber: d.so_number,
                waNumber: d.wa_number,
                itemCode: d.item_code,
                metadata: d.metadata,
                createdAt: d.created_at,
                updatedAt: d.updated_at,
              })),
            };
          }
        } catch {}
      }

      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const devices = await deviceRepo
        .createQueryBuilder('device')
        .where('device.status = :status', {
          status: 'simulation',
        })
        .orderBy('device.updated_at', 'DESC')
        .getMany();

      return {
        success: true,
        total: devices.length,
        data: devices.map((d) => ({
          id: d.id,
          serialNumber: d.serial_number,
          networkId: d.network_id,
          deviceName: d.device_name,
          deviceType: d.device_type,
          status: d.status,
          pluginId: d.plugin_id,
          soNumber: d.so_number,
          waNumber: d.wa_number,
          itemCode: d.item_code,
          metadata: d.metadata,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get simulation devices: ${error.message}`);
      return {
        success: true,
        data: [],
        total: 0,
      };
    }
  }

  @Get(['api/plugins/testing/devices/:id', 'api/v1/plugins/testing/devices/:id'])
  async getDeviceById(@Param('id') id: string): Promise<any> {
    if (id === 'simulation') {
      return this.getSimulationDevices();
    }
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let device: any = null;
      if (isUuid) {
        device = await deviceRepo.findOne({ where: { id } });
      } else {
        device = await deviceRepo
          .findOne({
            where: [{ serial_number: id }, { network_id: id }],
          })
          .catch(() => null);
        if (!device) {
          device = await deviceRepo.findOne({ where: { id } }).catch(() => null);
        }
      }
      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      // Fetch last 20 packets for this device
      const recentPackets = await packetRepo.find({
        where: { device_id: id },
        order: { created_at: 'DESC' },
        take: 20,
      });

      return {
        id: device.id,
        serialNumber: device.serial_number,
        networkId: device.network_id,
        deviceName: device.device_name,
        deviceType: device.device_type,
        pluginId: device.plugin_id,
        soId: device.so_id,
        soNumber: device.so_number,
        waId: device.wa_id,
        waNumber: device.wa_number,
        itemCode: device.item_code,
        status: device.status,
        metadata: device.metadata || {},
        createdAt: device.created_at,
        updatedAt: device.updated_at,
        recentPackets: recentPackets.map((p) => ({
          id: p.id,
          packetType: p.packet_type,
          fPort: p.f_port,
          fCnt: p.f_cnt,
          rawPayload: p.raw_payload,
          decodedPayload: p.decoded_payload || {},
          rfInfo: p.rf_info || {},
          devEui: p.dev_eui || p.device?.network_id,
          rssi: p.rssi ?? p.rf_info?.rssi,
          snr: p.snr ?? p.rf_info?.snr,
          sf: p.sf ?? p.rf_info?.sf,
          frequency: p.frequency ?? p.rf_info?.frequency,
          createdAt: p.created_at,
        })),
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get device ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve device details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(['api/plugins/testing/devices', 'api/v1/plugins/testing/devices'])
  async registerDevice(@Body() body: RegisterTestingDeviceDto) {
    if (!body.serialNumber || !body.serialNumber.trim()) {
      throw new BadRequestException('serialNumber is required');
    }
    if (!body.deviceName || !body.deviceName.trim()) {
      throw new BadRequestException('deviceName is required');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );

      // Check serial uniqueness
      const existing = await deviceRepo.findOne({
        where: { serial_number: body.serialNumber.trim() },
      });
      if (existing) {
        throw new BadRequestException(
          `Device with serialNumber '${body.serialNumber.trim()}' already exists (ID: ${existing.id})`,
        );
      }

      // Resolve SO details
      let resolvedSoId = body.soId;
      let resolvedSoNumber = body.soNumber;
      if (resolvedSoId && !resolvedSoNumber) {
        const so = await soRepo.findOne({ where: { id: resolvedSoId } });
        if (so) resolvedSoNumber = so.so_number;
      } else if (!resolvedSoId && resolvedSoNumber) {
        const so = await soRepo.findOne({ where: { so_number: resolvedSoNumber } });
        if (so) resolvedSoId = so.id;
      }

      // Resolve WA details
      let resolvedWaId = body.waId;
      let resolvedWaNumber = body.waNumber;
      let resolvedItemCode = body.itemCode;
      if (resolvedWaId) {
        const wa = await waRepo.findOne({ where: { id: resolvedWaId } });
        if (wa) {
          resolvedWaNumber = resolvedWaNumber || wa.wa_number;
          resolvedItemCode = resolvedItemCode || wa.item_code || undefined;
          if (!resolvedSoId && wa.so_id) {
            resolvedSoId = wa.so_id;
            const so = await soRepo.findOne({ where: { id: wa.so_id } });
            if (so) resolvedSoNumber = so.so_number;
          }
        }
      } else if (resolvedWaNumber) {
        const wa = await waRepo.findOne({ where: { wa_number: resolvedWaNumber } });
        if (wa) {
          resolvedWaId = wa.id;
          resolvedItemCode = resolvedItemCode || wa.item_code || undefined;
          if (!resolvedSoId && wa.so_id) {
            resolvedSoId = wa.so_id;
            const so = await soRepo.findOne({ where: { id: wa.so_id } });
            if (so) resolvedSoNumber = so.so_number;
          }
        }
      }

      const newDevice = deviceRepo.create({
        serial_number: body.serialNumber.trim(),
        device_name: body.deviceName.trim(),
        device_type: body.deviceType?.trim() || 'end_device',
        network_id: body.networkId?.trim() || null,
        plugin_id: body.pluginId?.trim() || 'testing',
        so_id: resolvedSoId || null,
        so_number: resolvedSoNumber || null,
        wa_id: resolvedWaId || null,
        wa_number: resolvedWaNumber || null,
        item_code: resolvedItemCode || null,
        status: body.status?.trim() || 'active',
        metadata: body.metadata || {},
      });

      const saved = await deviceRepo.save(newDevice);

      // Notify realtime if available
      try {
        this.realtimeService?.publishPluginLifecycle('testing:device_registered', {
          device: saved,
        });
      } catch (_) {}

      return {
        message: 'Device registered successfully',
        data: {
          id: saved.id,
          serialNumber: saved.serial_number,
          networkId: saved.network_id,
          deviceName: saved.device_name,
          deviceType: saved.device_type,
          pluginId: saved.plugin_id,
          soId: saved.so_id,
          soNumber: saved.so_number,
          waId: saved.wa_id,
          waNumber: saved.wa_number,
          itemCode: saved.item_code,
          status: saved.status,
          metadata: saved.metadata,
          createdAt: saved.created_at,
          updatedAt: saved.updated_at,
        },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to register device: ${error.message}`);
      throw new HttpException(
        `Failed to register device: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(['api/plugins/testing/devices/:id', 'api/v1/plugins/testing/devices/:id'])
  async updateDevice(@Param('id') id: string, @Body() body: Partial<RegisterTestingDeviceDto>) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const device = await deviceRepo.findOne({ where: { id } });
      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      if (body.deviceName !== undefined) device.device_name = body.deviceName.trim();
      if (body.deviceType !== undefined) device.device_type = body.deviceType.trim();
      if (body.networkId !== undefined) device.network_id = body.networkId?.trim() || null;
      if (body.pluginId !== undefined) device.plugin_id = body.pluginId.trim();
      if (body.soId !== undefined) device.so_id = body.soId || null;
      if (body.soNumber !== undefined) device.so_number = body.soNumber || null;
      if (body.waId !== undefined) device.wa_id = body.waId || null;
      if (body.waNumber !== undefined) device.wa_number = body.waNumber || null;
      if (body.itemCode !== undefined) device.item_code = body.itemCode || null;
      if (body.status !== undefined) device.status = body.status.trim();
      if (body.metadata !== undefined) {
        device.metadata = { ...device.metadata, ...body.metadata };
      }

      const updated = await deviceRepo.save(device);

      return {
        message: 'Device updated successfully',
        data: updated,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update device ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to update device: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(['api/plugins/testing/devices/:id', 'api/v1/plugins/testing/devices/:id'])
  async deleteDevice(@Param('id') id: string) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const device = await deviceRepo.findOne({ where: { id } });
      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      await deviceRepo.remove(device);
      return { message: `Device ${id} deleted successfully` };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete device ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to delete device: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 3. PACKET INGESTION & QUERYING
  // ============================================================================

  @Get([
    'api/plugins/testing/packets',
    'api/v1/plugins/testing/packets',
    'api/plugins/testing/device-payloads',
    'api/v1/plugins/testing/device-payloads',
  ])
  async getPackets(
    @Query('deviceId') deviceId?: string,
    @Query('networkId') networkId?: string,
    @Query('dev_eui') devEui?: string,
    @Query('devEui') devEuiCamel?: string,
    @Query('packetType') packetType?: string,
    @Query('fPort') fPort?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );
      const qb = packetRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.device', 'dev')
        .orderBy('p.created_at', 'DESC');

      if (deviceId) {
        qb.andWhere('p.device_id = :deviceId', { deviceId });
      }
      const targetDevEui = devEui || devEuiCamel;
      if (targetDevEui) {
        qb.andWhere('(p.dev_eui ILIKE :targetDevEui OR dev.network_id ILIKE :targetDevEui)', {
          targetDevEui: `%${targetDevEui.trim()}%`,
        });
      }
      if (networkId) {
        qb.andWhere('(dev.network_id ILIKE :networkId OR dev.serial_number ILIKE :networkId)', {
          networkId: `%${networkId.trim()}%`,
        });
      }
      if (packetType) {
        qb.andWhere('p.packet_type ILIKE :packetType', { packetType: `%${packetType.trim()}%` });
      }
      if (fPort !== undefined && fPort !== '') {
        const portNum = parseInt(fPort, 10);
        if (!isNaN(portNum)) {
          qb.andWhere('p.f_port = :portNum', { portNum });
        }
      }
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        qb.andWhere(
          '(p.raw_payload ILIKE :term OR CAST(p.decoded_payload AS text) ILIKE :term OR CAST(p.rf_info AS text) ILIKE :term)',
          { term },
        );
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);

      const [items, total] = await qb.getManyAndCount();

      return {
        data: items.map((p) => ({
          id: p.id,
          deviceId: p.device_id,
          device: p.device
            ? {
                id: p.device.id,
                serialNumber: p.device.serial_number,
                networkId: p.device.network_id,
                deviceName: p.device.device_name,
                deviceType: p.device.device_type,
                soNumber: p.device.so_number,
                waNumber: p.device.wa_number,
                itemCode: p.device.item_code,
              }
            : null,
          packetType: p.packet_type,
          fPort: p.f_port,
          fCnt: p.f_cnt,
          rawPayload: p.raw_payload,
          decodedPayload: p.decoded_payload || {},
          rfInfo: p.rf_info || {},
          devEui: p.dev_eui || p.device?.network_id,
          rssi: p.rssi ?? p.rf_info?.rssi,
          snr: p.snr ?? p.rf_info?.snr,
          sf: p.sf ?? p.rf_info?.sf,
          frequency: p.frequency ?? p.rf_info?.frequency,
          createdAt: p.created_at,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get packets: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve device packets: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async performChirpstackHttpRegistration(
    callbackUrl: string,
    secret: string,
  ): Promise<{ applicationId: string; callbackUrl: string; updated: boolean }> {
    const parsed = new URL(callbackUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new BadRequestException('Webhook URL must use HTTP or HTTPS');
    }
    const repo = this.databaseService.getRepositoryForTable(
      'lorawan_chirpstack',
      ChirpstackNetworkServerEntity,
    );
    const server = await repo.findOne({ where: { isActive: true } });
    if (!server?.applicationId || !server.apiToken) {
      throw new BadRequestException('Active server requires default applicationId and apiToken');
    }
    const url = `${server.apiUrl.replace(/\/$/, '')}/api/applications/${encodeURIComponent(server.applicationId)}/integrations/http`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${server.apiToken}`,
      'Grpc-Metadata-Authorization': `Bearer ${server.apiToken}`,
    };
    const existing = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (!existing.ok && existing.status !== 404) {
      throw new BadRequestException(`Integration lookup failed: HTTP ${existing.status}`);
    }

    const response = await fetch(url, {
      method: existing.ok ? 'PUT' : 'POST',
      headers,
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        integration: {
          applicationId: server.applicationId,
          encoding: 'JSON',
          eventEndpointUrl: callbackUrl,
          headers: { 'x-testing-webhook-token': secret },
        },
      }),
    });
    if (!response.ok) {
      throw new BadRequestException(`Integration registration failed: HTTP ${response.status}`);
    }
    return { applicationId: server.applicationId, callbackUrl, updated: existing.ok };
  }

  @Post(['api/plugins/testing/integrations/chirpstack/register', 'api/v1/plugins/testing/integrations/chirpstack/register'])
  async registerChirpstackHttpIntegration(@Body() body?: any) {
    const callbackUrl = (body?.webhookUrl || body?.callbackUrl || body?.eventEndpointUrl || process.env.TESTING_CHIRPSTACK_WEBHOOK_URL || '').trim();
    const secret = (body?.webhookToken || body?.token || process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN || '').trim();
    if (!callbackUrl || !secret) {
      throw new BadRequestException(
        'Configure TESTING_CHIRPSTACK_WEBHOOK_URL and TESTING_CHIRPSTACK_WEBHOOK_TOKEN or provide webhookUrl & webhookToken in body',
      );
    }
    const result = await this.performChirpstackHttpRegistration(callbackUrl, secret);
    return { success: true, data: result };
  }

  @Get([
    'lorawan/chirpstack/status',
    'api/lorawan/chirpstack/status',
    'api/plugins/testing/integrations/chirpstack/status',
    'api/v1/plugins/testing/integrations/chirpstack/status',
  ])
  async getChirpstackIntegrationStatus() {
    const ds = this.databaseService.getDataSourceForTable('devices');
    const recentPackets = await ds.query(
      `SELECT id, dev_eui, packet_type, f_port, f_cnt, raw_payload, decoded_payload, rf_info, created_at
       FROM devices.device_packets
       ORDER BY created_at DESC
       LIMIT 5`,
    ).catch(() => []);

    let server: any = null;
    try {
      const repo = this.databaseService.getRepositoryForTable(
        'lorawan_chirpstack',
        ChirpstackNetworkServerEntity,
      );
      if (repo && typeof repo.findOne === 'function') {
        server = await repo.findOne({ where: { isActive: true } });
      }
    } catch {
      server = null;
    }

    return {
      success: true,
      data: {
        webhookListening: true,
        supportedUplinkRoutes: [
          '/lorawan/chirpstack/uplink',
          '/api/lorawan/chirpstack/uplink',
          '/api/plugins/testing/integrations/chirpstack/uplink',
          '/api/v1/plugins/testing/integrations/chirpstack/uplink',
        ],
        tokenConfigured: Boolean(process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN),
        webhookUrlEnv: process.env.TESTING_CHIRPSTACK_WEBHOOK_URL || null,
        activeServer: server
          ? {
              id: server.id,
              name: server.name,
              apiUrl: server.apiUrl,
              applicationId: server.applicationId,
              tenantId: server.tenantId,
            }
          : null,
        recentUplinkCount: recentPackets.length,
        recentPackets: recentPackets.map((p: any) => ({
          id: p.id,
          devEui: p.dev_eui,
          fCnt: p.f_cnt,
          rawPayload: p.raw_payload,
          decodedPayload: p.decoded_payload,
          rfInfo: p.rf_info,
          createdAt: p.created_at,
        })),
      },
    };
  }

  @Post([
    'lorawan/chirpstack/uplink',
    'api/lorawan/chirpstack/uplink',
    'api/v1/lorawan/chirpstack/uplink',
    'api/plugins/testing/integrations/chirpstack/uplink',
    'api/v1/plugins/testing/integrations/chirpstack/uplink',
  ])
  async ingestChirpstackUplink(
    @Body() body: any,
    @Headers('x-testing-webhook-token') token?: string,
    @Query('event') event?: string,
  ) {
    const rawDevEui = body?.deviceInfo?.devEui || body?.devEUI || body?.devEui || 'unknown';
    this.logger.log(
      `📥 [ChirpStack Webhook] Nhận request tới uplink: event='${event || 'none'}', devEui='${rawDevEui}'`,
    );

    const secret = process.env.TESTING_CHIRPSTACK_WEBHOOK_TOKEN;
    if (!secret || token !== secret) {
      this.logger.warn(
        `⛔ [ChirpStack Webhook] Từ chối request do token không khớp! Header nhận: '${token ? '***' : '(trống)'}', yêu cầu: '${secret ? '(đã cấu hình)' : '(chưa cấu hình)'}'`,
      );
      throw new UnauthorizedException('Invalid webhook token');
    }
    if (event && event !== 'up') {
      this.logger.log(`ℹ️ [ChirpStack Webhook] Bỏ qua sự kiện không phải uplink: event='${event}'`);
      return { success: true, ignored: true };
    }
    const devEui = body?.deviceInfo?.devEui || body?.devEUI || body?.devEui;
    if (typeof devEui !== 'string' || !/^[0-9a-f]{16}$/i.test(devEui)) {
      throw new BadRequestException('A valid devEui is required');
    }
    if (typeof body.data !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.data)) {
      throw new BadRequestException('data must be base64');
    }
    const rawPayload = Buffer.from(body.data, 'base64').toString('hex').toUpperCase();
    const deviceRepo = this.databaseService.getRepositoryForTable('devices', TestingDeviceEntity);
    const device = await deviceRepo.createQueryBuilder('d')
      .where('LOWER(d.network_id) = LOWER(:devEui)', { devEui }).getOne();
    const ds = this.databaseService.getDataSourceForTable('devices');
    const registrations = await ds.query(`SELECT r.item_code, r.fw_code, r.fw_version, COALESCE(to_jsonb(r)->>'long_fw', r.fw_version) AS long_fw FROM system_schema.device_test_registrations r WHERE LOWER(r.dev_eui) = LOWER($1) ORDER BY r.created_at DESC LIMIT 1`, [devEui]);
    const registration = registrations[0] || {};
    let decodedPayload: Record<string, any> = {};
    let decodeError: string | null = null;
    const decoder = new DecoderAdapterController(this.databaseService);
    const resolved = await decoder.resolveDecoderScript({
      itemCode: registration.item_code || device?.item_code,
      fwCode: registration.fw_code,
      sku: device?.metadata?.sku,
      longFw: registration.long_fw || registration.fw_version || device?.metadata?.longFw,
    });
    if (resolved.matched) {
      const result = await decoder.testDecoder({ script: resolved.matched.script, payload: rawPayload, inputFormat: 'hex', fPort: body.fPort });
      decodedPayload = result.success ? result.data : {};
      if (!result.success) decodeError = result.errors.join('; ');
    } else {
      decodeError = 'No active decoder matched';
    }
    const rx = body.rxInfo?.[0] || {};
    const numberOrNull = (value: any) => value !== undefined && value !== null && Number.isFinite(Number(value)) ? Number(value) : null;
    const rawFreq = numberOrNull(body.txInfo?.frequency);
    const freqMhz = (rawFreq && rawFreq > 1000000) ? Number((rawFreq / 1000000).toFixed(3)) : rawFreq;
    const rfInfo = {
      rssi: numberOrNull(rx.rssi), snr: numberOrNull(rx.snr ?? rx.loRaSNR),
      sf: numberOrNull(body.txInfo?.modulation?.lora?.spreadingFactor ?? body.txInfo?.dataRate?.spreadFactor),
      frequency: rawFreq,
      frequencyMhz: freqMhz,
      devEui: devEui.toLowerCase(),
      itemCode: registration.item_code || device?.item_code, fwCode: registration.fw_code,
      decodeError,
    };
    const repo = this.databaseService.getRepositoryForTable('device_packets', DevicePacketEntity);
    let packet: any;
    try {
      packet = await repo.save(repo.create({
        device_id: device?.id || null, dev_eui: devEui.toLowerCase(), packet_type: 'uplink',
        f_port: numberOrNull(body.fPort), f_cnt: numberOrNull(body.fCnt),
        raw_payload: rawPayload, decoded_payload: decodedPayload, rf_info: rfInfo,
        rssi: rfInfo.rssi, snr: rfInfo.snr, sf: rfInfo.sf, frequency: freqMhz,
      }));
    } catch (saveErr: any) {
      const isSfError = saveErr?.message?.includes('sf') || saveErr?.code === '42703';
      const isOverflow = saveErr?.message?.includes('overflow') || saveErr?.code === '22003';
      if (isSfError || isOverflow) {
        const ds = this.databaseService.getDataSourceForTable('devices');
        const inserted = await ds.query(
          `INSERT INTO devices.device_packets (device_id, dev_eui, packet_type, f_port, f_cnt, raw_payload, decoded_payload, rf_info, rssi, snr, frequency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING *`,
          [device?.id || null, devEui.toLowerCase(), 'uplink', numberOrNull(body.fPort), numberOrNull(body.fCnt), rawPayload, JSON.stringify(decodedPayload), JSON.stringify(rfInfo), rfInfo.rssi, rfInfo.snr, freqMhz],
        );
        packet = inserted[0];
      } else {
        throw saveErr;
      }
    }

    // Sync to system_schema.device_packets so views and queries stay in sync
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (ds) {
        await ds.query(
          `INSERT INTO system_schema.device_packets (
            device_id, dev_eui, packet_type, f_port, f_cnt, raw_payload, decoded_payload, rf_info, rssi, snr, frequency
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            device?.id || null,
            devEui.toLowerCase(),
            'uplink',
            numberOrNull(body.fPort),
            numberOrNull(body.fCnt),
            rawPayload,
            JSON.stringify(decodedPayload),
            JSON.stringify(rfInfo),
            rfInfo.rssi,
            rfInfo.snr,
            freqMhz,
          ]
        ).catch(() => {});
      }
    } catch {}
    this.logger.log(
      `📥 [ChirpStack Webhook] Nhận uplink thành công -> DevEUI: ${devEui.toLowerCase()}, fCnt: ${numberOrNull(body.fCnt)}, RSSI: ${rfInfo.rssi} dBm, SNR: ${rfInfo.snr} dB, SF: ${rfInfo.sf}, Freq: ${rfInfo.frequency} Hz, Raw: ${rawPayload}`,
    );
    if (decodeError) {
      this.logger.warn(`⚠️ [ChirpStack Webhook] DevEUI: ${devEui.toLowerCase()} - Ghi chú giải mã: ${decodeError}`);
    } else {
      this.logger.log(
        `✅ [ChirpStack Webhook] DevEUI: ${devEui.toLowerCase()} - Giải mã sensor thành công: ${JSON.stringify(decodedPayload)}`,
      );
    }
    this.realtimeService?.publishPluginLifecycle('testing:packet:received', {
      deviceId: device?.id || null, packetId: packet.id, devEui: devEui.toLowerCase(),
      packetType: 'uplink', fPort: packet.f_port, fCnt: packet.f_cnt,
      rawPayload, decodedPayload, rfInfo, ...rfInfo,
    });
    return { success: true, data: { id: packet.id, decodeError } };
  }

  @Post(['api/plugins/testing/packets', 'api/v1/plugins/testing/packets'])
  async ingestPacket(@Body() body: IngestPacketDto) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );

      let targetDeviceId = body.deviceId;

      // If deviceId not given, resolve via networkId or serialNumber
      if (!targetDeviceId && body.networkId) {
        const found = await deviceRepo.findOne({
          where: [
            { network_id: body.networkId.trim() },
            { serial_number: body.networkId.trim() },
          ],
        });
        if (found) {
          targetDeviceId = found.id;
        }
      }

      if (!targetDeviceId) {
        throw new BadRequestException(
          'Target device could not be identified. Provide a valid deviceId or matching networkId/serialNumber',
        );
      }

      const packet = packetRepo.create({
        device_id: targetDeviceId,
        packet_type: body.packetType?.toLowerCase() || 'uplink',
        f_port: body.fPort !== undefined ? Number(body.fPort) : null,
        f_cnt: body.fCnt !== undefined ? String(body.fCnt) : null,
        raw_payload: body.rawPayload || null,
        decoded_payload: body.decodedPayload || {},
        rf_info: body.rfInfo || {},
      });

      const saved = await packetRepo.save(packet);

      // Realtime notification
      try {
        this.realtimeService?.publishTelemetry({
          deviceId: targetDeviceId,
          packet: saved,
        });
        this.realtimeService?.publishPluginLifecycle('testing:packet_received', {
          packet: saved,
          deviceId: targetDeviceId,
        });
      } catch (_) {}

      return {
        message: 'Packet logged successfully',
        data: saved,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to ingest packet: ${error.message}`);
      throw new HttpException(
        `Failed to log packet: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 4. GATEWAY TEST SESSIONS
  // ============================================================================

  @Get(['api/plugins/testing/gateway-sessions', 'api/v1/plugins/testing/gateway-sessions'])
  async getGatewaySessions(
    @Query('gatewayId') gatewayId?: string,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const sessionRepo = this.databaseService.getRepositoryForTable(
        'gateway_test_sessions',
        GatewayTestSessionEntity,
      );
      const qb = sessionRepo.createQueryBuilder('s');

      if (gatewayId) {
        qb.andWhere('s.gateway_id ILIKE :gatewayId', { gatewayId: `%${gatewayId.trim()}%` });
      }
      if (status) {
        qb.andWhere('s.status = :status', { status });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('s.created_at', 'DESC');

      const [items, total] = await qb.getManyAndCount();

      return {
        data: items,
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get gateway test sessions: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve gateway test sessions: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post([
    'api/plugins/testing/gateway-sessions',
    'api/v1/plugins/testing/gateway-sessions',
    'api/plugins/testing/gateway-sessions/register-and-start',
    'api/v1/plugins/testing/gateway-sessions/register-and-start',
  ])
  async createGatewaySession(@Body() body: CreateGatewaySessionDto) {
    const gwId = (body.gatewayId || body.eui || body.serialNumber || '').trim();
    if (!gwId) {
      throw new BadRequestException('gatewayId or eui is required');
    }

    try {
      const sessionRepo = this.databaseService.getRepositoryForTable(
        'gateway_test_sessions',
        GatewayTestSessionEntity,
      );

      const session = sessionRepo.create({
        gateway_id: gwId,
        gateway_name: body.gatewayName?.trim() || (body.serialNumber ? `GW-${body.serialNumber.trim()}` : null),
        session_name: body.sessionName?.trim() || (body.serialNumber ? `Session-${body.serialNumber.trim()}` : null),
        status: body.status?.trim() || 'IN_PROGRESS',
        started_at: new Date(),
        summary: body.summary || {},
        so_number: body.soNumber?.trim() || null,
        wa_number: body.waNumber?.trim() || null,
        serial_number: body.serialNumber?.trim() || null,
        eui: body.eui?.trim() || gwId,
        item_code: body.itemCode?.trim() || null,
        sku: body.sku?.trim() || null,
        gateway_notes: (body.gatewayNotes || body.notes)?.trim() || null,
        hardware_version: body.hardwareVersion?.trim() || null,
        firmware_version: body.firmwareVersion?.trim() || null,
        mechanical_version: body.mechanicalVersion?.trim() || null,
        lte_module_serial_number: body.lteModuleSerialNumber?.trim() || null,
        lte_module_imei: body.lteModuleImei?.trim() || null,
        gateway_ip: body.gatewayIp?.trim() || null,
        internet_test_type: body.internetTestType?.trim() || 'ETHERNET',
        region_test: body.regionTest?.trim() || null,
        network_server_id: body.networkServerId?.trim() || null,
        lorawan_frequency_plan: body.lorawanFrequencyPlan?.trim() || null,
        config_snapshot: body.configSnapshot || {},
        forwarder_config: body.forwarderConfig || {},
      });

      const saved = await sessionRepo.save(session);
      return {
        message: 'Gateway test session created',
        data: saved,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to create gateway test session: ${error.message}`);
      throw new HttpException(
        `Failed to create gateway test session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/testing/gateway-sessions/:id', 'api/v1/plugins/testing/gateway-sessions/:id'])
  async getGatewaySessionById(@Param('id') id: string) {
    try {
      const sessionRepo = this.databaseService.getRepositoryForTable(
        'gateway_test_sessions',
        GatewayTestSessionEntity,
      );
      const session = await sessionRepo.findOne({ where: { id } });
      if (!session) {
        throw new NotFoundException(`Gateway test session with ID ${id} not found`);
      }
      return session;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to get gateway test session ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to get session details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(['api/plugins/testing/gateway-sessions/:id', 'api/v1/plugins/testing/gateway-sessions/:id'])
  async updateGatewaySession(
    @Param('id') id: string,
    @Body() body: { status?: string; endedAt?: Date | string; summary?: Record<string, any> },
  ) {
    try {
      const sessionRepo = this.databaseService.getRepositoryForTable(
        'gateway_test_sessions',
        GatewayTestSessionEntity,
      );
      const session = await sessionRepo.findOne({ where: { id } });
      if (!session) {
        throw new NotFoundException(`Gateway test session with ID ${id} not found`);
      }

      if (body.status !== undefined) session.status = body.status;
      if (body.endedAt !== undefined) session.ended_at = new Date(body.endedAt);
      if (body.summary !== undefined) {
        session.summary = { ...session.summary, ...body.summary };
      }

      const saved = await sessionRepo.save(session);
      return {
        message: 'Gateway test session updated',
        data: saved,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update gateway test session ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to update gateway session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 6. GATEWAY PROXY (Direct Port 4050 Integration)
  // ============================================================================

  @Get(['api/plugins/testing/gateway-proxy/config', 'api/v1/plugins/testing/gateway-proxy/config'])
  async getGatewayProxyConfig(@Query('ip') ip?: string) {
    const gatewayIp = ip?.trim();
    if (!gatewayIp) {
      throw new BadRequestException('Query parameter "ip" is required');
    }

    const targetUrl = `http://${gatewayIp}:4050/api/gateway-config/getGatewayConfigInfo`;
    this.logger.log(`Proxying gateway config GET request to ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        throw new HttpException(
          `Gateway at ${gatewayIp}:4050 returned status ${response.status}`,
          response.status,
        );
      }

      const data = await response.json();
      return {
        success: true,
        gatewayIp,
        data: data?.data || data?.config || data,
      };
    } catch (error: any) {
      this.logger.warn(`Gateway proxy config failed for ${gatewayIp}: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to reach Gateway at ${gatewayIp}:4050: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post(['api/plugins/testing/gateway-proxy/change-config', 'api/v1/plugins/testing/gateway-proxy/change-config'])
  async changeGatewayProxyConfig(@Body() body: any) {
    const gatewayIp = (body?.gatewayIp || body?.ip || '').trim();
    if (!gatewayIp) {
      throw new BadRequestException('Field "gatewayIp" is required');
    }

    const targetUrl = `http://${gatewayIp}:4050/api/gateway-config/changeGatewayConfig`;
    this.logger.log(`Proxying gateway config POST request to ${targetUrl}`);

    const forwarderPayload = {
      server_address: body.serverAddress || body.server_address || '127.0.0.1',
      serv_port_up: body.servPortUp || body.serv_port_up || 1700,
      serv_port_down: body.servPortDown || body.serv_port_down || 1700,
      region: body.regionTest || body.region || body.frequencyPlan || 'AS923',
      metrics: body.metrics || (body.internetTestType === 'ETHERNET' ? { eth: 100, lte: 102 } : { eth: 102, lte: 100 }),
      ...body,
    };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(forwarderPayload),
        signal: AbortSignal.timeout(8000),
      });

      let resData: any = {};
      try {
        resData = await response.json();
      } catch {
        resData = { statusText: response.statusText };
      }

      if (!response.ok) {
        this.logger.warn(`Gateway returned non-OK status: ${response.status}`);
        return {
          success: false,
          status: response.status,
          message: `Gateway ${gatewayIp}:4050 responded with error`,
          data: resData,
        };
      }

      return {
        success: true,
        gatewayIp,
        message: 'Gateway configuration changed successfully',
        data: resData,
      };
    } catch (error: any) {
      this.logger.warn(`Gateway proxy change-config failed for ${gatewayIp}: ${error.message}`);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to send config to Gateway at ${gatewayIp}:4050: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ============================================================================
  // 7. DEVICE SIMULATION FLOW
  // ============================================================================

  @Post(['api/plugins/testing/simulation/run', 'api/v1/plugins/testing/simulation/run'])
  async runDeviceSimulation(@Body() body: RunSimulationDto) {
    const devEui = (body.devEui || '').trim().toUpperCase();
    if (!devEui) {
      throw new BadRequestException('Field "devEui" is required for simulation');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );

      // Check or auto-register device
      let device = await deviceRepo.findOne({
        where: [{ network_id: devEui }, { serial_number: body.serialNumber?.trim() || devEui }],
      });

      if (!device && body.serialNumber) {
        device = deviceRepo.create({
          serial_number: body.serialNumber.trim(),
          device_name: body.name || `Simulated-Node-${devEui.slice(-4)}`,
          device_type: 'lorawan_node',
          network_id: devEui,
          plugin_id: 'testing',
          so_number: body.soNumber || 'SO-SIM-AUTO',
          wa_number: body.waNumber || 'WA-SIM-AUTO',
          item_code: body.itemCode || 'ITEM-SIM',
          status: 'testing',
          metadata: { simulated: true, region: body.region || 'AS923' },
        });
        device = await deviceRepo.save(device);
      }

      const burstCount = Math.max(1, Math.min(body.burstCount || 1, 50));
      const packetsGenerated: any[] = [];
      let currentFCnt = typeof body.fCnt === 'number' ? body.fCnt : 1;

      for (let i = 0; i < burstCount; i++) {
        const rawPayload = body.payloadHex || '01020304';
        const baseRssi = body.rfInfo?.rssi ?? -75;
        const baseSnr = body.rfInfo?.snr ?? 9;
        const rssi = Math.round(baseRssi + (Math.random() * 4 - 2));
        const snr = parseFloat((baseSnr + (Math.random() * 2 - 1)).toFixed(1));

        const rfInfo = {
          rssi,
          snr,
          frequency: body.rfInfo?.frequency ?? 868100000,
          gatewayId: body.rfInfo?.gatewayId ?? 'gw-sim-01',
        };

        const packetEntity = packetRepo.create({
          device_id: device?.id || null,
          packet_type: body.packetType || 'UNCONFIRMED_DATA_UP',
          f_port: body.fPort ?? 1,
          f_cnt: currentFCnt++,
          raw_payload: rawPayload,
          decoded_payload: body.decodedPayload || {},
          rf_info: rfInfo,
        });

        const savedPacket = await packetRepo.save(packetEntity);

        // Update device last seen
        if (device) {
          device.metadata = { ...device.metadata, last_seen_at: new Date().toISOString() };
          device.status = 'testing';
          await deviceRepo.save(device);
        }

        // Realtime publish
        this.realtimeService?.publishTelemetry({
          deviceId: device?.id,
          payload: {
            networkId: devEui,
            serialNumber: device?.serial_number || body.serialNumber,
            fPort: savedPacket.f_port,
            fCnt: savedPacket.f_cnt,
            rawPayload: savedPacket.raw_payload,
            decodedPayload: savedPacket.decoded_payload,
            rfInfo: savedPacket.rf_info,
            timestamp: savedPacket.created_at,
          },
        });

        this.realtimeService?.publishPluginLifecycle('testing:packet_received', {
          packetId: savedPacket.id,
          deviceId: device?.id,
          networkId: devEui,
          serialNumber: device?.serial_number,
          rawPayload: savedPacket.raw_payload,
          decodedPayload: savedPacket.decoded_payload,
          rfInfo: savedPacket.rf_info,
          timestamp: savedPacket.created_at,
        });

        packetsGenerated.push({
          id: savedPacket.id,
          deviceId: savedPacket.device_id,
          packetType: savedPacket.packet_type,
          fPort: savedPacket.f_port,
          fCnt: savedPacket.f_cnt,
          rawPayload: savedPacket.raw_payload,
          decodedPayload: savedPacket.decoded_payload,
          rfInfo: savedPacket.rf_info,
          createdAt: savedPacket.created_at,
        });
      }

      const simulationResult = {
        simulationId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        devEui,
        serialNumber: device?.serial_number || body.serialNumber,
        status: 'completed',
        packetsGenerated,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      this.simulationResults.unshift(simulationResult);
      if (this.simulationResults.length > 100) this.simulationResults.length = 100;

      this.realtimeService?.publishPluginLifecycle('testing:simulation_completed', simulationResult);

      return {
        success: true,
        message: `Simulation completed: generated ${packetsGenerated.length} packet(s) for DevEUI ${devEui}`,
        data: simulationResult,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to execute device simulation: ${error.message}`);
      throw new HttpException(
        `Failed to run simulation: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post([
    'api/plugins/testing/simulation/profile',
    'api/v1/plugins/testing/simulation/profile',
    'api/plugins/testing/simulation/profiles',
    'api/v1/plugins/testing/simulation/profiles',
  ])
  async saveSimulationProfile(@Body() body: any) {
    const simuId = (body?.simuId || body?.id || `SIMU-${Date.now()}`).trim();
    const id = simuId;
    const serialNumber = (body?.serialNumber || body?.serial_number || `SN-TMPL-${Date.now()}`).trim();
    const networkId = (body?.networkId || body?.network_id || body?.devEui || '').trim().toUpperCase();
    const deviceName = (body?.deviceName || body?.device_name || body?.targetDeviceName || body?.profileName || simuId).trim();
    const deviceType = (body?.deviceType || body?.device_type || 'lorawan_node').trim();
    const pluginId = (body?.pluginId || body?.plugin_id || 'testing').trim();
    const soNumber = (body?.soNumber || body?.so_number || '').trim();
    const waNumber = (body?.waNumber || body?.wa_number || '').trim();
    const itemCode = (body?.itemCode || body?.item_code || '').trim();
    const longFw = (body?.longFw || body?.long_fw || '').trim();
    const fwVersion = (body?.fwVersion || body?.fw_version || longFw || '').trim();
    const sensorConnectivity = (body?.sensorConnectivity || body?.sensor_connectivity || 'LoRaWAN').trim();
    const sku = (body?.sku || '').trim();
    const flowBlocks = Array.isArray(body?.flowBlocks) ? body.flowBlocks : (Array.isArray(body?.flow_blocks) ? body.flow_blocks : []);
    const autoCheckCriteria = body?.autoCheckCriteria || body?.auto_check_criteria || {};
    const referenceDevices = Array.isArray(body?.referenceDevices) ? body.referenceDevices : (Array.isArray(body?.reference_devices) ? body.reference_devices : []);
    const simulatorDevice = body?.simulatorDevice || body?.simulator_device || null;
    const status = (body?.status || 'simulation').trim();
    const durationSeconds = this.simulationDuration(flowBlocks);
    const flowDurationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));
    const timedActions = body?.timedActions || [];

    const profile = {
      ...body,
      id,
      simuId,
      serialNumber,
      networkId,
      deviceName,
      deviceType,
      pluginId,
      soNumber,
      waNumber,
      itemCode,
      status,
      longFw,
      fwVersion,
      sensorConnectivity,
      sku,
      flowBlocks,
      autoCheckCriteria,
      referenceDevices,
      simulatorDevice,
      blocksCount: flowBlocks.length,
      duration: durationSeconds,
      name: body?.name || body?.profileName || deviceName,
      profileName: body?.profileName || deviceName,
      targetDeviceName: deviceName,
      devEui: networkId,
      flowDurationMinutes,
      timedActions,
      updatedAt: new Date().toISOString(),
    };

    // Persist before reporting success; memory must not hide failed database writes.
    try {
      const ds = this.databaseService.getDataSourceForTable('system_schema.simulation_profiles') ||
                 this.databaseService.getDataSourceForTable('devices');
      if (!ds) throw new Error('Database unavailable');
      if (ds) {
        await ds.query(
          `INSERT INTO system_schema.simulation_profiles
           (simu_id, profile_name, name, item_code, long_fw, sensor_connectivity, sku, flow_blocks, timed_actions, flow_duration_minutes, is_flow_template, fw_version, auto_check_criteria, reference_devices, simulator_device, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11, $12, $13, $14, NOW())
           ON CONFLICT (simu_id)
           DO UPDATE SET
             profile_name = EXCLUDED.profile_name,
             name = EXCLUDED.name,
             item_code = EXCLUDED.item_code,
             long_fw = EXCLUDED.long_fw,
             sensor_connectivity = EXCLUDED.sensor_connectivity,
             sku = EXCLUDED.sku,
             flow_blocks = EXCLUDED.flow_blocks,
             timed_actions = EXCLUDED.timed_actions,
             flow_duration_minutes = EXCLUDED.flow_duration_minutes,
             is_flow_template = TRUE,
             fw_version = EXCLUDED.fw_version,
             auto_check_criteria = EXCLUDED.auto_check_criteria,
             reference_devices = EXCLUDED.reference_devices,
             simulator_device = EXCLUDED.simulator_device,
             updated_at = NOW()`,
          [
            simuId,
            body?.name || body?.profileName || deviceName,
            body?.name || body?.profileName || deviceName,
            itemCode || null,
            longFw || null,
            sensorConnectivity || 'LoRaWAN',
            sku || null,
            JSON.stringify(flowBlocks),
            JSON.stringify(timedActions),
            flowDurationMinutes,
            fwVersion || null,
            JSON.stringify(autoCheckCriteria),
            JSON.stringify(referenceDevices),
            simulatorDevice ? JSON.stringify(simulatorDevice) : null,
          ]
        );

        // Cascade sync updated flow and duration to non-completed test batches referencing this profile
        try {
          await ds.query(
            `UPDATE system_schema.device_test_batches
             SET simulation_flow = $1,
                 flow_duration_seconds = $2,
                 updated_at = NOW()
             WHERE (simu_id = $3 OR simu_id IN (
               SELECT id::text FROM system_schema.simulation_profiles WHERE simu_id = $3
             ))
               AND status NOT IN ('COMPLETED', 'FINISHED')`,
            [
              JSON.stringify(flowBlocks),
              durationSeconds,
              simuId,
            ]
          );
        } catch (cascadeErr: any) {
          this.logger.warn(`Could not cascade update flow to test batches: ${cascadeErr.message}`);
        }
      }
    } catch (e: any) {
      throw new HttpException(`Không thể lưu Flow Simulation: ${e.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      success: true,
      message: 'Simulation flow profile saved successfully',
      data: profile,
    };
  }

  private simulationDuration(blocks: any[]): number {
    if (!Array.isArray(blocks)) throw new BadRequestException('flowBlocks must be an array');
    const allowedTypes = [
      'downlink',
      'clear_downlink',
      'delay',
      'wait_until_offset',
      'start_measurement',
      'stop_measurement',
      'average',
      'calculate_linear',
      'device_auto_check',
    ];
    return blocks.reduce((total, block) => {
      const fType = (block?.functionType || block?.type || '').toLowerCase().trim();
      if (!block || !allowedTypes.includes(fType)) {
        throw new BadRequestException(`Chức năng '${block?.functionType || block?.type}' không được hỗ trợ. Các hàm được hỗ trợ: ${allowedTypes.join(', ')}`);
      }
      if (fType === 'delay') {
        const seconds = Number(block.delaySeconds ?? block.duration ?? 0);
        if (!Number.isFinite(seconds) || seconds < 0) throw new BadRequestException('Delay phải là số giây không âm');
        return total + seconds;
      }
      if (fType === 'wait_until_offset') {
        const offsetSec = Number(block.offsetSeconds ?? block.offset_seconds ?? block.startOffsetSeconds ?? 0);
        if (!Number.isFinite(offsetSec) || offsetSec < 0) throw new BadRequestException('Offset seconds phải là số không âm');
        return Math.max(total, offsetSec);
      }
      if (['start_measurement', 'stop_measurement', 'average', 'calculate_linear', 'device_auto_check'].includes(fType)) {
        const duration = Number(block.durationSeconds ?? block.duration ?? block.timeoutSeconds ?? 0);
        return total + (Number.isFinite(duration) && duration > 0 ? duration : 0);
      }
      const targetDev = (block.targetDevice || block.target || 'DUT').toUpperCase().trim();
      if (!['DUT', 'REF', 'REFERENCE', 'SIMULATOR', 'DUT_REF'].includes(targetDev)) {
        throw new BadRequestException('Target phải là DUT, REF/REFERENCE, hoặc SIMULATOR');
      }
      if (fType === 'downlink') {
        block.fPort ??= 1;
        if (!Number.isInteger(block.fPort) || block.fPort < 1 || block.fPort > 223) throw new BadRequestException('fPort phải từ 1 đến 223');
        const isDynamic = Boolean(block.isDynamicPayload || block.dynamicPayload || (typeof block.payloadHex === 'string' && block.payloadHex.includes('{{')));
        if (!isDynamic) {
          if (typeof block.payloadHex !== 'string' || !/^(?:[0-9a-fA-F]{2})+$/.test(block.payloadHex)) {
            throw new BadRequestException('Payload phải là chuỗi hex chẵn hoặc template biến dynamic (ví dụ {{calib.payloadHex}})');
          }
        }
      }
      return total;
    }, 0);
  }

  @Post([
    'api/plugins/testing/simulation/calibrate-linear',
    'api/v1/plugins/testing/simulation/calibrate-linear',
  ])
  async calibrateLinear(@Body() body: any) {
    const x1 = Number(body?.x1);
    const y1 = Number(body?.y1 ?? 0);
    const x2 = Number(body?.x2);
    const y2 = Number(body?.y2 ?? 20);
    const minDeltaX = Number(body?.minDeltaX ?? 0.0001);

    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
      throw new BadRequestException('Các giá trị x1, y1, x2, y2 phải là số hợp lệ');
    }
    const deltaX = x2 - x1;
    if (Math.abs(deltaX) < minDeltaX) {
      throw new BadRequestException(`Không thể tính hiệu chuẩn: delta raw (x2 - x1 = ${deltaX}) quá nhỏ gần bằng 0 (ngưỡng tối thiểu ${minDeltaX})`);
    }

    const a = (y2 - y1) / deltaX;
    const b = y1 - a * x1;

    // IEEE-754 float32 big-endian 8 bytes hex
    const buf = Buffer.alloc(8);
    buf.writeFloatBE(a, 0);
    buf.writeFloatBE(b, 4);
    const payloadHex = buf.toString('hex').toUpperCase();

    const result = {
      a: Number(a.toFixed(6)),
      b: Number(b.toFixed(6)),
      x1: Number(x1.toFixed(4)),
      y1: Number(y1.toFixed(4)),
      x2: Number(x2.toFixed(4)),
      y2: Number(y2.toFixed(4)),
      payloadHex,
      passed: true,
      message: `Hiệu chuẩn 2 điểm: a = ${a.toFixed(6)}, b = ${b.toFixed(6)} (Payload Hex: ${payloadHex})`,
    };

    return {
      success: true,
      data: result,
    };
  }

  @Put(['api/plugins/testing/simulation/profiles/:id', 'api/v1/plugins/testing/simulation/profiles/:id'])
  async updateSimulationProfile(@Param('id') id: string, @Body() body: any) {
    const existing = await this.getSimulationProfileById(id);
    return this.saveSimulationProfile({ ...existing.data, ...body, simuId: existing.data.simuId });
  }

  @Get(['api/plugins/testing/simulation/profiles', 'api/v1/plugins/testing/simulation/profiles'])
  async getSimulationProfiles() {
    try {
      const ds =
        this.databaseService.getDataSourceForTable('system_schema.simulation_profiles') ||
        this.databaseService.getDataSourceForTable('devices');
      if (ds) {
        let dbRows: any[] = [];
        try {
          dbRows = await ds.query(`
            SELECT
              id,
              simu_id,
              COALESCE(name, profile_name, simu_id) AS "name",
              COALESCE(profile_name, name, simu_id) AS "profile_name",
              item_code,
              long_fw,
              COALESCE(fw_version, long_fw) AS "fw_version",
              sensor_connectivity,
              sku,
              flow_blocks,
              auto_check_criteria,
              reference_devices,
              simulator_device,
              flow_duration_minutes,
              timed_actions,
              created_by,
              created_at,
              updated_at
            FROM system_schema.v_simulation_flows
            ORDER BY updated_at DESC
          `);
        } catch {
          try {
            dbRows = await ds.query(`
              SELECT
                id,
                simu_id,
                COALESCE(name, profile_name, simu_id) AS "name",
                COALESCE(profile_name, name, simu_id) AS "profile_name",
                item_code,
                long_fw,
                COALESCE(fw_version, long_fw) AS "fw_version",
                sensor_connectivity,
                sku,
                flow_blocks,
                auto_check_criteria,
                reference_devices,
                simulator_device,
                flow_duration_minutes,
                timed_actions,
                created_by,
                created_at,
                updated_at
              FROM system_schema.simulation_profiles
              WHERE is_flow_template = TRUE OR is_flow_template IS NULL OR status = 'template'
              ORDER BY updated_at DESC
            `);
          } catch {
            dbRows = await ds.query(`
              SELECT
                id,
                simu_id,
                COALESCE(name, profile_name, simu_id) AS "name",
                COALESCE(profile_name, name, simu_id) AS "profile_name",
                item_code,
                long_fw,
                long_fw AS "fw_version",
                sensor_connectivity,
                sku,
                flow_blocks,
                flow_duration_minutes,
                timed_actions,
                created_by,
                created_at,
                updated_at
              FROM system_schema.simulation_profiles
              WHERE is_flow_template = TRUE OR is_flow_template IS NULL OR status = 'template'
              ORDER BY updated_at DESC
            `);
          }
        }

        if (Array.isArray(dbRows)) {
          const mapped = dbRows.map((r: any) => {
            const blocks = Array.isArray(r.flow_blocks)
              ? r.flow_blocks
              : typeof r.flow_blocks === 'string'
              ? JSON.parse(r.flow_blocks)
              : [];
            const durationMin = blocks.reduce((sum: number, b: any) => sum + (b.functionType === 'delay' ? Number(b.delaySeconds) || 0 : 0), 0) / 60;
            return {
              id: r.id || r.simu_id,
              simuId: r.simu_id,
              name: r.name || r.simu_id,
              profileName: r.profile_name || r.name || r.simu_id,
              itemCode: r.item_code,
              longFw: r.long_fw,
              fwVersion: r.fw_version || r.long_fw,
              sensorConnectivity: r.sensor_connectivity,
              sku: r.sku,
              flowBlocks: blocks,
              autoCheckCriteria: r.auto_check_criteria || {},
              referenceDevices: r.reference_devices || [],
              simulatorDevice: r.simulator_device || null,
              blocksCount: blocks.length,
              duration: durationMin * 60,
              flowDurationMinutes: durationMin,
              timedActions: r.timed_actions || [],
              createdBy: r.created_by,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            };
          });

          return {
            success: true,
            total: mapped.length,
            data: mapped,
            items: mapped,
          };
        }
      }
    } catch (err: any) {
      throw new HttpException('Không thể tải Flow Simulation', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }

  @Get([
    'api/plugins/testing/simulation/profiles/:id',
    'api/v1/plugins/testing/simulation/profiles/:id',
  ])
  async getSimulationProfileById(@Param('id') id: string) {
    const trimmedId = (id || '').trim();
    if (!trimmedId) {
      throw new BadRequestException('ID is required');
    }

    try {
      const ds =
        this.databaseService.getDataSourceForTable('system_schema.simulation_profiles') ||
        this.databaseService.getDataSourceForTable('devices');
      if (ds) {
        let rows: any[] = [];
        try {
          rows = await ds.query(
            `SELECT
              id,
              simu_id,
              COALESCE(name, profile_name, simu_id) AS "name",
              COALESCE(profile_name, name, simu_id) AS "profile_name",
              item_code,
              long_fw,
              COALESCE(fw_version, long_fw) AS "fw_version",
              sensor_connectivity,
              sku,
              flow_blocks,
              auto_check_criteria,
              reference_devices,
              simulator_device,
              flow_duration_minutes,
              timed_actions,
              created_by,
              created_at,
              updated_at
            FROM system_schema.simulation_profiles
            WHERE id::text = $1 OR simu_id = $1
            LIMIT 1`,
            [trimmedId],
          );
        } catch {
          rows = await ds.query(
            `SELECT
              id,
              simu_id,
              COALESCE(name, profile_name, simu_id) AS "name",
              COALESCE(profile_name, name, simu_id) AS "profile_name",
              item_code,
              long_fw,
              long_fw AS "fw_version",
              sensor_connectivity,
              sku,
              flow_blocks,
              flow_duration_minutes,
              timed_actions,
              created_by,
              created_at,
              updated_at
            FROM system_schema.simulation_profiles
            WHERE id::text = $1 OR simu_id = $1
            LIMIT 1`,
            [trimmedId],
          );
        }
        if (rows && rows.length > 0) {
          const r = rows[0];
          const blocks = Array.isArray(r.flow_blocks)
            ? r.flow_blocks
            : typeof r.flow_blocks === 'string'
            ? JSON.parse(r.flow_blocks)
            : [];
          const durationMin = blocks.reduce((sum: number, b: any) => sum + (b.functionType === 'delay' ? Number(b.delaySeconds) || 0 : 0), 0) / 60;
          return {
            success: true,
            data: {
              id: r.id || r.simu_id,
              simuId: r.simu_id,
              name: r.name || r.simu_id,
              profileName: r.profile_name || r.name || r.simu_id,
              itemCode: r.item_code,
              longFw: r.long_fw,
              fwVersion: r.fw_version || r.long_fw,
              sensorConnectivity: r.sensor_connectivity,
              sku: r.sku,
              flowBlocks: blocks,
              autoCheckCriteria: r.auto_check_criteria || {},
              referenceDevices: r.reference_devices || [],
              simulatorDevice: r.simulator_device || null,
              blocksCount: blocks.length,
              duration: durationMin * 60,
              flowDurationMinutes: durationMin,
              timedActions: r.timed_actions || [],
              createdBy: r.created_by,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            },
          };
        }
      }
    } catch {}

    throw new NotFoundException(`Simulation profile not found: ${trimmedId}`);
  }

  @Delete([
    'api/plugins/testing/simulation/profiles/:id',
    'api/v1/plugins/testing/simulation/profiles/:id',
  ])
  async deleteSimulationProfile(@Param('id') id: string) {
    const trimmedId = (id || '').trim();
    if (!trimmedId) {
      throw new BadRequestException('ID is required');
    }

    let deletedFromDb = false;
    try {
      const ds =
        this.databaseService.getDataSourceForTable('system_schema.simulation_profiles') ||
        this.databaseService.getDataSourceForTable('devices');
      if (!ds) throw new Error('Database unavailable');
      if (ds) {
        const linked = await ds.query(
          `SELECT b.batch_code FROM system_schema.device_test_batches b
           WHERE b.simu_id = $1 OR b.simu_id IN
             (SELECT simu_id FROM system_schema.simulation_profiles WHERE id::text = $1 OR simu_id = $1)
           LIMIT 1`, [trimmedId],
        );
        if (linked.length) throw new ConflictException(`Không thể xóa Flow Simulation đang liên kết Test Batch ${linked[0].batch_code}`);
        const res = await ds.query(
          `DELETE FROM system_schema.simulation_profiles WHERE id::text = $1 OR simu_id = $1 RETURNING id, simu_id`,
          [trimmedId],
        );
        deletedFromDb = Array.isArray(res) && res.length > 0;
      }
    } catch (e: any) {
      if (e instanceof HttpException) throw e;
      if (e.code === '23503') throw new ConflictException('Không thể xóa Flow Simulation đang được sử dụng');
      throw new HttpException(`Không thể xóa Flow Simulation: ${e.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      success: true,
      message: `Đã xóa Flow Simulation ${trimmedId}`,
      deleted: deletedFromDb,
    };
  }

  @Get(['api/plugins/testing/simulation/results', 'api/v1/plugins/testing/simulation/results'])
  async getSimulationResults() {
    return {
      success: true,
      data: this.simulationResults,
    };
  }

  // ============================================================================
  // 8. DEVICE AUTO CHECK FLOW & PROFILES
  // ============================================================================

  @Post(['api/plugins/testing/autocheck/profiles', 'api/v1/plugins/testing/autocheck/profiles'])
  async createAutoCheckProfile(@Body() body: any) {
    const name = (body?.name || '').trim();
    const itemCode = (body?.itemCode || body?.item_code || '').trim();
    const fwVersion = (body?.fwVersion || body?.fw_version || '').trim();
    const referenceItemCode = (body?.referenceItemCode || body?.reference_item_code || '').trim() || null;
    const referenceFwVersion = (body?.referenceFwVersion || body?.reference_fw_version || '').trim() || null;
    const criteria = body?.criteria || {};
    const createdBy = (body?.createdBy || body?.created_by || 'tester').trim();

    if (!name) throw new BadRequestException('Tên cấu hình autocheck (name) không được để trống');
    if (!itemCode) throw new BadRequestException('ITEM_CODE không được để trống');
    if (!fwVersion) throw new BadRequestException('FW_VERSION không được để trống');
    if ((referenceItemCode && !referenceFwVersion) || (!referenceItemCode && referenceFwVersion)) {
      throw new BadRequestException('Thiết bị tham chiếu yêu cầu cả referenceItemCode và referenceFwVersion hoặc cùng để trống');
    }

    const ds = this.databaseService.getDataSourceForTable('system');
    const inserted = await ds.query(
      `INSERT INTO system_schema.device_autocheck_profiles
       (name, item_code, fw_version, reference_item_code, reference_fw_version, criteria, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, itemCode, fwVersion, referenceItemCode, referenceFwVersion, JSON.stringify(criteria), createdBy],
    );

    return {
      success: true,
      message: 'Tạo cấu hình AutoCheck profile thành công',
      data: this.mapAutoCheckProfileRow(inserted[0]),
    };
  }

  @Get(['api/plugins/testing/autocheck/profiles', 'api/v1/plugins/testing/autocheck/profiles'])
  async getAutoCheckProfiles(
    @Query('itemCode') itemCode?: string,
    @Query('fwVersion') fwVersion?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const ds = this.databaseService.getDataSourceForTable('system');
    let sql = `SELECT * FROM system_schema.device_autocheck_profiles WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (itemCode && itemCode.trim()) {
      sql += ` AND LOWER(item_code) = LOWER($${idx++})`;
      params.push(itemCode.trim());
    }
    if (fwVersion && fwVersion.trim()) {
      sql += ` AND LOWER(fw_version) = LOWER($${idx++})`;
      params.push(fwVersion.trim());
    }
    if (search && search.trim()) {
      sql += ` AND (name ILIKE $${idx} OR autocheck_id ILIKE $${idx} OR item_code ILIKE $${idx})`;
      params.push(`%${search.trim()}%`);
      idx++;
    }

    const countRes = await ds.query(`SELECT COUNT(*)::int AS count FROM (${sql}) sub`, params).catch(() => [{ count: 0 }]);
    const total = countRes[0]?.count || 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    params.push(limitNum, (pageNum - 1) * limitNum);

    const rows = await ds.query(sql, params).catch(() => []);
    return {
      success: true,
      data: rows.map((r: any) => this.mapAutoCheckProfileRow(r)),
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  @Get(['api/plugins/testing/autocheck/profiles/:id', 'api/v1/plugins/testing/autocheck/profiles/:id'])
  async getAutoCheckProfileById(@Param('id') id: string) {
    const ds = this.databaseService.getDataSourceForTable('system');
    const isAcId = (id || '').toUpperCase().startsWith('AC-');
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

    let rows: any[] = [];
    if (isAcId) {
      rows = await ds.query(
        `SELECT * FROM system_schema.device_autocheck_profiles WHERE LOWER(autocheck_id) = LOWER($1) LIMIT 1`,
        [id.trim()],
      );
    } else if (isUuid) {
      rows = await ds.query(
        `SELECT * FROM system_schema.device_autocheck_profiles WHERE id = $1 LIMIT 1`,
        [id.trim()],
      );
    } else {
      rows = await ds.query(
        `SELECT * FROM system_schema.device_autocheck_profiles WHERE id::text = $1 OR LOWER(autocheck_id) = LOWER($1) LIMIT 1`,
        [id.trim()],
      );
    }

    if (!rows || rows.length === 0) {
      throw new NotFoundException(`Không tìm thấy cấu hình AutoCheck với ID '${id}'`);
    }

    return {
      success: true,
      data: this.mapAutoCheckProfileRow(rows[0]),
    };
  }

  @Put(['api/plugins/testing/autocheck/profiles/:id', 'api/v1/plugins/testing/autocheck/profiles/:id'])
  async updateAutoCheckProfile(@Param('id') id: string, @Body() body: any) {
    const existing = await this.getAutoCheckProfileById(id);
    const profileId = existing.data.id;

    const name = body?.name !== undefined ? String(body.name).trim() : existing.data.name;
    const itemCode = body?.itemCode !== undefined ? String(body.itemCode).trim() : existing.data.itemCode;
    const fwVersion = body?.fwVersion !== undefined ? String(body.fwVersion).trim() : existing.data.fwVersion;
    const referenceItemCode = body?.referenceItemCode !== undefined ? (String(body.referenceItemCode).trim() || null) : existing.data.referenceItemCode;
    const referenceFwVersion = body?.referenceFwVersion !== undefined ? (String(body.referenceFwVersion).trim() || null) : existing.data.referenceFwVersion;
    const criteria = body?.criteria !== undefined ? body.criteria : existing.data.criteria;

    if (!name) throw new BadRequestException('Tên cấu hình autocheck (name) không được để trống');
    if (!itemCode) throw new BadRequestException('ITEM_CODE không được để trống');
    if (!fwVersion) throw new BadRequestException('FW_VERSION không được để trống');
    if ((referenceItemCode && !referenceFwVersion) || (!referenceItemCode && referenceFwVersion)) {
      throw new BadRequestException('Thiết bị tham chiếu yêu cầu cả referenceItemCode và referenceFwVersion hoặc cùng để trống');
    }

    const ds = this.databaseService.getDataSourceForTable('system');
    const updated = await ds.query(
      `UPDATE system_schema.device_autocheck_profiles
       SET name = $1, item_code = $2, fw_version = $3, reference_item_code = $4, reference_fw_version = $5, criteria = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, itemCode, fwVersion, referenceItemCode, referenceFwVersion, JSON.stringify(criteria), profileId],
    );

    return {
      success: true,
      message: 'Cập nhật cấu hình AutoCheck profile thành công',
      data: this.mapAutoCheckProfileRow(updated[0]),
    };
  }

  @Delete(['api/plugins/testing/autocheck/profiles/:id', 'api/v1/plugins/testing/autocheck/profiles/:id'])
  async deleteAutoCheckProfile(@Param('id') id: string) {
    const existing = await this.getAutoCheckProfileById(id);
    const profileId = existing.data.id;
    const ds = this.databaseService.getDataSourceForTable('system');
    await ds.query(`DELETE FROM system_schema.device_autocheck_profiles WHERE id = $1`, [profileId]);
    return {
      success: true,
      message: `Đã xóa cấu hình AutoCheck profile [${existing.data.autocheckId}]`,
    };
  }

  @Get(['api/plugins/testing/autocheck/fields', 'api/v1/plugins/testing/autocheck/fields'])
  async getAutoCheckFields(
    @Query('itemCode') itemCode?: string,
    @Query('fwVersion') fwVersion?: string,
    @Query('longFw') longFw?: string,
  ) {
    const code = (itemCode || '').trim();
    const fw = (fwVersion || longFw || '').trim();

    if (!code && !fw) {
      return {
        success: true,
        data: {
          itemCode: '',
          fwVersion: '',
          decoderFound: false,
          fields: [],
          message: 'Cung cấp itemCode hoặc fwVersion để tra cứu fields giải mã',
        },
      };
    }

    const decoderController = new DecoderAdapterController(this.databaseService);
    const { matched, matchTier } = await decoderController.resolveDecoderScript({
      itemCode: code,
      sku: code,
      longFw: fw,
    });

    if (!matched) {
      // Fallback: Try discovering fields from live device packets or registrations for this itemCode
      let packetFields: Array<{ name: string; label: string; type: string; unit?: string }> = [];
      try {
        const ds = this.databaseService.getDataSourceForTable('devices');
        if (ds) {
          const liveRows = await ds.query(
            `SELECT decoded_payload FROM system_schema.v_device_payload_live
             WHERE (UPPER(item_code) = UPPER($1) OR $1 = '') AND decoded_payload IS NOT NULL
             ORDER BY created_at DESC LIMIT 3`,
            [code]
          ).catch(() => []);
          for (const r of liveRows) {
            if (r.decoded_payload && typeof r.decoded_payload === 'object') {
              for (const [k, v] of Object.entries(r.decoded_payload)) {
                if (!packetFields.some((f) => f.name === k)) {
                  packetFields.push({
                    name: k,
                    label: k,
                    type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string',
                  });
                }
              }
            }
          }
        }
      } catch {}

      if (packetFields.length > 0) {
        return {
          success: true,
          data: {
            itemCode: code,
            fwVersion: fw,
            decoderFound: true,
            decoderId: 'live_packets_discovery',
            decoderName: `Dynamic Telemetry Discovery (${code})`,
            matchTier: 'live_packets',
            fields: packetFields,
            samplePayload: null,
            expectedDecoded: null,
          },
        };
      }

      return {
        success: true,
        data: {
          itemCode: code,
          fwVersion: fw,
          decoderFound: false,
          fields: [],
          message: `Không tìm thấy decoder script phù hợp cho itemCode='${code}', fwVersion='${fw}'`,
        },
      };
    }

    let fields: Array<{ name: string; label: string; type: string; unit?: string }> = [];
    const expected = matched.sample_decoded || (matched as any).expected_decoded;
    if (expected && typeof expected === 'object' && Object.keys(expected).length > 0) {
      fields = Object.entries(expected).map(([k, v]) => ({
        name: k,
        label: k,
        type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string',
      }));
    } else if (matched.sample_payload) {
      try {
        const testResult = await decoderController.testDecoder({
          script: matched.script,
          fPort: 1,
          payload: matched.sample_payload,
        });
        if (testResult?.success && testResult?.data?.decoded && typeof testResult.data.decoded === 'object') {
          fields = Object.entries(testResult.data.decoded).map(([k, v]) => ({
            name: k,
            label: k,
            type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string',
          }));
        }
      } catch (_) {}
    }

    // Try executing testDecoder with standard payloads if sample_payload was absent or failed
    if (fields.length === 0 && matched.script) {
      for (const trialPayload of ['0102030405060708090A0B0C0D0E0F10', '00000000000000000000', '0100', '01']) {
        try {
          const testResult = await decoderController.testDecoder({
            script: matched.script,
            fPort: 1,
            payload: trialPayload,
          });
          if (testResult?.success && testResult?.data?.decoded && typeof testResult.data.decoded === 'object') {
            const decodedEntries = Object.entries(testResult.data.decoded);
            if (decodedEntries.length > 0) {
              fields = decodedEntries.map(([k, v]) => ({
                name: k,
                label: k,
                type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string',
              }));
              break;
            }
          }
        } catch (_) {}
      }
    }

    if (fields.length === 0) {
      const script = matched.script || '';
      const fieldNames = new Set<string>();
      const jsKeywords = new Set([
        'var', 'let', 'const', 'function', 'if', 'else', 'return', 'true', 'false',
        'null', 'undefined', 'length', 'push', 'prototype', 'for', 'while', 'switch',
        'case', 'break', 'new', 'try', 'catch', 'finally', 'typeof', 'instanceof',
        'data', 'decoded', 'telemetry', 'result', 'output', 'input', 'warnings', 'errors',
        'byte', 'bytes', 'fport', 'fPort'
      ]);

      // 1. Match keys in object literal assigned to data / telemetry / decoded
      const objBlocks = script.matchAll(/(?:data|telemetry|decoded|output|result)\s*=\s*\{([\s\S]*?)\}/g);
      for (const b of objBlocks) {
        const keys = b[1].matchAll(/([a-zA-Z0-9_]+)\s*:/g);
        for (const k of keys) {
          if (!jsKeywords.has(k[1])) fieldNames.add(k[1]);
        }
      }

      // 2. Match keys in return { data: { ... } }
      const returnDataBlocks = script.matchAll(/(?:return\s*\{\s*data\s*:\s*\{)([\s\S]*?)\}/g);
      for (const b of returnDataBlocks) {
        const keys = b[1].matchAll(/([a-zA-Z0-9_]+)\s*:/g);
        for (const k of keys) {
          if (!jsKeywords.has(k[1])) fieldNames.add(k[1]);
        }
      }

      // 3. Match data.field = ...
      const dotMatches = script.matchAll(/(?:data|telemetry|decoded|output|result)\.([a-zA-Z0-9_]+)\s*=/g);
      for (const m of dotMatches) {
        if (m[1] && !jsKeywords.has(m[1])) {
          fieldNames.add(m[1]);
        }
      }

      // 4. Match data['field'] = ...
      const bracketMatches = script.matchAll(/(?:data|telemetry|decoded|output|result)\[['"]([a-zA-Z0-9_]+)['"]\]\s*=/g);
      for (const m of bracketMatches) {
        if (m[1] && !jsKeywords.has(m[1])) {
          fieldNames.add(m[1]);
        }
      }

      // 5. Match prop definitions like FIELD: UINT8(...) or FIELD: byte[...]
      const propMatches = script.matchAll(/([a-zA-Z0-9_]+)\s*:\s*(?:UINT8|UINT16|UINT32|HEX|bytes|data|input|\(|byte)/g);
      for (const m of propMatches) {
        if (m[1] && !jsKeywords.has(m[1])) fieldNames.add(m[1]);
      }

      if (fieldNames.size > 0) {
        fields = Array.from(fieldNames).map((f) => ({
          name: f,
          label: f,
          type: 'number',
        }));
      }
    }

    // Fallback: If decoder script yielded no fields, check live telemetry packets
    if (fields.length === 0) {
      try {
        const ds = this.databaseService.getDataSourceForTable('devices');
        if (ds) {
          const liveRows = await ds.query(
            `SELECT decoded_payload FROM system_schema.v_device_payload_live
             WHERE (UPPER(item_code) = UPPER($1) OR UPPER(sku) = UPPER($1) OR $1 = '') AND decoded_payload IS NOT NULL
             ORDER BY created_at DESC LIMIT 3`,
            [code]
          ).catch(() => []);
          for (const r of liveRows) {
            if (r.decoded_payload && typeof r.decoded_payload === 'object') {
              for (const [k, v] of Object.entries(r.decoded_payload)) {
                if (!fields.some((f) => f.name === k)) {
                  fields.push({
                    name: k,
                    label: k,
                    type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'string',
                  });
                }
              }
            }
          }
        }
      } catch {}
    }

    // Ensure standard RF / network telemetry fields are also available for this device: RSSI, SNR, FCNT, FREQ
    const standardDeviceFields = [
      { name: 'RSSI', label: 'RSSI', type: 'number', unit: 'dBm' },
      { name: 'SNR', label: 'SNR', type: 'number', unit: 'dB' },
      { name: 'FCNT', label: 'FCNT', type: 'number', unit: '' },
      { name: 'FREQ', label: 'FREQ', type: 'number', unit: 'MHz' },
    ];
    for (const sf of standardDeviceFields) {
      if (!fields.some((f) => f.name.toUpperCase() === sf.name)) {
        fields.push(sf);
      }
    }

    return {
      success: true,
      data: {
        itemCode: code,
        fwVersion: fw,
        decoderFound: true,
        decoderId: matched.id,
        decoderName: matched.name,
        matchTier,
        fields,
        samplePayload: matched.sample_payload,
        expectedDecoded: matched.sample_decoded || (matched as any).expected_decoded || null,
      },
    };
  }

  private mapAutoCheckProfileRow(row: any) {
    if (!row) return null;
    return {
      id: row.id,
      autocheckId: row.autocheck_id,
      name: row.name,
      itemCode: row.item_code,
      fwVersion: row.fw_version,
      referenceItemCode: row.reference_item_code,
      referenceFwVersion: row.reference_fw_version,
      criteria: typeof row.criteria === 'string' ? JSON.parse(row.criteria) : (row.criteria || {}),
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private deduplicatePackets(packets: any[]): any[] {
    const seen = new Set<string>();
    const deduped: any[] = [];
    for (const p of packets) {
      if (!p) continue;
      const fCnt = p.f_cnt ?? p.fCnt ?? null;
      const devEui = (p.dev_eui || p.devEui || p.network_id || p.networkId || '').toLowerCase().replace(/[^a-f0-9]/g, '');
      const ts = p.created_at || p.createdAt || p.received_at || '';
      const raw = p.raw_payload || p.rawPayload || '';
      const key = fCnt !== null && devEui ? `${devEui}-${fCnt}` : `${devEui}-${ts}-${raw}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(p);
      }
    }
    return deduped;
  }

  private extractMetricValue(packet: any, metricName: string): number | null {
    if (!packet || !metricName) return null;
    const m = metricName.toLowerCase().trim();
    if (m === 'rssi') {
      const val = packet.rssi ?? packet.rf_info?.rssi ?? packet.rfInfo?.rssi;
      if (val !== undefined && val !== null && !isNaN(Number(val))) return Number(val);
    }
    if (m === 'snr') {
      const val = packet.snr ?? packet.rf_info?.snr ?? packet.rfInfo?.snr;
      if (val !== undefined && val !== null && !isNaN(Number(val))) return Number(val);
    }
    const dec = packet.decoded_payload || packet.decodedPayload || {};
    if (dec[metricName] !== undefined && dec[metricName] !== null && !isNaN(Number(dec[metricName]))) {
      return Number(dec[metricName]);
    }
    const matchedKey = Object.keys(dec).find((k) => k.toLowerCase() === m);
    if (matchedKey && dec[matchedKey] !== undefined && dec[matchedKey] !== null && !isNaN(Number(dec[matchedKey]))) {
      return Number(dec[matchedKey]);
    }
    return null;
  }

  @Get(['api/plugins/testing/autocheck/rules', 'api/v1/plugins/testing/autocheck/rules'])
  getAutoCheckRules() {
    return {
      success: true,
      data: {
        minRssi: -120,
        maxRssi: -30,
        minSnr: -15,
        expectedFPort: 1,
        requiredFields: ['dev_eui', 'payload', 'f_port'],
        fieldRules: {},
      },
    };
  }

  @Post(['api/plugins/testing/autocheck/evaluate', 'api/v1/plugins/testing/autocheck/evaluate'])
  async evaluateAutoCheck(@Body() body: EvaluateAutoCheckDto) {
    const target = body?.target || {};
    let criteria: any = body?.criteria || {};

    if (body?.profileId) {
      try {
        const profileRes = await this.getAutoCheckProfileById(body.profileId);
        if (profileRes?.data?.criteria) {
          criteria = { ...profileRes.data.criteria, ...criteria };
        }
      } catch (_) {}
    }

    const minRssi = criteria.minRssi ?? -120;
    const maxRssi = criteria.maxRssi ?? -30;
    const minSnr = criteria.minSnr ?? -15;
    const expectedFPort = criteria.expectedFPort;
    const requiredFields = criteria.requiredFields;
    const fieldRules = criteria.fieldRules || {};

    const parseTimestamp = (val: any): number => {
      if (!val) return Date.now();
      if (typeof val === 'number') return val;
      const t = new Date(val).getTime();
      return isNaN(t) ? Date.now() : t;
    };

    const initialPackets = Array.isArray(target.packets) && target.packets.length > 0
      ? target.packets
      : (target.packet ? [target.packet] : []);
    const baseTime = initialPackets.length > 0
      ? parseTimestamp(initialPackets[0].created_at || initialPackets[0].createdAt || initialPackets[0].received_at)
      : Date.now();

    try {
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );

      let packet: any = target.packet;

      if (!packet && Array.isArray(target.packets) && target.packets.length > 0) {
        packet = target.packets[0];
      }

      if (!packet && target.packetId) {
        packet = await packetRepo.findOne({
          where: { id: target.packetId },
          relations: ['device'],
        });
      }

      if (!packet && (target.networkId || target.serialNumber || target.deviceId)) {
        const qb = packetRepo
          .createQueryBuilder('p')
          .leftJoinAndSelect('p.device', 'dev')
          .orderBy('p.created_at', 'DESC');

        if (target.deviceId) {
          qb.andWhere('p.device_id = :dId', { dId: target.deviceId });
        }
        if (target.networkId) {
          qb.andWhere('(dev.network_id ILIKE :net OR dev.serial_number ILIKE :net)', {
            net: `%${target.networkId.trim()}%`,
          });
        }
        if (target.serialNumber) {
          qb.andWhere('dev.serial_number ILIKE :ser', { ser: `%${target.serialNumber.trim()}%` });
        }

        packet = await qb.getOne();
      }

      if (!packet && (!Array.isArray(target.packets) || target.packets.length === 0)) {
        throw new NotFoundException(
          'No packet found for auto-check evaluation. Please run a simulation or ingest a packet first.',
        );
      }

      const ruleResults: any[] = [];
      const rf = packet?.rf_info || packet?.rfInfo || {};
      const rssi = rf.rssi ?? packet?.rssi;
      const snr = rf.snr ?? packet?.snr;
      const fPort = packet?.f_port ?? packet?.fPort;
      const fCnt = packet?.f_cnt ?? packet?.fCnt;
      const rawPayload = packet?.raw_payload || packet?.rawPayload || '';
      const decoded = packet?.decoded_payload || packet?.decodedPayload || {};

      const isProductCriteria = Boolean(criteria.dut || criteria.reference || criteria.comparisons || criteria.functionRules || criteria.rules);

      // 1. RSSI Check
      if (criteria.minRssi !== undefined || criteria.maxRssi !== undefined || (!isProductCriteria && rssi !== undefined)) {
        const rssiPassed = rssi !== undefined && rssi !== null && rssi >= minRssi && rssi <= maxRssi;
        ruleResults.push({
          rule: 'RSSI_RANGE_CHECK',
          passed: Boolean(rssiPassed),
          actual: rssi,
          expected: `Between ${minRssi} and ${maxRssi} dBm`,
          message: rssiPassed
            ? `RSSI ${rssi} dBm is acceptable`
            : `RSSI ${rssi} dBm is outside allowable range [${minRssi}, ${maxRssi}]`,
        });
      }

      // 2. SNR Check
      if (criteria.minSnr !== undefined || (!isProductCriteria && snr !== undefined)) {
        const snrPassed = snr !== undefined && snr !== null && snr >= minSnr;
        ruleResults.push({
          rule: 'SNR_MIN_CHECK',
          passed: Boolean(snrPassed),
          actual: snr,
          expected: `>= ${minSnr} dB`,
          message: snrPassed
            ? `SNR ${snr} dB meets link budget threshold`
            : `SNR ${snr} dB is below threshold ${minSnr} dB`,
        });
      }

      // 3. fPort Check
      if (expectedFPort !== undefined) {
        const portPassed = fPort === expectedFPort;
        ruleResults.push({
          rule: 'FPORT_MATCH_CHECK',
          passed: portPassed,
          actual: fPort,
          expected: expectedFPort,
          message: portPassed
            ? `fPort ${fPort} matches specification`
            : `Expected fPort ${expectedFPort}, but packet has ${fPort}`,
        });
      }

      // 4. Required Fields Check
      if (requiredFields && Array.isArray(requiredFields)) {
        for (const field of requiredFields) {
          let actualVal: any;
          if (field === 'dev_eui' || field === 'network_id') {
            actualVal = packet?.device?.network_id || target.networkId;
          } else if (field === 'payload' || field === 'raw_payload') {
            actualVal = rawPayload;
          } else if (field === 'f_port') {
            actualVal = fPort;
          } else if (field === 'f_cnt') {
            actualVal = fCnt;
          } else {
            actualVal = decoded[field];
          }

          const passed = actualVal !== undefined && actualVal !== null && actualVal !== '';
          ruleResults.push({
            rule: `FIELD_REQUIRED_${field.toUpperCase()}`,
            passed,
            actual: actualVal ?? null,
            expected: 'Non-empty value',
            message: passed ? `Required field '${field}' exists` : `Missing mandatory field '${field}'`,
          });
        }
      }

      // 5. Specific Field Rules
      for (const [field, rawRule] of Object.entries(fieldRules)) {
        const rule = (rawRule || {}) as { equals?: any; min?: number; max?: number };
        const actualVal = decoded[field];
        let passed = true;
        let failReason = '';

        if (actualVal === undefined || actualVal === null) {
          passed = false;
          failReason = `Field '${field}' missing in decoded payload`;
        } else {
          if (rule.equals !== undefined && actualVal !== rule.equals) {
            passed = false;
            failReason = `Expected ${rule.equals}, received ${actualVal}`;
          }
          if (rule.min !== undefined && (typeof actualVal !== 'number' || actualVal < rule.min)) {
            passed = false;
            failReason = `Expected >= ${rule.min}, received ${actualVal}`;
          }
          if (rule.max !== undefined && (typeof actualVal !== 'number' || actualVal > rule.max)) {
            passed = false;
            failReason = `Expected <= ${rule.max}, received ${actualVal}`;
          }
        }

        ruleResults.push({
          rule: `FIELD_VALUE_RULE_${field.toUpperCase()}`,
          passed,
          actual: actualVal,
          expected: rule,
          message: passed ? `Rule for '${field}' passed` : failReason,
        });
      }

      // 6. DUT Rules Evaluation (supports count, min, max, equals)
      if (criteria.dut?.rules && Array.isArray(criteria.dut.rules)) {
        const dutPackets = Array.isArray(target.packets) && target.packets.length > 0
          ? target.packets
          : (packet ? [packet] : []);

        for (const rule of criteria.dut.rules) {
          const field = rule.field;
          const requiredCount = typeof rule.count === 'number' && rule.count > 0 ? rule.count : 1;
          let matchCount = 0;

          for (const p of dutPackets) {
            const pDecoded = p?.decoded_payload || p?.decodedPayload || {};
            const val = pDecoded[field];
            if (val === undefined || val === null || val === '') continue;

            let valid = true;
            if (rule.equals !== undefined && val !== rule.equals) valid = false;
            if (rule.min !== undefined && (typeof val !== 'number' || val < rule.min)) valid = false;
            if (rule.max !== undefined && (typeof val !== 'number' || val > rule.max)) valid = false;

            if (valid) matchCount++;
          }

          const passed = matchCount >= requiredCount;
          ruleResults.push({
            rule: `DUT_FIELD_${(field || '').toUpperCase()}`,
            passed,
            actual: matchCount,
            expected: requiredCount,
            message: passed
              ? `Trường '${field}' đạt điều kiện trên ${matchCount}/${requiredCount} mẫu`
              : `Trường '${field}' chỉ đạt trên ${matchCount}/${requiredCount} mẫu (yêu cầu tối thiểu ${requiredCount})`,
          });
        }
      }

      // 7. Reference Rules Evaluation
      if (criteria.reference?.rules && Array.isArray(criteria.reference.rules)) {
        const refPackets = Array.isArray(target.referencePackets || target.reference_packets)
          ? (target.referencePackets || target.reference_packets)
          : [];

        for (const rule of criteria.reference.rules) {
          const field = rule.field;
          const requiredCount = typeof rule.count === 'number' && rule.count > 0 ? rule.count : 1;
          let matchCount = 0;

          for (const p of refPackets) {
            const pDecoded = p?.decoded_payload || p?.decodedPayload || {};
            const val = pDecoded[field];
            if (val === undefined || val === null || val === '') continue;

            let valid = true;
            if (rule.equals !== undefined && val !== rule.equals) valid = false;
            if (rule.min !== undefined && (typeof val !== 'number' || val < rule.min)) valid = false;
            if (rule.max !== undefined && (typeof val !== 'number' || val > rule.max)) valid = false;

            if (valid) matchCount++;
          }

          const passed = matchCount >= requiredCount;
          ruleResults.push({
            rule: `REFERENCE_FIELD_${(field || '').toUpperCase()}`,
            passed,
            actual: matchCount,
            expected: requiredCount,
            message: passed
              ? `Thiết bị tham chiếu: trường '${field}' đạt ${matchCount}/${requiredCount} mẫu`
              : `Thiết bị tham chiếu: trường '${field}' chỉ đạt ${matchCount}/${requiredCount} mẫu`,
          });
        }
      }

      // 7b. Multi-Reference Devices Evaluation (criteria.references)
      if (Array.isArray(criteria.references) && criteria.references.length > 0) {
        const multiRefPackets = target.multiReferencePackets || target.multi_reference_packets || {};
        const generalRefPackets = Array.isArray(target.referencePackets || target.reference_packets)
          ? (target.referencePackets || target.reference_packets)
          : [];

        for (let rIdx = 0; rIdx < criteria.references.length; rIdx++) {
          const refDev = criteria.references[rIdx];
          const refKey = refDev.reference_id || refDev.referenceId || refDev.dev_eui || refDev.devEui || refDev.serial_number || refDev.serialNumber || `ref_${rIdx + 1}`;

          let packetsForThisRef = multiRefPackets[refKey];
          if (!packetsForThisRef && refDev.dev_eui) {
            const cleanEui = refDev.dev_eui.toLowerCase().replace(/[^a-f0-9]/g, '');
            packetsForThisRef = generalRefPackets.filter((p: any) => {
              const pEui = (p.dev_eui || p.devEui || p.network_id || p.networkId || '').toLowerCase().replace(/[^a-f0-9]/g, '');
              return pEui === cleanEui;
            });
          }
          if (!packetsForThisRef && refDev.serial_number) {
            packetsForThisRef = generalRefPackets.filter((p: any) => (p.serial_number || p.serialNumber) === refDev.serial_number);
          }
          if (!packetsForThisRef) {
            packetsForThisRef = generalRefPackets;
          }

          if (Array.isArray(refDev.rules)) {
            for (const rRule of refDev.rules) {
              const field = rRule.field;
              const requiredCount = typeof rRule.count === 'number' && rRule.count > 0 ? rRule.count : 1;
              let matchCount = 0;
              for (const p of packetsForThisRef) {
                const dec = p?.decoded_payload || p?.decodedPayload || {};
                const val = dec[field];
                if (val === undefined || val === null || val === '') continue;
                let valid = true;
                if (rRule.equals !== undefined && val !== rRule.equals) valid = false;
                if (rRule.min !== undefined && (typeof val !== 'number' || val < rRule.min)) valid = false;
                if (rRule.max !== undefined && (typeof val !== 'number' || val > rRule.max)) valid = false;
                if (valid) matchCount++;
              }
              const passed = matchCount >= requiredCount;
              ruleResults.push({
                rule: `MULTI_REF_${refKey.toUpperCase()}_FIELD_${(field || '').toUpperCase()}`,
                passed,
                actual: matchCount,
                expected: requiredCount,
                device: refKey,
                message: passed
                  ? `Thiết bị tham chiếu [${refKey}]: trường '${field}' đạt ${matchCount}/${requiredCount} mẫu`
                  : `Thiết bị tham chiếu [${refKey}]: trường '${field}' chỉ đạt ${matchCount}/${requiredCount} mẫu (yêu cầu ${requiredCount})`,
              });
            }
          }
        }
      }

      // 8. Comparisons Evaluation (DUT vs Reference)
      if (criteria.comparisons && Array.isArray(criteria.comparisons)) {
        const dutPackets = Array.isArray(target.packets) && target.packets.length > 0
          ? target.packets
          : (packet ? [packet] : []);
        const refPackets = Array.isArray(target.referencePackets || target.reference_packets)
          ? (target.referencePackets || target.reference_packets)
          : [];

        const latestDut = dutPackets[0];
        const latestRef = refPackets[0];

        for (const comp of criteria.comparisons) {
          const dutField = comp.dut_field || comp.dutField;
          const refField = comp.reference_field || comp.referenceField;
          const tolerance = typeof comp.tolerance === 'number' ? comp.tolerance : 0;
          const targetRefId = comp.reference_id || comp.referenceId;

          let targetRefP = latestRef;
          if (targetRefId && target.multiReferencePackets?.[targetRefId]?.length > 0) {
            targetRefP = target.multiReferencePackets[targetRefId][0];
          } else if (targetRefId && target.multi_reference_packets?.[targetRefId]?.length > 0) {
            targetRefP = target.multi_reference_packets[targetRefId][0];
          }

          const resolvePktField = (p: any, field: string): any => {
            if (!p || !field) return undefined;
            const dec = p.decoded_payload || p.decodedPayload || {};
            if (dec[field] !== undefined && dec[field] !== null) return dec[field];
            const found = Object.keys(dec).find((k) => k.toLowerCase() === field.toLowerCase());
            if (found && dec[found] !== undefined && dec[found] !== null) return dec[found];

            const rf = p.rf_info || p.rfInfo || {};
            const keyUpper = field.toUpperCase().trim();
            if (keyUpper === 'RSSI') return rf.rssi ?? p.rssi;
            if (keyUpper === 'SNR') return rf.snr ?? p.snr;
            if (keyUpper === 'FCNT') return p.f_cnt ?? p.fCnt ?? p.fcnt;
            if (keyUpper === 'FREQ' || keyUpper === 'FREQUENCY') return rf.frequency ?? rf.freq ?? p.frequency ?? p.freq;
            return undefined;
          };

          const dutVal = resolvePktField(latestDut, dutField);
          const refVal = resolvePktField(targetRefP, refField);

          let passed = false;
          let message = '';

          if (dutVal === undefined || dutVal === null) {
            message = `DUT thiếu trường so sánh '${dutField}'`;
          } else if (refVal === undefined || refVal === null) {
            message = `Thiết bị tham chiếu thiếu trường so sánh '${refField}'`;
          } else if (typeof dutVal !== 'number' || typeof refVal !== 'number') {
            passed = dutVal === refVal;
            message = passed
              ? `Giá trị DUT '${dutField}' (${dutVal}) khớp tham chiếu '${refField}'`
              : `Giá trị DUT '${dutField}' (${dutVal}) khác tham chiếu '${refField}' (${refVal})`;
          } else {
            const diff = Math.abs(dutVal - refVal);
            passed = diff <= tolerance;
            message = passed
              ? `Độ lệch |${dutVal} - ${refVal}| = ${diff.toFixed(2)} nằm trong ngưỡng dung sai ${tolerance}`
              : `Độ lệch |${dutVal} - ${refVal}| = ${diff.toFixed(2)} vượt ngưỡng dung sai ${tolerance}`;
          }

          ruleResults.push({
            rule: `COMPARE_${(dutField || '').toUpperCase()}_VS_${(refField || '').toUpperCase()}`,
            passed,
            actual: { dut: dutVal, reference: refVal },
            expected: { tolerance },
            message,
          });
        }
      }

      // 8. Standard FUNC_AUTOCHECK Rules Evaluation (from template/FUNC_AUTOCHECK.xlsx)
      // Supports: CHECKVALUE, CHECKAVG, CHECKCOUNT, FUNC_AVG, FUNC_OFFSET_AVGZERO, CHECKVALUE_PERIOD, CHECKAVG_PERIOD
      const functionRules: any[] = Array.isArray(criteria.functionRules)
        ? criteria.functionRules
        : (Array.isArray(criteria.rules) ? criteria.rules : []);

      if (functionRules.length > 0) {
        const packetsList: any[] = Array.isArray(target.packets) && target.packets.length > 0
          ? target.packets
          : (packet ? [packet] : []);

        const parseTimestamp = (val: any): number => {
          if (!val) return Date.now();
          if (typeof val === 'number') return val;
          const t = new Date(val).getTime();
          return isNaN(t) ? Date.now() : t;
        };

        const sortedPackets = [...packetsList].sort((a, b) => {
          const ta = parseTimestamp(a.created_at || a.createdAt);
          const tb = parseTimestamp(b.created_at || b.createdAt);
          return ta - tb;
        });

        const baseTime = sortedPackets.length > 0
          ? parseTimestamp(sortedPackets[0].created_at || sortedPackets[0].createdAt)
          : Date.now();

        for (const fRule of functionRules) {
          const fnName = (fRule.function_name || fRule.functionName || fRule.func || '').toUpperCase().trim();
          const paramKey = fRule.uplink_parameter || fRule.uplinkParameter || fRule.field || fRule.parameter;
          const lowThreshold = fRule.low_threshold !== undefined ? Number(fRule.low_threshold) : (fRule.lowThreshold !== undefined ? Number(fRule.lowThreshold) : -Infinity);
          const highThreshold = fRule.high_threshold !== undefined ? Number(fRule.high_threshold) : (fRule.highThreshold !== undefined ? Number(fRule.highThreshold) : Infinity);

          const extractVal = (p: any): number | null => {
            const dec = p?.decoded_payload || p?.decodedPayload || {};
            if (dec[paramKey] !== undefined && dec[paramKey] !== null) return Number(dec[paramKey]);
            // Case-insensitive lookup in decoded_payload
            const foundKey = Object.keys(dec).find((k) => k.toLowerCase() === (paramKey || '').toLowerCase());
            if (foundKey && dec[foundKey] !== undefined && dec[foundKey] !== null) return Number(dec[foundKey]);

            // RF / Network / Counter standard fields lookup on packet
            const rf = p?.rf_info || p?.rfInfo || {};
            const keyUpper = (paramKey || '').toUpperCase().trim();
            if (keyUpper === 'RSSI') {
              const val = rf.rssi ?? p?.rssi;
              if (val !== undefined && val !== null) return Number(val);
            } else if (keyUpper === 'SNR') {
              const val = rf.snr ?? p?.snr;
              if (val !== undefined && val !== null) return Number(val);
            } else if (keyUpper === 'FCNT') {
              const val = p?.f_cnt ?? p?.fCnt ?? p?.fcnt;
              if (val !== undefined && val !== null) return Number(val);
            } else if (keyUpper === 'FREQ' || keyUpper === 'FREQUENCY') {
              const val = rf.frequency ?? rf.freq ?? p?.frequency ?? p?.freq;
              if (val !== undefined && val !== null) return Number(val);
            }

            return null;
          };

          if (fnName === 'CHECKVALUE') {
            let pass = sortedPackets.length > 0;
            const failedValues: number[] = [];
            for (const p of sortedPackets) {
              const v = extractVal(p);
              if (v === null || isNaN(v) || v < lowThreshold || v > highThreshold) {
                pass = false;
                if (v !== null && !isNaN(v)) failedValues.push(v);
              }
            }
            ruleResults.push({
              rule: `CHECKVALUE_${paramKey}`,
              functionName: 'CHECKVALUE',
              parameter: paramKey,
              passed: pass,
              expected: `${lowThreshold} <= ${paramKey} <= ${highThreshold}`,
              actual: failedValues.length > 0 ? `Failed at: ${failedValues.join(', ')}` : 'All packets within threshold',
              message: pass
                ? `Hàm CHECKVALUE: Toàn bộ ${sortedPackets.length} gói tin của '${paramKey}' nằm trong khoảng [${lowThreshold}, ${highThreshold}]`
                : `Hàm CHECKVALUE: Có gói tin của '${paramKey}' nằm ngoài ngưỡng [${lowThreshold}, ${highThreshold}]`,
            });
          } else if (fnName === 'CHECKAVG') {
            const validVals: number[] = [];
            for (const p of sortedPackets) {
              const v = extractVal(p);
              if (v !== null && !isNaN(v)) validVals.push(v);
            }
            const avg = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 0;
            const pass = validVals.length > 0 && avg >= lowThreshold && avg <= highThreshold;
            ruleResults.push({
              rule: `CHECKAVG_${paramKey}`,
              functionName: 'CHECKAVG',
              parameter: paramKey,
              passed: pass,
              expected: `${lowThreshold} <= AVG <= ${highThreshold}`,
              actual: Number(avg.toFixed(2)),
              message: pass
                ? `Hàm CHECKAVG: Giá trị trung bình của '${paramKey}' (${avg.toFixed(2)}) đạt ngưỡng [${lowThreshold}, ${highThreshold}]`
                : `Hàm CHECKAVG: Giá trị trung bình của '${paramKey}' (${avg.toFixed(2)}) không đạt ngưỡng [${lowThreshold}, ${highThreshold}]`,
            });
          } else if (fnName === 'CHECKCOUNT') {
            const minCount = Number(fRule.min_count ?? fRule.minCount ?? 1);
            const maxCount = Number(fRule.max_count ?? fRule.maxCount ?? Infinity);
            let counter = 0;
            for (const p of sortedPackets) {
              const v = extractVal(p);
              if (v !== null && !isNaN(v) && v >= lowThreshold && v <= highThreshold) {
                counter++;
              }
            }
            const pass = counter >= minCount && counter <= maxCount;
            ruleResults.push({
              rule: `CHECKCOUNT_${paramKey}`,
              functionName: 'CHECKCOUNT',
              parameter: paramKey,
              passed: pass,
              expected: `${minCount} <= count <= ${maxCount}`,
              actual: counter,
              message: pass
                ? `Hàm CHECKCOUNT: Số lần '${paramKey}' thoả ngưỡng là ${counter} (trong khoảng [${minCount}, ${maxCount}])`
                : `Hàm CHECKCOUNT: Số lần '${paramKey}' thoả ngưỡng là ${counter} (ngoài khoảng [${minCount}, ${maxCount}])`,
            });
          } else if (fnName === 'FUNC_AVG') {
            const startSec = Number(fRule.start_time ?? fRule.startTime ?? 0);
            const durationSec = Number(fRule.duration ?? 0);
            const windowStart = baseTime + startSec * 1000;
            const windowEnd = durationSec > 0 ? windowStart + durationSec * 1000 : Infinity;

            const inWindow = sortedPackets.filter((p) => {
              const pt = parseTimestamp(p.created_at || p.createdAt);
              return pt >= windowStart && pt <= windowEnd;
            });
            const validVals: number[] = [];
            for (const p of inWindow) {
              const v = extractVal(p);
              if (v !== null && !isNaN(v)) validVals.push(v);
            }
            const avg = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 0;
            ruleResults.push({
              rule: `FUNC_AVG_${paramKey}`,
              functionName: 'FUNC_AVG',
              parameter: paramKey,
              passed: validVals.length > 0,
              actual: Number(avg.toFixed(2)),
              expected: `AVG in window [${startSec}s, ${startSec + durationSec}s]`,
              message: `Hàm FUNC_AVG: Giá trị trung bình của '${paramKey}' là ${avg.toFixed(2)} (${validVals.length} mẫu trong window)`,
            });
          } else if (fnName === 'FUNC_OFFSET_AVGZERO') {
            const stdZero = Number(fRule.standard_zero ?? fRule.standardZero ?? 0);
            const offsetStartSec = Number(fRule.start_offset_time_for_avg_zero ?? fRule.startOffsetTimeForAvgZero ?? 0);
            const durationSec = Number(fRule.duration_for_avg_zero ?? fRule.durationForAvgZero ?? 0);

            const windowStart = baseTime + offsetStartSec * 1000;
            const windowEnd = durationSec > 0 ? windowStart + durationSec * 1000 : Infinity;

            const inWindow = sortedPackets.filter((p) => {
              const pt = parseTimestamp(p.created_at || p.createdAt);
              return pt >= windowStart && pt <= windowEnd;
            });
            const validVals: number[] = [];
            for (const p of inWindow) {
              const v = extractVal(p);
              if (v !== null && !isNaN(v)) validVals.push(v);
            }
            const avgZero = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 0;
            const constantB = stdZero - avgZero;
            const hexFormat = Math.round(constantB).toString(16).toUpperCase();

            ruleResults.push({
              rule: `FUNC_OFFSET_AVGZERO_${paramKey}`,
              functionName: 'FUNC_OFFSET_AVGZERO',
              parameter: paramKey,
              passed: validVals.length > 0,
              actual: { constantB: Number(constantB.toFixed(4)), hexFormat: `0x${hexFormat}` },
              expected: { standardZero: stdZero, avgZero: Number(avgZero.toFixed(4)) },
              message: `Hàm FUNC_OFFSET_AVGZERO: CONSTANT_B = ${stdZero} - ${avgZero.toFixed(4)} = ${constantB.toFixed(4)} (HEX: 0x${hexFormat})`,
            });
          } else if (fnName === 'CHECKVALUE_PERIOD') {
            const startOffset = Number(fRule.period_start_offset_time ?? fRule.periodStartOffsetTime ?? 0);
            const duration = Number(fRule.period_duration_time ?? fRule.periodDurationTime ?? 0);
            const windowStart = baseTime + startOffset * 1000;
            const windowEnd = duration > 0 ? windowStart + duration * 1000 : Infinity;

            const inWindow = sortedPackets.filter((p) => {
              const pt = parseTimestamp(p.created_at || p.createdAt);
              return pt >= windowStart && pt <= windowEnd;
            });

            let pass = inWindow.length > 0;
            for (const p of inWindow) {
              const v = extractVal(p);
              if (v === null || isNaN(v) || v < lowThreshold || v > highThreshold) {
                pass = false;
                break;
              }
            }
            ruleResults.push({
              rule: `CHECKVALUE_PERIOD_${paramKey}`,
              functionName: 'CHECKVALUE_PERIOD',
              parameter: paramKey,
              passed: pass,
              expected: `${lowThreshold} <= ${paramKey} <= ${highThreshold} in period`,
              actual: `${inWindow.length} packets checked`,
              message: pass
                ? `Hàm CHECKVALUE_PERIOD: Toàn bộ mẫu của '${paramKey}' trong chu kỳ đạt ngưỡng [${lowThreshold}, ${highThreshold}]`
                : `Hàm CHECKVALUE_PERIOD: Có mẫu của '${paramKey}' trong chu kỳ không đạt ngưỡng [${lowThreshold}, ${highThreshold}]`,
            });
          } else if (fnName === 'CHECKAVG_PERIOD') {
            const startOffset = Number(fRule.period_start_offset_time ?? fRule.periodStartOffsetTime ?? 0);
            const duration = Number(fRule.period_duration_time ?? fRule.periodDurationTime ?? 0);
            const windowStart = baseTime + startOffset * 1000;
            const windowEnd = duration > 0 ? windowStart + duration * 1000 : Infinity;

            const inWindow = sortedPackets.filter((p) => {
              const pt = parseTimestamp(p.created_at || p.createdAt);
              return pt >= windowStart && pt <= windowEnd;
            });
            const validVals: number[] = [];
            for (const p of inWindow) {
              const v = extractVal(p);
              if (v !== null && !isNaN(v)) validVals.push(v);
            }
            const avg = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 0;
            const pass = validVals.length > 0 && avg >= lowThreshold && avg <= highThreshold;
            ruleResults.push({
              rule: `CHECKAVG_PERIOD_${paramKey}`,
              functionName: 'CHECKAVG_PERIOD',
              parameter: paramKey,
              passed: pass,
              expected: `${lowThreshold} <= AVG <= ${highThreshold} in period`,
              actual: Number(avg.toFixed(2)),
              message: pass
                ? `Hàm CHECKAVG_PERIOD: AVG của '${paramKey}' trong chu kỳ là ${avg.toFixed(2)} đạt ngưỡng [${lowThreshold}, ${highThreshold}]`
                : `Hàm CHECKAVG_PERIOD: AVG của '${paramKey}' trong chu kỳ là ${avg.toFixed(2)} không đạt ngưỡng [${lowThreshold}, ${highThreshold}]`,
            });
          }
        }
      }

      // 9. Measurement Window Packet Count Evaluation (Requirement 6)
      // Packet Count In Window = Counter At End - Counter At Start
      // Handles counter resets safely, isolates by device and execution
      const measurementWindowResults: any[] = [];
      const mWindows: any[] = Array.isArray(criteria.measurement_windows)
        ? criteria.measurement_windows
        : (Array.isArray(criteria.measurementWindows) ? criteria.measurementWindows : []);

      // Also support MEASUREMENT_WINDOW function rules
      if (Array.isArray(functionRules)) {
        for (const fRule of functionRules) {
          const fnName = (fRule.function_name || fRule.functionName || fRule.func || '').toUpperCase().trim();
          if (fnName === 'MEASUREMENT_WINDOW' && !mWindows.some((w) => (w.window_id || w.windowId) === (fRule.measurement_window_id || fRule.window_id))) {
            mWindows.push({
              window_id: fRule.measurement_window_id || fRule.window_id || `window_${mWindows.length + 1}`,
              device_target: fRule.target || 'dut',
              counter_field: fRule.counter_field || fRule.uplink_parameter || fRule.field || 'f_cnt',
              start_seconds: fRule.start_time ?? fRule.start_seconds ?? 0,
              duration_seconds: fRule.duration ?? fRule.duration_seconds,
              min_packet_count: fRule.min_count ?? fRule.min_packet_count,
              max_packet_count: fRule.max_count ?? fRule.max_packet_count,
            });
          }
        }
      }

      const parseTs = (val: any): number => {
        if (!val) return Date.now();
        if (typeof val === 'number') return val;
        const t = new Date(val).getTime();
        return isNaN(t) ? Date.now() : t;
      };

      if (mWindows.length > 0) {
        for (const wConfig of mWindows) {
          const windowId = wConfig.window_id || wConfig.windowId || `window_${measurementWindowResults.length + 1}`;
          const devTarget = (wConfig.device_target || wConfig.deviceTarget || 'dut').toLowerCase();
          const counterField = wConfig.counter_field || wConfig.counterField || 'f_cnt';

          let targetPackets: any[] = [];
          let targetIdentity = target.serialNumber || target.networkId || devTarget;

          if (devTarget === 'reference' || devTarget === 'ref') {
            targetPackets = Array.isArray(target.referencePackets || target.reference_packets)
              ? (target.referencePackets || target.reference_packets)
              : [];
            if (targetPackets.length > 0) {
              targetIdentity = targetPackets[0].serial_number || targetPackets[0].dev_eui || targetIdentity;
            }
          } else if (devTarget === 'simulator') {
            targetPackets = Array.isArray(target.simulatorPackets || target.simulator_packets)
              ? (target.simulatorPackets || target.simulator_packets)
              : [];
            if (targetPackets.length > 0) {
              targetIdentity = targetPackets[0].serial_number || targetPackets[0].dev_eui || targetIdentity;
            }
          } else {
            targetPackets = Array.isArray(target.packets) && target.packets.length > 0
              ? target.packets
              : (packet ? [packet] : []);
          }

          const sortedWinPackets = [...targetPackets].sort((a, b) => {
            const ta = parseTs(a.created_at || a.createdAt || a.received_at);
            const tb = parseTs(b.created_at || b.createdAt || b.received_at);
            return ta - tb;
          });

          const winBaseTime = sortedWinPackets.length > 0
            ? parseTs(sortedWinPackets[0].created_at || sortedWinPackets[0].createdAt || sortedWinPackets[0].received_at)
            : baseTime;

          const startOffsetSec = Number(wConfig.start_seconds ?? wConfig.startSeconds ?? 0);
          const durationSec = wConfig.duration_seconds !== undefined ? Number(wConfig.duration_seconds) : (wConfig.durationSeconds !== undefined ? Number(wConfig.durationSeconds) : null);
          const endOffsetSec = wConfig.end_seconds !== undefined ? Number(wConfig.end_seconds) : (wConfig.endSeconds !== undefined ? Number(wConfig.endSeconds) : null);

          const windowStartMs = winBaseTime + startOffsetSec * 1000;
          const windowEndMs = durationSec !== null ? windowStartMs + durationSec * 1000 : (endOffsetSec !== null ? winBaseTime + endOffsetSec * 1000 : Infinity);

          const inWin = sortedWinPackets.filter((p) => {
            const pt = parseTs(p.created_at || p.createdAt || p.received_at);
            return pt >= windowStartMs && pt <= windowEndMs;
          });

          const getCounter = (p: any): number | null => {
            if (!p) return null;
            if (p[counterField] !== undefined && p[counterField] !== null && !isNaN(Number(p[counterField]))) {
              return Number(p[counterField]);
            }
            const dec = p.decoded_payload || p.decodedPayload || {};
            if (dec[counterField] !== undefined && dec[counterField] !== null && !isNaN(Number(dec[counterField]))) {
              return Number(dec[counterField]);
            }
            if (counterField === 'f_cnt' || counterField === 'fCnt') {
              const fc = p.f_cnt ?? p.fCnt;
              if (fc !== undefined && fc !== null && !isNaN(Number(fc))) return Number(fc);
            }
            return null;
          };

          let startCounter = 0;
          let endCounter = 0;
          let windowPacketCount = 0;
          let counterResetDetected = false;

          if (inWin.length > 0) {
            const cStart = getCounter(inWin[0]);
            const cEnd = getCounter(inWin[inWin.length - 1]);
            startCounter = cStart !== null ? cStart : 0;
            endCounter = cEnd !== null ? cEnd : 0;

            if (endCounter >= startCounter) {
              windowPacketCount = endCounter - startCounter;
            } else {
              // Counter reset / rollover safe handling (LoRaWAN 16-bit or reboot)
              counterResetDetected = true;
              if (endCounter + 65536 >= startCounter && endCounter + 65536 - startCounter < 10000) {
                windowPacketCount = (endCounter + 65536) - startCounter;
              } else {
                windowPacketCount = inWin.length;
              }
            }
          }

          const minPackets = wConfig.min_packet_count !== undefined ? Number(wConfig.min_packet_count) : (wConfig.minPacketCount !== undefined ? Number(wConfig.minPacketCount) : undefined);
          const maxPackets = wConfig.max_packet_count !== undefined ? Number(wConfig.max_packet_count) : (wConfig.maxPacketCount !== undefined ? Number(wConfig.maxPacketCount) : undefined);

          let pass = true;
          if (minPackets !== undefined && windowPacketCount < minPackets) pass = false;
          if (maxPackets !== undefined && windowPacketCount > maxPackets) pass = false;

          const winResult = {
            window_id: windowId,
            name: wConfig.name || windowId,
            device_target: devTarget,
            device_identity: targetIdentity,
            counter_field: counterField,
            start_counter: startCounter,
            end_counter: endCounter,
            window_packet_count: windowPacketCount,
            actual_packets: inWin.length,
            counter_reset_detected: counterResetDetected,
            passed: pass,
            expected: minPackets !== undefined ? `>= ${minPackets}` : 'Window Packet Count calculated',
            actual: windowPacketCount,
            message: `Measurement Window '${windowId}' (${devTarget.toUpperCase()}): Packet Count = ${windowPacketCount} (Start=${startCounter}, End=${endCounter}${counterResetDetected ? ', Đã xử lý an toàn reset counter' : ''})`,
          };

          measurementWindowResults.push(winResult);
          ruleResults.push({
            rule: `MEASUREMENT_WINDOW_${windowId.toUpperCase()}_PACKET_COUNT`,
            functionName: 'MEASUREMENT_WINDOW',
            ...winResult,
          });
        }
      }

      // 10. Independent Average Function Evaluation (Requirement 7)
      // Modes: SAMPLE_COUNT, TIME_WINDOW, MEASUREMENT_WINDOW
      // Supports DUT, REFERENCE, SIMULATOR independently
      // Deduplicates LoRaWAN uplinks, never infers average from counter when metric does not exist
      const averageMetricResults: any[] = [];
      const avgRules: any[] = Array.isArray(criteria.average_rules)
        ? criteria.average_rules
        : (Array.isArray(criteria.averageRules) ? criteria.averageRules : []);

      if (Array.isArray(functionRules)) {
        for (const fRule of functionRules) {
          const fnName = (fRule.function_name || fRule.functionName || fRule.func || '').toUpperCase().trim();
          if ((fnName === 'CALC_AVERAGE' || fnName === 'AVERAGE') && !avgRules.some((r) => (r.rule_id || r.ruleId) === (fRule.rule_id || fRule.ruleId))) {
            avgRules.push({
              rule_id: fRule.rule_id || fRule.ruleId || `avg_${fRule.uplink_parameter || fRule.metric}_${avgRules.length + 1}`,
              target: fRule.target || 'dut',
              metric: fRule.uplink_parameter || fRule.metric || fRule.field || fRule.parameter,
              mode: fRule.average_mode || fRule.mode || 'TIME_WINDOW',
              sample_count: fRule.sample_count ?? fRule.count,
              start_seconds: fRule.start_time ?? fRule.start_seconds,
              duration_seconds: fRule.duration ?? fRule.duration_seconds,
              measurement_window_id: fRule.measurement_window_id,
              low_threshold: fRule.low_threshold,
              high_threshold: fRule.high_threshold,
              min_samples_required: fRule.min_samples_required ?? fRule.min_count,
            });
          }
        }
      }

      if (avgRules.length > 0) {
        for (const aRule of avgRules) {
          const ruleId = aRule.rule_id || aRule.ruleId || `avg_${aRule.metric || 'metric'}`;
          const targetRole = (aRule.target || 'dut').toLowerCase();
          const metric = aRule.metric || aRule.field || aRule.parameter || 'temperature';
          const mode = (aRule.mode || 'TIME_WINDOW').toUpperCase();
          const deduplicate = aRule.deduplicate_uplinks !== false && aRule.deduplicateUplinks !== false;

          let rawTargetPackets: any[] = [];
          let devId = target.serialNumber || target.networkId || targetRole;

          if (targetRole === 'reference' || targetRole === 'ref') {
            rawTargetPackets = Array.isArray(target.referencePackets || target.reference_packets)
              ? (target.referencePackets || target.reference_packets)
              : [];
            if (rawTargetPackets.length > 0) {
              devId = rawTargetPackets[0].serial_number || rawTargetPackets[0].dev_eui || devId;
            }
          } else if (targetRole === 'simulator') {
            rawTargetPackets = Array.isArray(target.simulatorPackets || target.simulator_packets)
              ? (target.simulatorPackets || target.simulator_packets)
              : [];
            if (rawTargetPackets.length > 0) {
              devId = rawTargetPackets[0].serial_number || rawTargetPackets[0].dev_eui || devId;
            }
          } else {
            rawTargetPackets = Array.isArray(target.packets) && target.packets.length > 0
              ? target.packets
              : (packet ? [packet] : []);
          }

          const candidatePackets = deduplicate ? this.deduplicatePackets(rawTargetPackets) : rawTargetPackets;

          const sortedPacketsForAvg = [...candidatePackets].sort((a, b) => {
            const ta = parseTs(a.created_at || a.createdAt || a.received_at);
            const tb = parseTs(b.created_at || b.createdAt || b.received_at);
            return ta - tb;
          });

          const avgBaseTime = sortedPacketsForAvg.length > 0
            ? parseTs(sortedPacketsForAvg[0].created_at || sortedPacketsForAvg[0].createdAt || sortedPacketsForAvg[0].received_at)
            : baseTime;

          let filteredPackets: any[] = [];

          if (mode === 'SAMPLE_COUNT') {
            const n = Number(aRule.sample_count ?? aRule.sampleCount ?? aRule.count ?? 10);
            filteredPackets = sortedPacketsForAvg.slice(-n);
          } else if (mode === 'MEASUREMENT_WINDOW') {
            const winId = aRule.measurement_window_id || aRule.measurementWindowId;
            const matchedWin = measurementWindowResults.find((w) => w.window_id === winId) || mWindows.find((w) => (w.window_id || w.windowId) === winId);
            if (matchedWin) {
              const startOffset = Number(matchedWin.start_seconds ?? matchedWin.startSeconds ?? 0);
              const duration = matchedWin.duration_seconds !== undefined ? Number(matchedWin.duration_seconds) : (matchedWin.durationSeconds !== undefined ? Number(matchedWin.durationSeconds) : null);
              const winStart = avgBaseTime + startOffset * 1000;
              const winEnd = duration !== null ? winStart + duration * 1000 : Infinity;
              filteredPackets = sortedPacketsForAvg.filter((p) => {
                const pt = parseTs(p.created_at || p.createdAt || p.received_at);
                return pt >= winStart && pt <= winEnd;
              });
            } else {
              filteredPackets = sortedPacketsForAvg;
            }
          } else {
            // TIME_WINDOW
            const startOffset = Number(aRule.start_seconds ?? aRule.startSeconds ?? aRule.start_time ?? 0);
            const duration = aRule.duration_seconds !== undefined ? Number(aRule.duration_seconds) : (aRule.duration !== undefined ? Number(aRule.duration) : null);
            const winStart = avgBaseTime + startOffset * 1000;
            const winEnd = duration !== null ? winStart + duration * 1000 : Infinity;
            filteredPackets = sortedPacketsForAvg.filter((p) => {
              const pt = parseTs(p.created_at || p.createdAt || p.received_at);
              return pt >= winStart && pt <= winEnd;
            });
          }

          // Extract metric values
          // Crucial: never deduce average from counter when metric does not exist!
          const metricVals: number[] = [];
          for (const p of filteredPackets) {
            const v = this.extractMetricValue(p, metric);
            if (v !== null && !isNaN(v)) {
              metricVals.push(v);
            }
          }

          const minRequired = Number(aRule.min_samples_required ?? aRule.minSamplesRequired ?? 1);
          const lowThresh = aRule.low_threshold !== undefined ? Number(aRule.low_threshold) : (aRule.lowThreshold !== undefined ? Number(aRule.lowThreshold) : undefined);
          const highThresh = aRule.high_threshold !== undefined ? Number(aRule.high_threshold) : (aRule.highThreshold !== undefined ? Number(aRule.highThreshold) : undefined);

          let status: 'SUCCESS' | 'NO_DATA' | 'INSUFFICIENT_SAMPLES' | 'TIMEOUT' | 'INVALID_DATA' = 'SUCCESS';
          let avgVal: number | null = null;
          let passed = true;
          let message = '';

          if (filteredPackets.length === 0 || metricVals.length === 0) {
            status = 'NO_DATA';
            passed = false;
            message = `Hàm Average (${targetRole.toUpperCase()}.${metric}): Không có mẫu dữ liệu thực tế (0 mẫu)`;
          } else if (metricVals.length < minRequired) {
            status = 'INSUFFICIENT_SAMPLES';
            avgVal = +(metricVals.reduce((a, b) => a + b, 0) / metricVals.length).toFixed(3);
            passed = false;
            message = `Hàm Average (${targetRole.toUpperCase()}.${metric}): Không đủ số mẫu dữ liệu (${metricVals.length}/${minRequired})`;
          } else {
            avgVal = +(metricVals.reduce((a, b) => a + b, 0) / metricVals.length).toFixed(3);
            if (lowThresh !== undefined && avgVal < lowThresh) passed = false;
            if (highThresh !== undefined && avgVal > highThresh) passed = false;
            status = 'SUCCESS';
            message = `Hàm Average (${targetRole.toUpperCase()}.${metric}) [${mode}]: ${avgVal} (${metricVals.length} mẫu)${passed ? ' đạt chuẩn' : ' không đạt ngưỡng'}`;
          }

          const avgResult = {
            rule_id: ruleId,
            mode: mode,
            value: avgVal,
            sample_count: metricVals.length,
            device_identity: devId,
            device_role: targetRole,
            metric: metric,
            measurement_reference: aRule.measurement_window_id || mode,
            status: status,
            passed: passed,
            expected: lowThresh !== undefined && highThresh !== undefined ? `[${lowThresh}, ${highThresh}]` : (lowThresh !== undefined ? `>= ${lowThresh}` : (highThresh !== undefined ? `<= ${highThresh}` : 'Average Calculated')),
            actual: avgVal,
            message: message,
          };

          averageMetricResults.push(avgResult);
          ruleResults.push({
            rule: `AVERAGE_${targetRole.toUpperCase()}_${metric.toUpperCase()}_${mode}`,
            functionName: 'CALC_AVERAGE',
            ...avgResult,
          });
        }
      }

      const passedCount = ruleResults.filter((r) => r.passed).length;
      const failedCount = ruleResults.length - passedCount;
      const verdict = failedCount === 0 ? 'PASS' : 'FAIL';

      const evaluation = {
        evaluationId: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        packetId: packet?.id || null,
        deviceId: packet?.device_id || packet?.device?.id || null,
        serialNumber: packet?.device?.serial_number || target.serialNumber,
        networkId: packet?.device?.network_id || target.networkId,
        verdict,
        totalRules: ruleResults.length,
        passedRules: passedCount,
        failedRules: failedCount,
        ruleResults,
        measurementWindows: measurementWindowResults,
        averageMetrics: averageMetricResults,
        evaluatedAt: new Date().toISOString(),
        packetSummary: {
          rawPayload,
          fPort,
          fCnt,
          rssi,
          snr,
          decoded,
        },
      };

      this.autoCheckEvaluations.unshift(evaluation);
      if (this.autoCheckEvaluations.length > 100) this.autoCheckEvaluations.length = 100;

      this.realtimeService?.publishPluginLifecycle('testing:autocheck_evaluated', evaluation);

      return {
        success: true,
        message: `Device Auto Check evaluated with verdict: ${verdict}`,
        data: evaluation,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to evaluate auto check: ${error.message}`);
      throw new HttpException(
        `Failed to evaluate auto check: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/testing/autocheck/history', 'api/v1/plugins/testing/autocheck/history'])
  getAutoCheckHistory() {
    return {
      success: true,
      data: this.autoCheckEvaluations,
    };
  }

  // ============================================================================
  // 7. CREATE DEVICE TESTING & TEST SESSIONS ORCHESTRATION
  // ============================================================================

  private deviceTestSessions: Map<string, any> = new Map();

  @Post(['api/plugins/testing/device-tests', 'api/v1/plugins/testing/device-tests'])
  async createDeviceTestSession(@Body() body: any) {
    try {
      const sessionId = (body?.sessionId || `DTEST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`).trim();
      const serialNumber = (body?.serialNumber || body?.serial_number || '').trim();
      const devEui = (body?.devEui || body?.networkId || '').trim().toUpperCase();
      const itemCode = (body?.itemCode || body?.item_code || '').trim();
      const sku = (body?.sku || '').trim();
      const sensorConnectivity = (body?.sensorConnectivity || body?.sensor_connectivity || 'LoRaWAN').trim();
      const longFw = (body?.longFw || body?.long_fw || '').trim();
      const simuId = (body?.simuId || body?.simu_id || '').trim();
      const flowConfig = body?.flowConfig || body?.flow_config || body?.flowBlocks || [];
      const autoCheckCriteria = body?.autoCheckCriteria || body?.auto_check_criteria || this.getAutoCheckRules().data;

      const session = {
        id: sessionId,
        sessionId,
        serialNumber,
        devEui,
        itemCode,
        sku,
        sensorConnectivity,
        longFw,
        simuId,
        flowConfig,
        autoCheckCriteria,
        status: 'RUNNING',
        verdict: 'PENDING',
        durationSeconds: body?.durationSeconds || 1800,
        elapsedSeconds: 0,
        startedAt: new Date().toISOString(),
        finishedAt: null,
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `Khởi tạo phiên kiểm thử thiết bị ${sessionId} cho serial [${serialNumber || devEui}]`,
          },
        ],
      };

      this.deviceTestSessions.set(sessionId, session);

      // Attempt to save to database if table exists
      try {
        const ds = this.databaseService.getDataSourceForTable('device_test_sessions');
        if (ds && ds.isInitialized) {
          await ds.query(
            `INSERT INTO system_schema.device_test_sessions
             (session_id, serial_number, dev_eui, simu_id, status, verdict, duration_seconds, flow_config, auto_check_criteria, logs, started_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (session_id) DO UPDATE SET
               status = EXCLUDED.status,
               verdict = EXCLUDED.verdict,
               flow_config = EXCLUDED.flow_config,
               auto_check_criteria = EXCLUDED.auto_check_criteria,
               logs = EXCLUDED.logs`,
            [
              sessionId,
              serialNumber || null,
              devEui || null,
              simuId || null,
              'RUNNING',
              'PENDING',
              session.durationSeconds,
              JSON.stringify(flowConfig),
              JSON.stringify(autoCheckCriteria),
              JSON.stringify(session.logs),
              session.startedAt,
            ]
          );
        }
      } catch (dbErr: any) {
        this.logger.warn(`Could not persist device test session to database: ${dbErr.message}`);
      }

      // Publish Realtime Event
      this.realtimeService?.publishPluginLifecycle('testing:device_test_created', session);

      return {
        success: true,
        message: 'Khởi tạo phiên kiểm thử thiết bị thành công',
        data: session,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create device test session: ${error.message}`);
      throw new HttpException(
        `Failed to create device test session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/testing/device-tests', 'api/v1/plugins/testing/device-tests'])
  async getDeviceTestSessions() {
    try {
      const ds = this.databaseService.getDataSourceForTable('device_test_sessions');
      if (ds && ds.isInitialized) {
        const rows = await ds.query(
          `SELECT session_id as "sessionId", serial_number as "serialNumber", dev_eui as "devEui",
                  simu_id as "simuId", status, verdict, duration_seconds as "durationSeconds",
                  started_at as "startedAt", finished_at as "finishedAt", flow_config as "flowConfig",
                  auto_check_criteria as "autoCheckCriteria", logs
           FROM system_schema.device_test_sessions
           ORDER BY started_at DESC LIMIT 50`
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return {
            success: true,
            data: rows,
          };
        }
      }
    } catch (e: any) {
      this.logger.warn(`Could not query device test sessions from DB: ${e.message}`);
    }

    return {
      success: true,
      data: Array.from(this.deviceTestSessions.values()).sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      ),
    };
  }

  @Get(['api/plugins/testing/device-tests/:sessionId', 'api/v1/plugins/testing/device-tests/:sessionId'])
  async getDeviceTestSessionById(@Param('sessionId') sessionId: string) {
    const memorySession = this.deviceTestSessions.get(sessionId);
    if (memorySession) {
      return {
        success: true,
        data: memorySession,
      };
    }

    try {
      const ds = this.databaseService.getDataSourceForTable('device_test_sessions');
      if (ds && ds.isInitialized) {
        const rows = await ds.query(
          `SELECT session_id as "sessionId", serial_number as "serialNumber", dev_eui as "devEui",
                  simu_id as "simuId", status, verdict, duration_seconds as "durationSeconds",
                  started_at as "startedAt", finished_at as "finishedAt", flow_config as "flowConfig",
                  auto_check_criteria as "autoCheckCriteria", logs
           FROM system_schema.device_test_sessions
           WHERE session_id = $1`,
          [sessionId]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return {
            success: true,
            data: rows[0],
          };
        }
      }
    } catch (e: any) {
      this.logger.warn(`Could not query device test session by ID: ${e.message}`);
    }

    throw new NotFoundException(`Device test session '${sessionId}' not found`);
  }

  // ============================================================================
  // 8. FLOW ĐĂNG KÝ THIẾT BỊ TEST 3 BƯỚC (STEP 1..3) & CHIRPSTACK PROVISIONING
  // ============================================================================

  @Get(['api/plugins/testing/network-servers', 'api/v1/plugins/testing/network-servers'])
  async getTestingNetworkServers() {
    try {
      const serverRepo = this.databaseService.getRepositoryForTable(
        'lorawan_chirpstack',
        ChirpstackNetworkServerEntity,
      );
      const servers = await serverRepo.find({
        order: { updatedAt: 'DESC' },
      });
      return {
        success: true,
        data: servers.map((s) => ({
          id: s.id,
          name: s.name,
          apiUrl: s.apiUrl,
          apiToken: s.apiToken ? '••••••••' : null,
          tenantId: s.tenantId,
          applicationId: s.applicationId || null,
          deviceProfileId: s.deviceProfileId || null,
          status: s.isActive ? 'online' : 'offline',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
      };
    } catch (e: any) {
      this.logger.warn(`Could not load Chirpstack Network Servers from DB: ${e.message}`);
      return {
        success: true,
        data: [
          {
            id: 'srv-globiots-test',
            name: 'Globiots ChirpStack Test Network Server',
            apiUrl: 'https://chirpstack-test-api.globiots.com',
            apiToken: '••••••••',
            tenantId: '52f14fb4-c5a1-4566-9b57-69502b78a9c1',
            applicationId: 'app-iot-monitoring',
            deviceProfileId: 'dp-as923-otaa',
            status: 'online',
          },
        ],
      };
    }
  }

  @Post(['api/plugins/testing/register-device-flow', 'api/v1/plugins/testing/register-device-flow'])
  async registerDeviceFlow3Steps(@Body() body: any, @Req() request?: any) {
    try {
      // Step 1: Validate metadata from Step 1 & Step 2
      const connectivity = (body?.connectivity || 'LoRaWAN').trim();
      const rawSoNumber = (body?.soNumber || body?.so_number || '').trim();
      const rawWaNumber = (body?.waNumber || body?.wa_number || '').trim();

      // Standardize SO and WA numbers: enforce SO/XXXX/XXXXX and WA/XXXX/XXXXX format (X numeric)
      const soMatch = rawSoNumber.match(/SO\/\d+\/\d+/i);
      const soNumber = soMatch ? soMatch[0].toUpperCase() : rawSoNumber.toUpperCase();

      const waMatch = rawWaNumber.match(/WA\/\d+\/\d+/i);
      const waNumber = waMatch ? waMatch[0].toUpperCase() : rawWaNumber.toUpperCase();

      let tenantId = (body?.tenantId || body?.tenant_id || '').trim();
      const serverId = (body?.serverId || body?.server_id || '').trim();
      let serverUrl = '';
      let apiToken = '';

      // Step 2 Registers (0..259, 386)
      const fwCode = (body?.fwCode || body?.FW_CODE || '').trim();
      const fwVersion = (body?.fwVersion || body?.FW_VERSION || '').trim();
      const hwVersion = (body?.hwVersion || body?.HW_VERSION || '').trim();
      const meVersion = (body?.meVersion || body?.ME_VERSION || '').trim();
      const devEui = (body?.devEui || body?.deviceEUI || body?.networkId || '').trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase();
      const appEui = (body?.appEui || body?.LRW_appEUI || body?.joinEui || '').trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase();
      const appKey = (body?.appKey || body?.LRW_appKey || '').trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase();
      const regionCode = (body?.regionCode || body?.region_code || 'AS923-1').trim();
      const deviceClass = (body?.deviceClass || body?.class || 'CLASS_A').trim();
      const sensorType = (body?.sensorType || body?.sensor_type || '1').trim();
      const serialNumber = (body?.serialNumber || body?.SERIAL_NUMBER || '').trim();
      const itemCode = (body?.itemCode || body?.ITEM_CODE || '').trim();
      const createdBy = (request?.user?.username || body?.createdBy || body?.created_by || body?.username || body?.user || 'tester').trim();
      let applicationId = (body?.applicationId || body?.application_id || '').trim();
      let deviceProfileId = (body?.deviceProfileId || body?.device_profile_id || '').trim();

      // Resolve credentials and defaults from the selected server, never client URLs/tokens.
      if (!serverId) throw new BadRequestException('Network Server là bắt buộc');
      const serverRepo = this.databaseService.getRepositoryForTable('network_servers', ChirpstackNetworkServerEntity);
      const serverRecord = await serverRepo.findOne({ where: { id: serverId, isActive: true } });
      if (!serverRecord) throw new BadRequestException('Network Server không tồn tại hoặc đã tắt');
      tenantId = serverRecord.tenantId || '';
      applicationId = serverRecord.applicationId || '';
      serverUrl = serverRecord.apiUrl;
      apiToken = serverRecord.apiToken;
      if (!tenantId || !applicationId || !serverUrl || !apiToken) throw new BadRequestException('Cần cấu hình API URL, token, Default Tenant ID và Default Application ID');

      // Only accept real profiles returned for this tenant. Never reuse server defaults.
      const profiles: any[] = [];
      try {
        let offset = 0;
        do {
          const dpUrl = serverUrl.replace(/\/+$/, '') + `/api/device-profiles?limit=100&offset=${offset}&tenantId=${encodeURIComponent(tenantId)}`;
          const dpRes = await fetch(dpUrl, {
            headers: { Accept: 'application/json', Authorization: `Bearer ${apiToken}` },
            signal: AbortSignal.timeout(8000),
          });
          if (!dpRes.ok) throw new Error(`HTTP ${dpRes.status}`);
          const data: any = await dpRes.json();
          if (!Array.isArray(data.result)) throw new Error('Invalid device-profiles response');
          profiles.push(...data.result);
          offset += data.result.length;
          if (data.result.length === 0 || offset >= Number(data.totalCount ?? offset)) break;
        } while (true);
      } catch (error: any) {
        throw new BadRequestException(`Không lấy được Device Profiles của tenant: ${error.message}`);
      }
      const normalizeRegion = (value: unknown) => String(value || '').toUpperCase().replace(/[-_\s]/g, '');
      const region = normalizeRegion(regionCode);
      const classCode = deviceClass.toUpperCase().replace(/^CLASS[_\s-]?/, '');
      const matches = profiles.filter((profile) => {
        const profileRegion = normalizeRegion(profile.region);
        const baseReg = region.replace(/[^A-Z0-9]/g, '');
        const baseProf = profileRegion.replace(/[^A-Z0-9]/g, '');
        const isRegionMatch = profileRegion === region ||
          (baseReg.startsWith('AU915') && baseProf.startsWith('AU915')) ||
          (baseReg.startsWith('AS923') && baseProf.startsWith('AS923')) ||
          (baseReg.startsWith('US915') && baseProf.startsWith('US915')) ||
          (baseReg.startsWith('EU868') && baseProf.startsWith('EU868'));
        const tenantOk = !profile.tenantId || !tenantId ||
          String(profile.tenantId).trim().toLowerCase() === String(tenantId).trim().toLowerCase();
        const pSupportsB = Boolean(profile.supportsClassB === true || profile.supportsClassB === 'true');
        const pSupportsC = Boolean(profile.supportsClassC === true || profile.supportsClassC === 'true');

        return typeof profile.id === 'string' && profile.id.trim() && region && isRegionMatch && tenantOk &&
          (!['B', '1'].includes(classCode) || pSupportsB) &&
          (!['C', '2'].includes(classCode) || pSupportsC);
      });
      const selected = deviceProfileId ? matches.find((profile) => profile.id === deviceProfileId) : matches.length === 1 ? matches[0] : undefined;
      if (!selected) throw new BadRequestException('Không xác định được Device Profile phù hợp tenant/region/class; hãy chọn profile hợp lệ');
      deviceProfileId = selected.id;

      if (!devEui) {
        throw new BadRequestException('deviceEUI (thanh ghi 27) là bắt buộc để đăng ký thiết bị!');
      }

      // Step 3: Đăng ký lên ChirpStack Network Server qua 2 cuộc gọi API
      // Call 1: POST /api/devices
      const chirpstackDevicePayload = {
        device: {
          applicationId,
          description: 'ITEST 2.0',
          devEui: devEui.toLowerCase(),
          deviceProfileId,
          isDisabled: false,
          joinEui: (appEui || '0000000000000000').toLowerCase(),
          name: serialNumber || `DEV-${devEui}`,
          skipFcntCheck: true,
        },
        variables: {
          soNumber,
          waNumber,
          itemCode,
          fwCode,
          fwVersion,
          hwVersion,
          sensorType,
        },
      };

      let chirpstackSuccess = false;
      let chirpstackError = '';
      const stages = { device: 'pending', keys: 'pending', local: 'pending', registration: 'pending' };
      const localWarnings: string[] = [];

      if (serverUrl) {
        try {
          const targetUrl = serverUrl.replace(/\/+$/, '') + '/api/devices';
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          };
          if (apiToken) {
            headers.Authorization = `Bearer ${apiToken}`;
          }

          const resp1 = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(chirpstackDevicePayload),
            signal: AbortSignal.timeout(8000),
          });

          if (resp1.ok) {
            stages.device = 'success';
            // Call 2: Set OTAA Keys POST /api/devices/{devEui}/keys
            if (appKey) {
              const keysUrl = serverUrl.replace(/\/+$/, '') + `/api/devices/${devEui.toLowerCase()}/keys`;
              const keysResponse = await fetch(keysUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  deviceKeys: {
                    devEui: devEui.toLowerCase(),
                    nwkKey: appKey.toLowerCase(),
                    appKey: appKey.toLowerCase(),
                  },
                }),
                signal: AbortSignal.timeout(8000),
              });
              stages.keys = keysResponse.ok ? 'success' : 'failed';
              if (!keysResponse.ok) chirpstackError = `Thiết bị đã tạo trên ChirpStack nhưng ghi OTAA keys thất bại [${keysResponse.status}]`;
              chirpstackSuccess = keysResponse.ok;
            } else {
              stages.keys = 'failed';
              chirpstackError = 'Thiết bị đã tạo trên ChirpStack nhưng thiếu AppKey để ghi OTAA keys';
            }
          } else {
            const errBody = await resp1.text().catch(() => '');
            const isDuplicate =
              resp1.status === 409 ||
              errBody.includes('device_pkey') ||
              errBody.includes('duplicate key') ||
              errBody.toLowerCase().includes('already exists');
            stages.device = isDuplicate ? 'exists' : 'failed';
            stages.keys = 'skipped';
            chirpstackError = isDuplicate
              ? 'Thiết bị đã có trên hệ thống.'
              : `Tạo thiết bị trên ChirpStack thất bại [${resp1.status}]: ${errBody}`;
          }
        } catch (fetchErr: any) {
          if (stages.device === 'success') stages.keys = 'unknown';
          else stages.device = 'unknown';
          chirpstackError = `${stages.device === 'success' ? 'Thiết bị đã tạo nhưng không xác nhận được bước ghi keys' : 'Không xác nhận được bước tạo thiết bị'}: ${fetchErr.message}`;
        }
      }

      // Persist / Sync to local database `devices`
      let localDev: any;
      try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      localDev = await deviceRepo.findOne({
        where: [{ network_id: devEui }, ...(serialNumber ? [{ serial_number: serialNumber }] : [])],
      });

      if (!localDev) {
        localDev = deviceRepo.create({
          serial_number: serialNumber || `SN-${devEui}`,
          network_id: devEui,
          device_name: serialNumber || `LoRaWAN Node ${devEui.substring(devEui.length - 4)}`,
          device_type: 'lorawan_node',
          plugin_id: 'testing',
          so_number: soNumber || null,
          wa_number: waNumber || null,
          item_code: itemCode || null,
          status: 'active',
          metadata: {
            fw_code: fwCode,
            fw_version: fwVersion,
            hw_version: hwVersion,
            me_version: meVersion,
            app_eui: appEui,
            region_code: regionCode,
            class: deviceClass,
            sensor_type: sensorType,
            application_id: applicationId,
            device_profile_id: deviceProfileId,
            registered_to_ns: chirpstackSuccess,
            ns_url: serverUrl,
            registered_at: new Date().toISOString(),
          },
        });
      } else {
        if (serialNumber) localDev.serial_number = serialNumber;
        if (soNumber) localDev.so_number = soNumber;
        if (waNumber) localDev.wa_number = waNumber;
        if (itemCode) localDev.item_code = itemCode;
        localDev.status = 'active';
        localDev.metadata = {
          ...(localDev.metadata || {}),
          fw_code: fwCode,
          fw_version: fwVersion,
          hw_version: hwVersion,
          me_version: meVersion,
          app_eui: appEui,
          region_code: regionCode,
          class: deviceClass,
          sensor_type: sensorType,
          application_id: applicationId,
          device_profile_id: deviceProfileId,
          registered_to_ns: chirpstackSuccess,
          ns_url: serverUrl,
          registered_at: new Date().toISOString(),
        };
      }
      await deviceRepo.save(localDev);
      stages.local = 'success';
      } catch (error: any) {
        stages.local = 'failed';
        localWarnings.push(`Không lưu được thiết bị vào hệ thống: ${error.message}`);
      }

      // Persist to system_schema.device_test_registrations (Migration 010)
      try {
        const ds = this.databaseService.getDataSourceForTable('devices');
        if (ds) {
          let resolvedSoId = (body?.soId || body?.so_id || '').trim() || null;
          let resolvedWaId = (body?.waId || body?.wa_id || '').trim() || null;

          if (!resolvedSoId && soNumber) {
            const soRows = await ds.query(
              `SELECT id FROM traceability_manager.traceability_so WHERE so_number = $1 LIMIT 1`,
              [soNumber],
            ).catch(() => []);
            resolvedSoId = soRows[0]?.id || null;
          }
          if (!resolvedWaId && waNumber) {
            const waRows = await ds.query(
              `SELECT id FROM traceability_manager.traceability_wa WHERE wa_number = $1 LIMIT 1`,
              [waNumber],
            ).catch(() => []);
            resolvedWaId = waRows[0]?.id || null;
          }

          const regCode = `REG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await ds.query(
            `INSERT INTO system_schema.device_test_registrations (
              registration_code, connectivity, so_id, so_number, wa_id, wa_number, item_code,
              network_server_id, network_server_url, application_id, device_profile_id,
              fw_code, fw_version, hw_version, me_version,
              dev_eui, app_eui, app_key, region_code, class_mode, sensor_type, serial_number,
              status, message, chirpstack_payload, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
            )`,
            [
              regCode, connectivity, resolvedSoId, soNumber || null, resolvedWaId, waNumber || null, itemCode || null,
              serverId || null, serverUrl, applicationId, deviceProfileId,
              fwCode || null, fwVersion || null, hwVersion || null, meVersion || null,
              devEui, appEui || null, appKey || null, regionCode, deviceClass, sensorType || null, serialNumber || null,
              chirpstackSuccess ? 'SUCCESS_ATTACH_BATTERY' : 'FAILED',
              chirpstackSuccess ? 'Đăng ký Thành công vui lòng gắn pin cảm biến' : (chirpstackError || 'Chirpstack registration failed'),
              JSON.stringify(chirpstackDevicePayload),
              createdBy,
            ],
          );
          stages.registration = 'success';
        } else {
          throw new Error('Database connection unavailable');
        }
      } catch (error: any) {
        stages.registration = 'failed';
        localWarnings.push(`Không lưu được lịch sử đăng ký: ${error.message}`);
      }

      const message = [chirpstackSuccess ? 'Đăng ký thành công trên ChirpStack; vui lòng gắn pin cảm biến' : chirpstackError, ...localWarnings].filter(Boolean).join('. ');
      // Publish Realtime Event
      this.realtimeService?.publishPluginLifecycle('testing:device_registered', {
        deviceId: localDev?.id,
        serialNumber: localDev?.serial_number,
        networkId: localDev?.network_id,
        soNumber,
        waNumber,
        itemCode,
        chirpstackSuccess,
        message,
        stages,
      });

      return {
        success: chirpstackSuccess,
        message,
        stages,
        warnings: localWarnings,
        data: {
          device: localDev,
          chirpstackPayload: chirpstackDevicePayload,
          chirpstackSuccess,
          error: chirpstackError || null,
        },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to register device flow 3 steps: ${error.message}`);
      throw new HttpException(
        `Failed to register device flow: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 9. LIST & MANAGE TESTING DEVICES (Migration 011 & v_list_device_testing)
  // ============================================================================

  @Get(['api/plugins/testing/default-application', 'api/v1/plugins/testing/default-application'])
  async getDefaultTestingApplication() {
    try {
      const serverRepo = this.databaseService.getRepositoryForTable('lorawan_chirpstack', ChirpstackNetworkServerEntity);
      const activeServer = await serverRepo.findOne({ where: { isActive: true } });
      return {
        success: true,
        data: {
          serverId: activeServer?.id || null,
          serverName: activeServer?.name || 'ChirpStack Server',
          tenantId: activeServer?.tenantId || null,
          applicationId: activeServer?.applicationId || null,
          deviceProfileId: activeServer?.deviceProfileId || null,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message,
      };
    }
  }

  @Get(['api/plugins/testing/device-registrations', 'api/v1/plugins/testing/device-registrations'])
  async getTestingDeviceRegistrations(@Query() query: any, @Req() request?: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) {
        return {
          success: true,
          data: [],
          total: 0,
          page: 1,
          limit: 20,
        };
      }

      const page = Math.max(1, parseInt(query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
      const offset = (page - 1) * limit;

      const user = (request?.user?.username || query.user || query.username || '').trim();
      const role = (request?.user?.role || request?.user?.roles?.[0] || query.role || '').toUpperCase().trim();
      const isAdmin = query.isAdmin === true || query.isAdmin === 'true' || query.isAdmin === '1' ||
                      ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR'].includes(role);

      // Resolve default applicationId if not explicitly provided
      let applicationId = (query.applicationId || query.application_id || '').trim();
      let defaultAppId = '';
      try {
        const serverRepo = this.databaseService.getRepositoryForTable('lorawan_chirpstack', ChirpstackNetworkServerEntity);
        const activeServer = await serverRepo.findOne({ where: { isActive: true } });
        if (activeServer?.applicationId) {
          defaultAppId = activeServer.applicationId.trim();
        }
      } catch (err: any) {
        this.logger.debug(`Could not resolve default applicationId from active network server: ${err.message}`);
      }

      // If user did not specify an applicationId (and not asking for ALL), default to the active network server's applicationId
      const filterAllApps = applicationId.toUpperCase() === 'ALL';
      if (!applicationId && defaultAppId) {
        applicationId = defaultAppId;
      } else if (filterAllApps) {
        applicationId = '';
      }

      const whereClauses: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      // Filter by Application ID if active
      if (applicationId) {
        whereClauses.push(`v.application_id = $${pIdx++}`);
        params.push(applicationId);
      }

      // Role-based visibility:
      // If not admin, only show devices created by this user
      if (!isAdmin) {
        if (user) {
          whereClauses.push(`LOWER(v.created_by) = LOWER($${pIdx++})`);
          params.push(user);
        } else {
          whereClauses.push(`1 = 0`);
        }
      } else if (user && (query.mine === true || query.mine === 'true' || query.filterMode === 'mine')) {
        whereClauses.push(`LOWER(v.created_by) = LOWER($${pIdx++})`);
        params.push(user);
      }

      // Search filter across serial_number, dev_eui, item_code, registration_code
      const search = (query.search || '').trim();
      if (search) {
        whereClauses.push(`(
          v.serial_number ILIKE $${pIdx} OR
          v.dev_eui ILIKE $${pIdx} OR
          v.item_code ILIKE $${pIdx} OR
          v.registration_code ILIKE $${pIdx}
        )`);
        params.push(`%${search}%`);
        pIdx++;
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Count query - try view first, fallback to table if view not yet created
      let total = 0;
      let rows: any[] = [];
      try {
        const countSql = `SELECT COUNT(*) AS total FROM system_schema.v_list_device_testing v ${whereSql}`;
        const countResult = await ds.query(countSql, params);
        total = parseInt(countResult?.[0]?.total || '0', 10);

        const listSql = `
          SELECT
            v.id,
            v.registration_code,
            v.serial_number,
            v.item_code,
            v.fw_version,
            v.hw_version,
            v.fw_code,
            v.me_version,
            v.dev_eui,
            v.app_eui,
            v.app_key,
            v.class_mode,
            COALESCE(v.class, v.class_mode, 'A') AS "class",
            COALESCE(v.region, v.region_code, 'AS923-1') AS "region",
            v.sensor_type,
            v.created_by,
            v.application_id,
            v.device_profile_id,
            v.network_server_id,
            v.network_server_name,
            v.network_server_url,
            v.connectivity,
            v.so_number,
            v.wa_number,
            v.status,
            v.message,
            v.created_at,
            v.updated_at
          FROM system_schema.v_list_device_testing v
          ${whereSql}
          ORDER BY v.created_at DESC
          LIMIT $${pIdx++} OFFSET $${pIdx++}
        `;
        rows = await ds.query(listSql, [...params, limit, offset]);
      } catch (viewErr: any) {
        this.logger.warn(`View system_schema.v_list_device_testing fallback: ${viewErr.message}`);
        // Fallback to table directly
        const countSql = `SELECT COUNT(*) AS total FROM system_schema.device_test_registrations v ${whereSql}`;
        const countResult = await ds.query(countSql, params);
        total = parseInt(countResult?.[0]?.total || '0', 10);

        const listSql = `
          SELECT
            v.id,
            v.registration_code,
            v.serial_number,
            v.item_code,
            v.fw_version,
            v.hw_version,
            v.fw_code,
            v.me_version,
            v.dev_eui,
            v.app_eui,
            v.app_key,
            v.class_mode,
            v.class_mode AS "class",
            v.region_code AS "region",
            v.sensor_type,
            v.created_by,
            v.application_id,
            v.device_profile_id,
            v.network_server_id,
            v.network_server_name,
            v.network_server_url,
            v.connectivity,
            v.so_number,
            v.wa_number,
            v.status,
            v.message,
            v.created_at,
            v.updated_at
          FROM system_schema.device_test_registrations v
          ${whereSql}
          ORDER BY v.created_at DESC
          LIMIT $${pIdx++} OFFSET $${pIdx++}
        `;
        rows = await ds.query(listSql, [...params, limit, offset]);
      }

      // Query ChirpStack for real-time status of returned devices
      const csStatusMap = new Map<string, { status: string; lastSeenAt: string | null; batteryLevel?: number }>();
      try {
        let activeServer = null;
        const serverRepo = this.databaseService.getRepositoryForTable('lorawan_chirpstack', ChirpstackNetworkServerEntity);
        if (serverRepo) {
          activeServer = await serverRepo.findOne({ where: { isActive: true } });
        }
        if (activeServer && activeServer.apiUrl && activeServer.apiToken) {
          const targetApp = applicationId || activeServer.applicationId || '';
          if (targetApp) {
            const csUrl = `${activeServer.apiUrl.replace(/\/+$/, '')}/api/devices?limit=100&applicationId=${encodeURIComponent(targetApp)}`;
            const csRes = await fetch(csUrl, {
              headers: {
                'Accept': 'application/json',
                'Grpc-Metadata-Authorization': `Bearer ${activeServer.apiToken}`,
                'Authorization': `Bearer ${activeServer.apiToken}`,
              },
              signal: AbortSignal.timeout(4000),
            });
            if (csRes.ok) {
              const csData: any = await csRes.json();
              const items = csData.result || csData.devices || [];
              for (const it of items) {
                if (it.devEui) {
                  const key = String(it.devEui).replace(/[^0-9a-fA-F]/g, '').toLowerCase();
                  let calculatedStatus = 'NEVER_SEEN';
                  if (it.isDisabled) {
                    calculatedStatus = 'DISABLED';
                  } else if (it.lastSeenAt) {
                    calculatedStatus = 'ONLINE';
                  }
                  csStatusMap.set(key, {
                    status: calculatedStatus,
                    lastSeenAt: it.lastSeenAt || null,
                    batteryLevel: it.deviceStatus?.batteryLevel,
                  });
                }
              }
            }
          }
        }
      } catch (csErr: any) {
        this.logger.debug(`Could not fetch real-time device status from ChirpStack: ${csErr.message}`);
      }

      return {
        success: true,
        data: rows.map((r: any) => {
          const cleanDev = String(r.dev_eui || '').replace(/[^0-9a-fA-F]/g, '').toLowerCase();
          const csInfo = csStatusMap.get(cleanDev);
          const networkStatus = csInfo ? csInfo.status : (r.status === 'SUCCESS_ATTACH_BATTERY' ? 'REGISTERED' : (r.status || 'UNKNOWN'));
          const lastSeenAt = csInfo?.lastSeenAt || null;

          return {
            id: r.id,
            registrationCode: r.registration_code,
            serialNumber: r.serial_number,
            itemCode: r.item_code,
            fwVersion: (r.fw_version || '').replace(/^[vV]/, ''),
            hwVersion: (r.hw_version || '').replace(/^[vV]/, ''),
            fwCode: r.fw_code,
            meVersion: r.me_version,
            devEui: r.dev_eui,
            appEui: r.app_eui,
            appKey: r.app_key,
            class: r.class || r.class_mode || 'A',
            classMode: r.class_mode || r.class || 'A',
            region: r.region || r.region_code || 'AS923-1',
            regionCode: r.region_code || r.region || 'AS923-1',
            sensorType: r.sensor_type,
            createdBy: r.created_by,
            applicationId: r.application_id,
            deviceProfileId: r.device_profile_id,
            networkServerId: r.network_server_id,
            networkServerName: r.network_server_name,
            networkServerUrl: r.network_server_url,
            connectivity: r.connectivity,
            soNumber: r.so_number,
            waNumber: r.wa_number,
            status: networkStatus,
            networkStatus,
            lastSeenAt,
            message: r.message,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
        }),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        defaultApplicationId: defaultAppId,
        currentApplicationId: applicationId || null,
        isAdmin,
      };
    } catch (error: any) {
      this.logger.error(`Error in getTestingDeviceRegistrations: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Lỗi khi lấy danh sách thiết bị testing: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete([
    'api/plugins/testing/device-registrations/:id',
    'api/v1/plugins/testing/device-registrations/:id',
  ])
  async deleteTestingDeviceRegistration(
    @Param('id') id: string,
    @Query() query: any,
  ) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) {
        throw new NotFoundException('Không thể kết nối đến cơ sở dữ liệu');
      }

      const rows = await ds.query(
        `SELECT * FROM system_schema.device_test_registrations WHERE id = $1`,
        [id],
      );
      if (!rows || rows.length === 0) {
        throw new NotFoundException(`Không tìm thấy thiết bị test với ID ${id}`);
      }
      const reg = rows[0];

      // Check permission
      const user = (query.user || query.username || '').trim();
      const role = (query.role || '').toUpperCase().trim();
      const isAdmin = query.isAdmin === true || query.isAdmin === 'true' || query.isAdmin === '1' ||
                      ['ADMIN', 'SUPER_ADMIN', 'ADMINISTRATOR'].includes(role);

      if (!isAdmin && user && reg.created_by) {
        if (reg.created_by.toLowerCase() !== user.toLowerCase()) {
          throw new HttpException(
            {
              success: false,
              message: 'Bạn không có quyền xóa thiết bị do người dùng khác tạo.',
            },
            HttpStatus.FORBIDDEN,
          );
        }
      }

      // Attempt ChirpStack deletion if dev_eui is present
      let csDeleted = false;
      let csMessage = '';
      if (reg.dev_eui) {
        try {
          let serverUrl = reg.network_server_url;
          let apiToken = '';
          const serverRepo = this.databaseService.getRepositoryForTable('lorawan_chirpstack', ChirpstackNetworkServerEntity);
          let srv = null;
          if (reg.network_server_id) {
            srv = await serverRepo.findOne({ where: { id: reg.network_server_id } }).catch(() => null);
          }
          if (!srv) {
            srv = await serverRepo.findOne({ where: { isActive: true } }).catch(() => null);
          }
          if (srv) {
            serverUrl = srv.apiUrl || srv.api_url || serverUrl;
            apiToken = srv.apiToken || srv.api_token || '';
          }

          if (serverUrl && apiToken) {
            const cleanDevEui = (reg.dev_eui || '').replace(/[^0-9a-fA-F]/g, '').toLowerCase();
            const csUrl = `${serverUrl.replace(/\/+$/, '')}/api/devices/${encodeURIComponent(cleanDevEui)}`;
            const csRes = await fetch(csUrl, {
              method: 'DELETE',
              headers: {
                'Accept': 'application/json',
                'Grpc-Metadata-Authorization': `Bearer ${apiToken}`,
                'Authorization': `Bearer ${apiToken}`,
              },
              signal: AbortSignal.timeout(8000),
            });
            csDeleted = csRes.ok || csRes.status === 404;
            csMessage = csRes.ok
              ? 'Đã xóa thiết bị trên ChirpStack thành công'
              : csRes.status === 404
              ? 'Thiết bị không tồn tại trên ChirpStack'
              : `ChirpStack trả về mã ${csRes.status}`;
          }
        } catch (csErr: any) {
          this.logger.warn(`Could not delete device ${reg.dev_eui} from ChirpStack: ${csErr.message}`);
          csMessage = `Lỗi kết nối ChirpStack: ${csErr.message}`;
        }
      }

      // Delete from devices.devices if present
      try {
        const deviceRepo = this.databaseService.getRepositoryForTable('devices', TestingDeviceEntity);
        if (reg.serial_number) {
          await deviceRepo.delete({ serial_number: reg.serial_number }).catch(() => null);
        }
        if (reg.dev_eui) {
          await deviceRepo.delete({ network_id: reg.dev_eui.toUpperCase() }).catch(() => null);
        }
      } catch (e: any) {
        this.logger.warn(`Could not delete from devices.devices: ${e.message}`);
      }

      // Delete from system_schema.device_test_registrations
      await ds.query(`DELETE FROM system_schema.device_test_registrations WHERE id = $1`, [id]);

      return {
        success: true,
        message: `Đã xóa thiết bị ${reg.serial_number || reg.dev_eui} thành công`,
        data: {
          id: reg.id,
          serialNumber: reg.serial_number,
          devEui: reg.dev_eui,
          chirpstackDeleted: csDeleted,
          chirpstackDetail: csMessage,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error deleting testing device registration: ${error.message}`);
      throw new HttpException(
        {
          success: false,
          message: `Không thể xóa thiết bị test: ${error.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 10. TEST BATCH & CREATE TEST BATCH (Migration 012 & Multi-Device Testing)
  // ============================================================================

  @Get(['api/plugins/testing/test-batches/meta', 'api/v1/plugins/testing/test-batches/meta'])
  async getTestBatchMetadata() {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      let itemCodes: string[] = [];
      let fwVersions: string[] = [];

      if (ds) {
        try {
          const rows = await ds.query(`
            SELECT DISTINCT item_code, fw_version, COALESCE(long_fw, fw_version) AS long_fw
            FROM system_schema.device_test_registrations
            WHERE item_code IS NOT NULL AND item_code != ''
            ORDER BY item_code ASC
          `);
          itemCodes = Array.from(new Set(rows.map((r: any) => r.item_code).filter(Boolean)));
          fwVersions = Array.from(new Set(rows.map((r: any) => r.long_fw || r.fw_version).filter(Boolean)));
        } catch {
          try {
            const rows = await ds.query(`
              SELECT DISTINCT item_code, fw_version
              FROM system_schema.device_test_registrations
              WHERE item_code IS NOT NULL AND item_code != ''
              ORDER BY item_code ASC
            `);
            itemCodes = Array.from(new Set(rows.map((r: any) => r.item_code).filter(Boolean)));
            fwVersions = Array.from(new Set(rows.map((r: any) => r.fw_version).filter(Boolean)));
          } catch (err: any) {
            this.logger.debug(`Could not load item_codes from DB: ${err.message}`);
          }
        }
      }

      if (itemCodes.length === 0) {
        itemCodes = ['LR-SENSOR-TEMP-V1', 'LR-SENSOR-GAS-V2', 'LR-WATER-METER-V1', 'LR-ENERGY-METER-V3'];
      }
      if (fwVersions.length === 0) {
        fwVersions = ['v6.0101', 'v6.0102', 'v1.0.0', 'v2.1.0'];
      }

      // Default simulation flow blocks
      const defaultFlow = [];

      // Default autocheck criteria
      const defaultCriteria = {
        name: 'Tiêu chuẩn đối chiếu thiết bị chuẩn',
        rules: [
          { field: 'temperature', operator: 'tolerance_relative', tolerancePercent: 5.0, description: 'Sai số nhiệt độ so với chuẩn <= 5%' },
          { field: 'humidity', operator: 'tolerance_relative', tolerancePercent: 8.0, description: 'Sai số độ ẩm so với chuẩn <= 8%' },
          { field: 'battery', operator: 'gte', targetValue: 80, description: 'Pin DUT >= 80%' },
        ],
        packetCountMin: 3,
      };

      return {
        success: true,
        data: {
          itemCodes,
          fwVersions,
          defaultFlow,
          defaultCriteria,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get(['api/plugins/testing/test-batches/available-devices', 'api/v1/plugins/testing/test-batches/available-devices'])
  @UseGuards(JwtAuthGuard)
  async getAvailableDevicesForBatch(@Query() query: any, @Req() request?: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      const itemCode = (query.itemCode || query.item_code || '').trim();
      const fwVersion = (query.fwVersion || query.fw_version || query.longFw || query.long_fw || '').trim();
      const soNumber = (query.soNumber || query.so_number || '').trim();
      const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 100));

      const username = (request?.user?.username || query.user || query.username || '').trim();
      if (!ds) {
        return { success: true, data: [], items: [], total: 0 };
      }

      const buildWhere = (tableAlias: 'v' | 'r', hasLongFw: boolean) => {
        const clauses: string[] = [];
        const params: any[] = [];
        let pIdx = 1;

        // User filter: filter by created_by only if explicitly requested with onlyMine
        const onlyMine = query.onlyMine === true || query.onlyMine === 'true' || query.onlyMine === '1';
        if (onlyMine) {
          clauses.push(`LOWER(${tableAlias}.created_by) = LOWER($${pIdx++})`);
          params.push(username);
        }

        // Exclude devices currently in a running test batch
        clauses.push(`${tableAlias}.serial_number NOT IN (
          SELECT bi.serial_number FROM system_schema.device_test_batch_items bi
          JOIN system_schema.device_test_batches b ON bi.batch_id = b.id
          WHERE b.status = 'RUNNING'
        )`);

        // Exclude reference devices
        clauses.push(`COALESCE(${tableAlias}.is_reference, false) = false`);

        if (itemCode) {
          clauses.push(`UPPER(${tableAlias}.item_code) = UPPER($${pIdx++})`);
          params.push(itemCode);
        }
        if (fwVersion) {
          if (hasLongFw) {
            clauses.push(`(UPPER(${tableAlias}.fw_version) = UPPER($${pIdx}) OR ${tableAlias}.long_fw ILIKE $${pIdx})`);
          } else {
            clauses.push(`UPPER(${tableAlias}.fw_version) = UPPER($${pIdx})`);
          }
          params.push(fwVersion);
          pIdx++;
        }
        if (soNumber) {
          clauses.push(`UPPER(${tableAlias}.so_number) = UPPER($${pIdx++})`);
          params.push(soNumber);
        }
        return {
          whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
          params,
        };
      };

      let rows: any[] = [];

      // 1. Primary: View v_list_device_testing with long_fw column
      try {
        const { whereSql, params } = buildWhere('v', true);
        rows = await ds.query(`
          SELECT
            v.id,
            v.registration_code,
            v.serial_number,
            v.item_code,
            v.fw_version,
            COALESCE(v.long_fw, v.fw_version) AS "long_fw",
            v.hw_version,
            v.fw_code,
            v.dev_eui,
            v.app_eui,
            v.class_mode AS "class",
            v.region_code AS "region",
            v.status,
            v.so_number,
            v.created_by,
            v.created_at
          FROM system_schema.v_list_device_testing v
          ${whereSql}
          ORDER BY v.created_at DESC
          LIMIT ${limit}
        `, params);
      } catch (errViewLongFw) {
        // 2. View v_list_device_testing without long_fw (fallback to fw_version)
        try {
          const { whereSql, params } = buildWhere('v', false);
          rows = await ds.query(`
            SELECT
              v.id,
              v.registration_code,
              v.serial_number,
              v.item_code,
              v.fw_version,
              v.fw_version AS "long_fw",
              v.hw_version,
              v.fw_code,
              v.dev_eui,
              v.app_eui,
              COALESCE(v.class, v.class_mode, 'A') AS "class",
              COALESCE(v.region, v.region_code, 'AS923-1') AS "region",
              v.status,
              v.so_number,
              v.created_by,
              v.created_at
            FROM system_schema.v_list_device_testing v
            ${whereSql}
            ORDER BY v.created_at DESC
            LIMIT ${limit}
          `, params);
        } catch (errView) {
          // 3. Fallback table device_test_registrations with long_fw
          try {
            const { whereSql, params } = buildWhere('r', true);
            rows = await ds.query(`
              SELECT
                r.id,
                r.registration_code,
                r.serial_number,
                r.item_code,
                r.fw_version,
                COALESCE(r.long_fw, r.fw_version) AS "long_fw",
                r.hw_version,
                r.fw_code,
                r.dev_eui,
                r.app_eui,
                r.class_mode AS "class",
                r.region_code AS "region",
                r.status,
                r.so_number,
                r.created_by,
                r.created_at
              FROM system_schema.device_test_registrations r
              ${whereSql}
              ORDER BY r.created_at DESC
              LIMIT ${limit}
            `, params);
          } catch (errTableLongFw) {
            // 4. Fallback table device_test_registrations without long_fw
            const { whereSql, params } = buildWhere('r', false);
            rows = await ds.query(`
              SELECT
                r.id,
                r.registration_code,
                r.serial_number,
                r.item_code,
                r.fw_version,
                r.fw_version AS "long_fw",
                r.hw_version,
                r.fw_code,
                r.dev_eui,
                r.app_eui,
                r.class_mode AS "class",
                r.region_code AS "region",
                r.status,
                r.so_number,
                r.created_by,
                r.created_at
              FROM system_schema.device_test_registrations r
              ${whereSql}
              ORDER BY r.created_at DESC
              LIMIT ${limit}
            `, params);
          }
        }
      }

      // 5. Fallback for SO devices from devices.devices (Traceability store)
      if (soNumber && rows.length === 0) {
        try {
          const busySerialsSql = `
            SELECT bi.serial_number FROM system_schema.device_test_batch_items bi
            JOIN system_schema.device_test_batches b ON bi.batch_id = b.id
            WHERE b.status = 'RUNNING'
          `;
          const devParams: any[] = [`%${soNumber}%`];
          let devSql = `
            SELECT
              d.id,
              d.serial_number AS "serial_number",
              d.serial_number AS "registration_code",
              d.item_code,
              COALESCE(d.metadata->>'fwVersion', d.metadata->>'fw_version', 'v1.0') AS "fw_version",
              COALESCE(d.metadata->>'longFw', d.metadata->>'fwVersion', 'v1.0') AS "long_fw",
              COALESCE(d.metadata->>'hwVersion', 'v1.0') AS "hw_version",
              COALESCE(d.dev_eui, d.network_id, '—') AS "dev_eui",
              d.status,
              d.so_number,
              d.created_at
            FROM devices.devices d
            WHERE d.so_number ILIKE $1
              AND d.serial_number NOT IN (${busySerialsSql})
          `;
          if (itemCode) {
            devParams.push(itemCode);
            devSql += ` AND UPPER(d.item_code) = UPPER($${devParams.length})`;
          }
          devSql += ` ORDER BY d.created_at DESC LIMIT ${limit}`;
          const devRows = await ds.query(devSql, devParams);
          if (Array.isArray(devRows) && devRows.length > 0) {
            rows = devRows;
          }
        } catch (traceabilityErr: any) {
          this.logger.debug(`Could not query devices.devices for soNumber: ${traceabilityErr.message}`);
        }
      }

      const mapped = rows.map((r: any) => ({
        id: r.id,
        serialNumber: r.serial_number,
        itemCode: r.item_code,
        fwVersion: r.fw_version,
        longFw: r.long_fw || r.fw_version || '',
        long_fw: r.long_fw || r.fw_version || '',
        hwVersion: r.hw_version,
        fwCode: r.fw_code,
        devEui: r.dev_eui,
        appEui: r.app_eui,
        class: r.class || 'A',
        region: r.region || 'AS923-1',
        status: r.status,
        createdBy: r.created_by,
        createdAt: r.created_at,
      }));

      return {
        success: true,
        data: mapped,
        items: mapped,
        total: rows.length,
      };
    } catch (error: any) {
      this.logger.error(`Error in getAvailableDevicesForBatch: ${error.message}`);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/testing/test-batches/reference-devices', 'api/v1/plugins/testing/test-batches/reference-devices'])
  async getReferenceDevices(@Query() query: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      const itemCode = (query.itemCode || query.item_code || '').trim();

      if (!ds) {
        return { success: true, data: [], items: [], total: 0 };
      }

      let rows: any[] = [];
      try {
        let sql = `
          SELECT
            r.id,
            r.serial_number,
            r.dev_eui,
            r.item_code,
            r.fw_version,
            COALESCE(r.long_fw, r.fw_version) AS long_fw,
            r.hw_version,
            r.status,
            r.created_at
          FROM system_schema.v_reference_devices r
        `;
        const params: any[] = [];
        if (itemCode) {
          sql += ` WHERE UPPER(r.item_code) = UPPER($1)`;
          params.push(itemCode);
        }
        sql += ` ORDER BY r.created_at DESC LIMIT 50`;
        rows = await ds.query(sql, params);
      } catch {
        // Fallback directly to device_test_registrations
        try {
          let sql = `
            SELECT
              r.id,
              r.serial_number,
              r.dev_eui,
              r.item_code,
              r.fw_version,
              r.status,
              r.created_at
            FROM system_schema.device_test_registrations r
            WHERE (r.status ILIKE '%ref%' OR r.status ILIKE '%calibrat%' OR r.serial_number ILIKE 'REF-%' OR r.serial_number ILIKE 'STD-%')
          `;
          const params: any[] = [];
          if (itemCode) {
            sql += ` AND UPPER(r.item_code) = UPPER($1)`;
            params.push(itemCode);
          }
          sql += ` ORDER BY r.created_at DESC LIMIT 50`;
          rows = await ds.query(sql, params);
        } catch {}
      }

      const mapped = rows.map((r: any) => ({
        id: r.id,
        serialNumber: r.serial_number,
        devEui: r.dev_eui,
        name: `Thiết Bị Chuẩn ${r.serial_number || r.dev_eui}`,
        itemCode: r.item_code,
        fwVersion: r.fw_version,
        longFw: r.long_fw || r.fw_version,
        calibratedAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '2026-10-15',
        accuracyGrade: 'Class 0.2',
        status: r.status,
      }));

      return {
        success: true,
        data: mapped,
        items: mapped,
        total: mapped.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
        data: [],
        items: [],
        total: 0,
      };
    }
  }

  @Post(['api/plugins/testing/test-batches', 'api/v1/plugins/testing/test-batches'])
  @UseGuards(JwtAuthGuard)
  async createTestBatch(@Body() body: any, @Req() request: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) throw new Error('Database connection unavailable');

      const itemCode = (body.itemCode || body.item_code || '').trim();
      const longFw = (body.longFw || body.long_fw || body.fwVersion || body.fw_version || '').trim();
      const fwVersion = (body.fwVersion || body.fw_version || longFw).trim();

      if (!itemCode) throw new BadRequestException('Vui lòng chọn ITEM-CODE cho Test Batch');
      if (!longFw) throw new BadRequestException('Vui lòng nhập/chọn LONG_FW (FW_VERSION) cho Test Batch');

      const batchCode = `BATCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const batchName = (body.batchName || body.name || `Batch ${itemCode} - ${fwVersion}`).trim();
      let simuId = (body.simuId || body.simu_id || '').trim();
      let simulationFlow = body.simulationFlow || body.simulation_flow || [];
      if (simuId) {
        const flow = await this.getSimulationProfileById(simuId);
        simuId = flow.data.simuId;
        simulationFlow = flow.data.flowBlocks;
      }

      const flowDuration = this.simulationDuration(simulationFlow);


      const autoCheckCriteria = body.autoCheckCriteria || body.auto_check_criteria || {};
      const referenceDevices = Array.isArray(body.referenceDevices) ? body.referenceDevices : (Array.isArray(body.reference_devices) ? body.reference_devices : []);
      const simulatorDevice = body.simulatorDevice || body.simulator_device || null;
      const maxDevices = parseInt(body.maxDevices || body.max_devices, 10) || 10;
      const createdBy = request.user.username;

      let created: any;
      try {
        const result = await ds.query(`
          INSERT INTO system_schema.device_test_batches (
            batch_code, batch_name, item_code, long_fw, fw_version, simu_id,
            simulation_flow, flow_duration_seconds, auto_check_criteria, max_devices,
            reference_devices, simulator_device,
            status, verdict, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'DRAFT', 'PENDING', $13)
          RETURNING *
        `, [
          batchCode,
          batchName,
          itemCode,
          longFw,
          fwVersion,
          simuId || null,
          JSON.stringify(simulationFlow),
          flowDuration,
          JSON.stringify(autoCheckCriteria),
          maxDevices,
          JSON.stringify(referenceDevices),
          simulatorDevice ? JSON.stringify(simulatorDevice) : null,
          createdBy,
        ]);
        created = result[0];
      } catch {
        const result = await ds.query(`
          INSERT INTO system_schema.device_test_batches (
            batch_code, batch_name, item_code, long_fw, fw_version, simu_id,
            simulation_flow, flow_duration_seconds, auto_check_criteria, max_devices,
            status, verdict, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'DRAFT', 'PENDING', $11)
          RETURNING *
        `, [
          batchCode,
          batchName,
          itemCode,
          longFw,
          fwVersion,
          simuId || null,
          JSON.stringify(simulationFlow),
          flowDuration,
          JSON.stringify(autoCheckCriteria),
          maxDevices,
          createdBy,
        ]);
        created = result[0];
      }

      return {
        success: true,
        message: `Đã tạo Test Batch ${batchCode} thành công`,
        data: {
          id: created.id,
          batchCode: created.batch_code,
          batchName: created.batch_name,
          itemCode: created.item_code,
          longFw: created.long_fw,
          fwVersion: created.fw_version,
          simuId: created.simu_id,
          simulationFlow: created.simulation_flow,
          flowDurationSeconds: created.flow_duration_seconds,
          autoCheckCriteria: created.auto_check_criteria,
          referenceDevices: created.reference_devices || referenceDevices,
          simulatorDevice: created.simulator_device || simulatorDevice,
          maxDevices: created.max_devices,
          status: created.status,
          verdict: created.verdict,
          createdBy: created.created_by,
          createdAt: created.created_at,
        },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to create test batch: ${error.message}`);
      throw new HttpException(
        { success: false, message: `Không thể tạo test batch: ${error.message}` },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/testing/test-batches', 'api/v1/plugins/testing/test-batches'])
  @UseGuards(JwtAuthGuard)
  async getTestBatches(@Query() query: any, @Req() request: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) return { success: true, data: [], total: 0 };

      const itemCode = (query.itemCode || query.item_code || '').trim();
      const fwVersion = (query.fwVersion || query.fw_version || '').trim();
      const status = (query.status || '').trim();
      const search = (query.search || '').trim();

      const whereClauses: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      // Filter by creator only if explicitly requested
      const targetUser = (query.user || query.username || query.createdBy || query.created_by || '').trim();
      if (targetUser && targetUser.toLowerCase() !== 'all') {
        whereClauses.push(`LOWER(b.created_by) = LOWER($${pIdx++})`);
        params.push(targetUser);
      }

      if (itemCode) {
        whereClauses.push(`b.item_code = $${pIdx++}`);
        params.push(itemCode);
      }
      if (fwVersion) {
        whereClauses.push(`b.fw_version = $${pIdx++}`);
        params.push(fwVersion);
      }
      if (status) {
        whereClauses.push(`b.status = $${pIdx++}`);
        params.push(status);
      }
      if (search) {
        whereClauses.push(`(b.batch_code ILIKE $${pIdx} OR b.batch_name ILIKE $${pIdx} OR b.item_code ILIKE $${pIdx})`);
        params.push(`%${search}%`);
        pIdx++;
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      let rows: any[] = [];
      try {
        rows = await ds.query(`
          SELECT * FROM system_schema.v_device_test_batches b
          ${whereSql}
          ORDER BY b.created_at DESC
        `, params);
      } catch {
        rows = await ds.query(`
          SELECT * FROM system_schema.device_test_batches b
          ${whereSql}
          ORDER BY b.created_at DESC
        `, params);
      }

      return {
        success: true,
        data: rows.map((r: any) => ({
          id: r.id,
          batchCode: r.batch_code,
          batchName: r.batch_name,
          itemCode: r.item_code,
          longFw: r.long_fw,
          fwVersion: r.fw_version,
          simuId: r.simu_id,
          simulationFlow: r.simulation_flow,
          flowDurationSeconds: r.flow_duration_seconds,
          autoCheckCriteria: r.auto_check_criteria,
          maxDevices: r.max_devices,
          status: r.status,
          verdict: r.verdict,
          durationSeconds: r.duration_seconds,
          startedAt: r.started_at,
          finishedAt: r.finished_at,
          totalDevices: parseInt(r.total_devices || '0', 10),
          passDevices: parseInt(r.pass_devices || '0', 10),
          failDevices: parseInt(r.fail_devices || '0', 10),
          runningDevices: parseInt(r.running_devices || '0', 10),
          createdBy: r.created_by,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        total: rows.length,
      };
    } catch (error: any) {
      this.logger.error(`Error in getTestBatches: ${error.message}`);
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private assertTestBatchOwner(batch: any, request: any) {
    if (!request?.user?.username) throw new UnauthorizedException('Authentication token missing or invalid');
    // Test batch do admin hoặc người có quyền tạo thì tất cả user có quyền Device Test Batch đều được sử dụng
    return true;
  }

  @Get(['api/plugins/testing/test-batches/running', 'api/v1/plugins/testing/test-batches/running'])
  @UseGuards(JwtAuthGuard)
  async getRunningTestBatch(@Req() request: any) {
    const ds = this.databaseService.getDataSourceForTable('devices');
    if (!ds) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    const rows = await ds.query(
      `SELECT b.id, b.batch_code, b.batch_name, b.status, b.started_at, b.flow_duration_seconds,
              COALESCE(sotb.so_number, b.metadata->>'soNumber') AS so_number
       FROM system_schema.device_test_batches b
       LEFT JOIN system_schema.so_test_batches sotb ON b.id = sotb.batch_id
       WHERE b.status = 'RUNNING' ORDER BY b.started_at DESC`,
    );
    return { success: true, data: rows };
  }

  @Post(['api/plugins/testing/test-batches/:id/cancel', 'api/v1/plugins/testing/test-batches/:id/cancel'])
  @UseGuards(JwtAuthGuard)
  async cancelTestBatch(@Param('id') id: string, @Req() request: any) {
    if (!request?.user?.username) throw new UnauthorizedException('Authentication token missing or invalid');
    const ds = this.databaseService.getDataSourceForTable('devices');
    if (!ds) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    await ds.transaction(async (manager: any) => {
      const rows = await manager.query(`SELECT * FROM system_schema.device_test_batches WHERE id = $1 FOR UPDATE`, [id]);
      if (!rows.length) throw new NotFoundException('Không tìm thấy Test Batch');
      this.assertTestBatchOwner(rows[0], request);
      if (rows[0].status !== 'RUNNING') throw new ConflictException('Test Batch không đang chạy');
      await manager.query(`UPDATE system_schema.device_test_batches SET status = 'STOPPED', finished_at = NOW(), updated_at = NOW() WHERE id = $1`, [id]);
      await manager.query(`UPDATE system_schema.device_test_batch_items SET status = 'STOPPED', updated_at = NOW() WHERE batch_id = $1 AND status = 'RUNNING'`, [id]);
    });
    return { success: true, data: { batchId: id, status: 'STOPPED' } };
  }

  @Post(['api/plugins/testing/test-batches/:id/complete', 'api/v1/plugins/testing/test-batches/:id/complete'])
  @UseGuards(JwtAuthGuard)
  async completeTestBatch(@Param('id') id: string, @Req() request: any, @Body() body?: any) {
    if (!request?.user?.username) throw new UnauthorizedException('Authentication token missing or invalid');
    const ds = this.databaseService.getDataSourceForTable('devices');
    if (!ds) throw new HttpException('Database unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    return await ds.transaction(async (manager: any) => {
      const rows = await manager.query(`SELECT * FROM system_schema.device_test_batches WHERE id = $1 FOR UPDATE`, [id]);
      if (!rows.length) throw new NotFoundException('Không tìm thấy Test Batch');
      const batch = rows[0];
      this.assertTestBatchOwner(batch, request);

      const items = await this.queryBatchTransaction(
        manager,
        `SELECT * FROM system_schema.device_test_batch_items WHERE batch_id = $1 ORDER BY serial_number ASC`,
        [id],
      ).catch(() => []);

      let allPass = true;
      const finished = new Date();
      for (const item of items) {
        const comp = item.comparison_result || {};
        const hasRef = Boolean(item.reference_serial_number || item.reference_dev_eui);
        const autoPass = (item.packets_received || 0) > 0 && (hasRef ? comp.tolerance_pass === true : comp.tolerance_pass !== false);

        let isPass = autoPass;
        if (body?.classifications) {
          const directVerdict = body.classifications[item.id] ||
            (item.serial_number && body.classifications[item.serial_number]) ||
            (item.dev_eui && body.classifications[item.dev_eui]);
          if (directVerdict === 'PASS') isPass = true;
          else if (directVerdict === 'FAIL') isPass = false;
        } else if (Array.isArray(body?.passDeviceIds) || Array.isArray(body?.failDeviceIds)) {
          const itemKey = item.id;
          const sn = item.serial_number;
          const eui = item.dev_eui;
          if (body?.passDeviceIds?.some((k: string) => k === itemKey || k === sn || k === eui)) {
            isPass = true;
          } else if (body?.failDeviceIds?.some((k: string) => k === itemKey || k === sn || k === eui)) {
            isPass = false;
          }
        }

        if (!isPass) allPass = false;
        const itemVerdict = isPass ? 'PASS' : 'FAIL';
        item.status = itemVerdict;
        item.verdict = itemVerdict;

        const avgCycle = item.comparison_result?.avg_cycle ?? item.avg_cycle ?? null;
        const avgRssi = item.comparison_result?.avg_rssi ?? item.avg_rssi ?? null;
        const avgSnr = item.comparison_result?.avg_snr ?? item.avg_snr ?? null;

        await this.queryBatchTransaction(manager, `
          UPDATE system_schema.device_test_batch_items
          SET status = $2, verdict = $2,
              avg_cycle = COALESCE($3, avg_cycle),
              avg_rssi = COALESCE($4, avg_rssi),
              avg_snr = COALESCE($5, avg_snr)
          WHERE id = $1
        `, [item.id, itemVerdict, avgCycle, avgRssi, avgSnr]).catch(async () => {
          await this.queryBatchTransaction(manager, `
            UPDATE system_schema.device_test_batch_items
            SET status = $2, verdict = $2
            WHERE id = $1
          `, [item.id, itemVerdict]).catch(() => {});
        });

        try {
          const regRows = await this.queryBatchTransaction(manager,
            `SELECT r.id, r.so_id, r.so_number, r.wa_id, r.wa_number, r.created_by, r.item_code,
                    r.hw_version, r.fw_version, r.fw_code, r.long_fw,
                    r.network_server_id, r.network_server_url, r.is_reference
             FROM system_schema.device_test_registrations r
             WHERE LOWER(r.serial_number) = LOWER($1) OR LOWER(REPLACE(COALESCE(r.dev_eui, ''), ':', '')) = LOWER(REPLACE($2, ':', ''))
             ORDER BY r.created_at DESC LIMIT 1`,
            [item.serial_number || '', item.dev_eui || ''],
          ).catch(() => []);
          const reg = regRows?.[0] || {};
          const testerName = reg.created_by || batch.created_by || 'tester';
          const soId = reg.so_id || null;
          const waId = reg.wa_id || null;
          const hwVersion = reg.hw_version || item.hw_version || null;
          const fwVersion = reg.fw_version || reg.long_fw || item.fw_version || batch.fw_version || null;
          const statusStr = itemVerdict === 'PASS' ? 'TESTED_PASS' : 'TESTED_FAIL';
          const testRawData = JSON.stringify({
            batchCode: batch.batch_code,
            itemVerdict,
            comparisonResult: item.comparison_result,
            dutPackets: item.comparison_result?.dut_packets || [],
            referencePackets: item.comparison_result?.reference_packets || [],
            dutValues: item.dut_values,
            referenceValues: item.reference_values,
            referenceSerialNumber: item.reference_serial_number,
            referenceDevEui: item.reference_dev_eui,
            packetsReceived: item.packets_received,
            avgCycle: item.avg_cycle ?? item.comparison_result?.avg_cycle ?? null,
            avgRssi: item.avg_rssi ?? item.comparison_result?.avg_rssi ?? null,
            avgSnr: item.avg_snr ?? item.comparison_result?.avg_snr ?? null,
            hwVersion,
            fwVersion,
            testedAt: finished,
            testPerson: testerName,
            soNumber: reg.so_number,
            waNumber: reg.wa_number,
          });

          const updateRes = await this.queryBatchTransaction(manager, `
            UPDATE traceability_manager.traceability_device
            SET test_result = $2,
                tested_at = $3,
                test_raw_data = $4::jsonb,
                status = $5,
                test_person = COALESCE($6, test_person),
                so_id = COALESCE($7, so_id),
                wa_id = COALESCE($8, wa_id),
                item_code = COALESCE($9, item_code),
                hw_version = COALESCE($10, hw_version),
                fw_version = COALESCE($11, fw_version)
            WHERE LOWER(serial_number) = LOWER($1) OR LOWER(REPLACE(COALESCE(dev_eui, ''), ':', '')) = LOWER(REPLACE($1, ':', ''))
          `, [
            item.serial_number || item.dev_eui,
            itemVerdict,
            finished,
            testRawData,
            statusStr,
            testerName,
            soId,
            waId,
            reg.item_code || batch.item_code,
            hwVersion,
            fwVersion,
          ]);

          if (!updateRes || updateRes.length === 0 || (updateRes as any)[1] === 0) {
            if (soId) {
              await this.queryBatchTransaction(manager, `
                INSERT INTO traceability_manager.traceability_device
                  (so_id, wa_id, serial_number, dev_eui, item_code, hw_version, fw_version, test_result, test_person, tested_at, test_raw_data, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
                ON CONFLICT (serial_number) DO UPDATE
                SET test_result = EXCLUDED.test_result,
                    test_person = EXCLUDED.test_person,
                    tested_at = EXCLUDED.tested_at,
                    test_raw_data = EXCLUDED.test_raw_data,
                    status = EXCLUDED.status,
                    hw_version = COALESCE(EXCLUDED.hw_version, traceability_device.hw_version),
                    fw_version = COALESCE(EXCLUDED.fw_version, traceability_device.fw_version),
                    wa_id = COALESCE(EXCLUDED.wa_id, traceability_device.wa_id),
                    so_id = COALESCE(EXCLUDED.so_id, traceability_device.so_id)
              `, [
                soId,
                waId,
                item.serial_number || item.dev_eui,
                item.dev_eui,
                reg.item_code || batch.item_code,
                hwVersion,
                fwVersion,
                itemVerdict,
                testerName,
                finished,
                testRawData,
                statusStr,
              ]).catch(() => {});
            }
          }

          if (!reg.is_reference) {
            await this.queryBatchTransaction(manager, `
              DELETE FROM system_schema.device_test_registrations
              WHERE LOWER(serial_number) = LOWER($1) OR LOWER(REPLACE(COALESCE(dev_eui, ''), ':', '')) = LOWER(REPLACE($2, ':', ''))
            `, [item.serial_number || '', item.dev_eui || '']).catch(() => {});

            await this.queryBatchTransaction(manager, `
              DELETE FROM devices.devices
              WHERE LOWER(serial_number) = LOWER($1) OR LOWER(REPLACE(COALESCE(network_id, ''), ':', '')) = LOWER(REPLACE($2, ':', ''))
            `, [item.serial_number || '', item.dev_eui || '']).catch(() => {});

            await this.queryBatchTransaction(manager, `
              DELETE FROM system_schema.devices
              WHERE LOWER(serial_number) = LOWER($1) OR LOWER(REPLACE(COALESCE(network_id, ''), ':', '')) = LOWER(REPLACE($2, ':', ''))
            `, [item.serial_number || '', item.dev_eui || '']).catch(() => {});

            try {
              const serverRepo = this.databaseService.getRepositoryForTable('network_servers', ChirpstackNetworkServerEntity);
              let srv: any = null;
              let serverUrl = reg.network_server_url || '';
              let apiToken = '';
              if (reg.network_server_id) {
                srv = await serverRepo.findOne({ where: { id: reg.network_server_id } }).catch(() => null);
              }
              if (!srv) {
                srv = await serverRepo.findOne({ where: { isActive: true } }).catch(() => null);
              }
              if (srv) {
                serverUrl = srv.apiUrl || srv.api_url || serverUrl;
                apiToken = srv.apiToken || srv.api_token || '';
              }
              if (serverUrl && apiToken) {
                const cleanDevEui = (reg.dev_eui || item.dev_eui || '').replace(/[^0-9a-fA-F]/g, '').toLowerCase();
                const csUrl = `${serverUrl.replace(/\/+$/, '')}/api/devices/${encodeURIComponent(cleanDevEui)}`;
                await fetch(csUrl, {
                  method: 'DELETE',
                  headers: {
                    'Accept': 'application/json',
                    'Grpc-Metadata-Authorization': `Bearer ${apiToken}`,
                    'Authorization': `Bearer ${apiToken}`,
                  },
                  signal: AbortSignal.timeout(5000),
                }).catch(() => null);
              }
            } catch (csErr: any) {
              this.logger.debug(`ChirpStack auto-delete skip for ${reg.dev_eui}: ${csErr.message}`);
            }
          }
        } catch (traceErr: any) {
          this.logger.debug(`Traceability sync skip: ${traceErr.message}`);
        }
      }

      const finalVerdict = allPass ? 'PASS' : 'FAIL';
      const started = batch.started_at ? new Date(batch.started_at).getTime() : Date.now();
      const elapsed = Math.max(0, Math.floor((Date.now() - started) / 1000));
      await manager.query(`
        UPDATE system_schema.device_test_batches
        SET status = 'COMPLETED', verdict = $2, finished_at = $3, duration_seconds = $4, updated_at = $3
        WHERE id = $1
      `, [id, finalVerdict, finished, elapsed]).catch(() => {});

      return {
        success: true,
        data: {
          batchId: id,
          status: 'COMPLETED',
          verdict: finalVerdict,
          finishedAt: finished,
          durationSeconds: elapsed,
        },
      };
    });
  }

  @Get(['api/plugins/testing/test-batches/:id', 'api/v1/plugins/testing/test-batches/:id'])
  @UseGuards(JwtAuthGuard)
  async getTestBatchById(@Param('id') id: string, @Req() request: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) throw new NotFoundException('Database unavailable');

      const batches = await ds.query(
        `SELECT * FROM system_schema.device_test_batches WHERE id = $1`,
        [id],
      );
      if (!batches || batches.length === 0) {
        throw new NotFoundException(`Không tìm thấy Test Batch với ID ${id}`);
      }
      const batch = batches[0];
      this.assertTestBatchOwner(batch, request);

      const items = await ds.query(
        `SELECT * FROM system_schema.device_test_batch_items WHERE batch_id = $1 ORDER BY serial_number ASC`,
        [id],
      ).catch(() => []);

      return {
        success: true,
        data: {
          id: batch.id,
          batchCode: batch.batch_code,
          batchName: batch.batch_name,
          itemCode: batch.item_code,
          longFw: batch.long_fw,
          fwVersion: batch.fw_version,
          simuId: batch.simu_id,
          simulationFlow: batch.simulation_flow,
          flowDurationSeconds: batch.flow_duration_seconds,
          autoCheckCriteria: batch.auto_check_criteria,
          referenceDevices: batch.reference_devices || [],
          simulatorDevice: batch.simulator_device || null,
          maxDevices: batch.max_devices,
          status: batch.status,
          verdict: batch.verdict,
          durationSeconds: batch.duration_seconds,
          startedAt: batch.started_at,
          finishedAt: batch.finished_at,
          createdBy: batch.created_by,
          createdAt: batch.created_at,
          items: items.map((i: any) => ({
            id: i.id,
            batchId: i.batch_id,
            deviceTestRegistrationId: i.device_test_registration_id,
            serialNumber: i.serial_number,
            devEui: i.dev_eui,
            itemCode: i.item_code,
            fwVersion: i.fw_version,
            referenceDeviceId: i.reference_device_id,
            referenceSerialNumber: i.reference_serial_number,
            referenceDevEui: i.reference_dev_eui,
            referenceDeviceName: i.reference_device_name,
            status: i.status,
            verdict: i.verdict,
            dutValues: i.dut_values,
            referenceValues: i.reference_values,
            comparisonResult: i.comparison_result,
            packetsReceived: i.packets_received,
            windowPacketCount: i.window_packet_count ?? null,
            startCounter: i.start_counter ?? null,
            endCounter: i.end_counter ?? null,
            referenceWindowPacketCount: i.reference_window_packet_count ?? null,
            avgMetrics: i.avg_metrics ?? {},
            referenceDevicesData: i.reference_devices_data ?? [],
            calibrationData: i.calibration_data ?? {},
            avgCycle: i.comparison_result?.avg_cycle ?? null,
            avgRssi: i.comparison_result?.avg_rssi ?? null,
            avgSnr: i.comparison_result?.avg_snr ?? null,
            rulesPassed: i.rules_passed,
            rulesFailed: i.rules_failed,
          })),
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException({ success: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // PostgreSQL needs a savepoint rollback before a caught query error can fall back.
  private async queryBatchTransaction(manager: any, sql: string, params?: any[]) {
    await manager.query('SAVEPOINT batch_query');
    try {
      const result = await manager.query(sql, params);
      await manager.query('RELEASE SAVEPOINT batch_query');
      return result;
    } catch (error) {
      await manager.query('ROLLBACK TO SAVEPOINT batch_query');
      await manager.query('RELEASE SAVEPOINT batch_query');
      this.logger.warn(`Batch SQL failed: ${error.message}`);
      throw error;
    }
  }

  private async executeSimulationFlow(id: string, blocks: any[], devices: any[], startedAt?: string) {
    if (!blocks.length) return;
    const ds = this.databaseService.getDataSourceForTable('devices');
    const repo = this.databaseService.getRepositoryForTable('network_servers', ChirpstackNetworkServerEntity);
    const server = blocks.some(b => b.functionType !== 'delay')
      ? await repo.findOne({ where: { isActive: true } }) : null;
    for (const block of blocks) {
      const rows = await ds.query('SELECT status, started_at FROM system_schema.device_test_batches WHERE id = $1', [id]);
      if (rows[0]?.status !== 'RUNNING' || (startedAt && new Date(rows[0].started_at).toISOString() !== startedAt)) return;
      if (block.functionType === 'delay') {
        await new Promise(resolve => setTimeout(resolve, block.delaySeconds * 1000));
        continue;
      }
      if (!server?.apiUrl || !server.apiToken) throw new Error('Chưa cấu hình ChirpStack đang hoạt động');
      const targets = new Set<string>(devices.map(d => block.targetDevice === 'REF'
        ? d.referenceDevEui || d.reference_dev_eui || '' : d.devEui || d.dev_eui || ''));
      for (const devEui of targets) {
        if (!/^[0-9a-fA-F]{16}$/.test(devEui)) throw new Error(`DevEUI ${block.targetDevice} không hợp lệ`);
        const response = await fetch(`${server.apiUrl.replace(/\/$/, '')}/api/devices/${encodeURIComponent(devEui)}/queue`, {
          method: block.functionType === 'clear_downlink' ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${server.apiToken}` },
          signal: AbortSignal.timeout(10000),
          ...(block.functionType === 'downlink' ? { body: JSON.stringify({ queueItem: {
            devEui, fPort: block.fPort ?? 1, confirmed: !!block.isConfirmed,
            data: Buffer.from(block.payloadHex, 'hex').toString('base64'),
          } }) } : {}),
        });
        if (!response.ok) throw new Error(`ChirpStack ${block.functionType}: HTTP ${response.status}`);
      }
    }
  }

  @Post(['api/plugins/testing/test-batches/:id/start', 'api/v1/plugins/testing/test-batches/:id/start'])
  @UseGuards(JwtAuthGuard)
  async startTestBatch(@Param('id') id: string, @Body() body: any, @Req() request: any) {
    if (!id || id === 'undefined' || id === 'null' || !id.trim()) {
      throw new BadRequestException('Vui lòng chọn Test Batch trước khi bắt đầu kiểm thử');
    }
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) throw new Error('Database unavailable');

      let flowBlocks: any[] = [];
      const result = await ds.transaction(async (ds: any) => {
      const batches = await this.queryBatchTransaction(ds,
        `SELECT * FROM system_schema.device_test_batches WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (!batches || batches.length === 0) {
        throw new NotFoundException(`Không tìm thấy Test Batch với ID ${id}`);
      }
      const batch = batches[0];
      this.assertTestBatchOwner(batch, request);
      if (batch.status === 'RUNNING') throw new ConflictException('Test Batch đang chạy');
      const storedFlow = typeof batch.simulation_flow === 'string' ? JSON.parse(batch.simulation_flow) : batch.simulation_flow;
      flowBlocks = Array.isArray(storedFlow) ? storedFlow : storedFlow?.flowBlocks || [];
      this.simulationDuration(flowBlocks);

      const devices = Array.isArray(body.devices) ? body.devices : [];
      if (devices.length === 0) {
        throw new BadRequestException('Vui lòng thêm ít nhất 1 thiết bị test vào batch');
      }
      if (devices.length > (batch.max_devices || 10)) {
        throw new BadRequestException(`Số lượng thiết bị (${devices.length}) vượt quá giới hạn cho phép (${batch.max_devices})`);
      }

      // Guard: Thiết bị đang trong test batch khác có status RUNNING thì không thể thêm vào test batch khác
      const devSerials = devices.map((d: any) => d.serialNumber || d.serial_number).filter(Boolean);
      if (devSerials.length > 0) {
        const busyRows = await this.queryBatchTransaction(
          ds,
          `SELECT bi.serial_number, b.batch_code
           FROM system_schema.device_test_batch_items bi
           JOIN system_schema.device_test_batches b ON bi.batch_id = b.id
           WHERE b.status = 'RUNNING' AND b.id != $1 AND bi.serial_number = ANY($2)`,
          [id, devSerials],
        ).catch(() => []);

        if (busyRows && busyRows.length > 0) {
          const detail = busyRows.map((r: any) => `${r.serial_number} (đang chạy ở batch ${r.batch_code})`).join(', ');
          throw new BadRequestException(
            `Thiết bị đang chạy test batch khác: ${detail}. Không thể thêm vào test batch khác trừ khi đã hoàn thành hoặc chưa bắt đầu.`,
          );
        }
      }

      if (flowBlocks.some(b => b.targetDevice === 'REF') && devices.some(d => !/^[0-9a-fA-F]{16}$/.test(d.referenceDevEui || d.reference_dev_eui || ''))) {
        throw new BadRequestException('Flow có REF: mỗi DUT phải chọn thiết bị tham chiếu với DevEUI hợp lệ');
      }
      await this.queryBatchTransaction(ds, `DELETE FROM system_schema.device_test_batch_items WHERE batch_id = $1`, [id]);

      for (const d of devices) {
        const dutSerial = d.serialNumber || d.serial_number || 'DUT-UNKNOWN';
        const dutDevEui = d.devEui || d.dev_eui || '';
        const refSerial = d.referenceSerialNumber || d.reference_serial_number || '';
        const refDevEui = d.referenceDevEui || d.reference_dev_eui || '';
        const refName = d.referenceDeviceName || d.reference_device_name || '';
        const refId = d.referenceDeviceId || d.reference_device_id || null;

        const comparison = {
          status: 'AWAITING_UPLINK',
          packets_since_start: 0,
          dut_has_data: false,
          ref_has_data: false,
        };

        await this.queryBatchTransaction(ds, `
          INSERT INTO system_schema.device_test_batch_items (
            batch_id, device_test_registration_id, serial_number, dev_eui,
            item_code, fw_version, reference_device_id, reference_serial_number,
            reference_dev_eui, reference_device_name, status, verdict,
            dut_values, reference_values, comparison_result, packets_received,
            rules_passed, rules_failed
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            'RUNNING', 'PENDING', '{}'::jsonb, '{}'::jsonb, $11::jsonb, 0, 0, 0
          )
        `, [
          id,
          d.deviceId || d.id || null,
          dutSerial,
          dutDevEui,
          batch.item_code,
          batch.fw_version,
          refId,
          refSerial,
          refDevEui,
          refName,
          JSON.stringify(comparison),
        ]);
      }

      const now = new Date();
      await this.queryBatchTransaction(ds, `
        UPDATE system_schema.device_test_batches
        SET status = 'RUNNING', verdict = 'PENDING', started_at = $2, finished_at = NULL, duration_seconds = 0, updated_at = $2
        WHERE id = $1
      `, [id, now]);

      return {
        success: true,
        message: `Đã bắt đầu chạy Test Batch ${batch.batch_code} cho ${devices.length} thiết bị`,
        data: {
          batchId: id,
          batchCode: batch.batch_code,
          status: 'RUNNING',
          flowDurationSeconds: batch.flow_duration_seconds,
          startedAt: now.toISOString(),
          totalDevices: devices.length,
        },
      };
      });
      void this.executeSimulationFlow(id, flowBlocks, body.devices, result.data.startedAt).catch(async error => {
        this.logger.error(`Flow Simulation failed: ${error.message}`);
        await ds.query(`UPDATE system_schema.device_test_batches SET status = 'STOPPED', verdict = 'FAIL', finished_at = NOW(), updated_at = NOW() WHERE id = $1 AND status = 'RUNNING' AND started_at = $2`, [id, result.data.startedAt]);
      }).catch(error => this.logger.error(`Could not record flow failure: ${error.message}`));
      return result;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error starting test batch: ${error.message}`);
      throw new HttpException({ success: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(['api/plugins/testing/test-batches/:id/status', 'api/v1/plugins/testing/test-batches/:id/status'])
  @UseGuards(JwtAuthGuard)
  async getTestBatchStatus(@Param('id') id: string, @Req() request: any) {
    try {
      const source = this.databaseService.getDataSourceForTable('devices');
      if (!source) throw new NotFoundException('Database unavailable');

      return await source.transaction(async (ds: any) => {
      const batches = await this.queryBatchTransaction(ds,
        `SELECT * FROM system_schema.device_test_batches WHERE id = $1 FOR UPDATE`,
        [id],
      );
      if (!batches || batches.length === 0) {
        throw new NotFoundException(`Không tìm thấy Test Batch với ID ${id}`);
      }
      const batch = batches[0];
      this.assertTestBatchOwner(batch, request);

      const items = await this.queryBatchTransaction(ds,
        `SELECT * FROM system_schema.device_test_batch_items WHERE batch_id = $1 ORDER BY serial_number ASC`,
        [id],
      ).catch(() => []);

      const flowDuration = batch.flow_duration_seconds || 60;
      let elapsedSeconds = 0;
      let remainingSeconds = flowDuration;
      let progressPercent = 0;

      if (batch.status === 'RUNNING' && batch.started_at) {
        const started = new Date(batch.started_at).getTime();
        const now = Date.now();
        elapsedSeconds = Math.max(0, Math.floor((now - started) / 1000));
        remainingSeconds = Math.max(0, flowDuration - elapsedSeconds);
        progressPercent = Math.min(100, Math.round((elapsedSeconds / flowDuration) * 100));

        // Evaluate live telemetry with started_at baseline
        for (const item of items) {
          let dutEui = item.dev_eui;
          let refEui = item.reference_dev_eui;

          if (!dutEui && item.serial_number) {
            const reg = await this.queryBatchTransaction(ds,
              `SELECT dev_eui FROM system_schema.device_test_registrations WHERE serial_number = $1 OR registration_code = $1 LIMIT 1`,
              [item.serial_number],
            ).catch(() => []);
            if (reg[0]?.dev_eui) dutEui = reg[0].dev_eui;
          }

          let dutPackets: any[] = [];
          let refPackets: any[] = [];

          if (dutEui) {
            const cleanDutEui = dutEui.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
            dutPackets = await this.queryBatchTransaction(ds,
              `SELECT raw_payload, decoded_payload, f_port, f_cnt, rssi, snr, created_at
               FROM devices.device_packets
               WHERE LOWER(REPLACE(dev_eui, ':', '')) = $1 AND created_at >= $2::timestamptz
               ORDER BY created_at DESC`,
              [cleanDutEui, batch.started_at],
            ).catch(async () => {
              return await this.queryBatchTransaction(ds,
                `SELECT raw_payload, decoded_payload, f_port, f_cnt, rssi, snr, created_at
                 FROM system_schema.device_packets
                 WHERE LOWER(REPLACE(dev_eui, ':', '')) = $1 AND created_at >= $2::timestamptz
                 ORDER BY created_at DESC`,
                [cleanDutEui, batch.started_at],
              ).catch(() => []);
            });
          }

          if (refEui) {
            const cleanRefEui = refEui.replace(/[^a-fA-F0-9]/g, '').toLowerCase();
            refPackets = await this.queryBatchTransaction(ds,
              `SELECT raw_payload, decoded_payload, f_port, f_cnt, rssi, snr, created_at
               FROM devices.device_packets
               WHERE LOWER(REPLACE(dev_eui, ':', '')) = $1 AND created_at >= $2::timestamptz
               ORDER BY created_at DESC`,
              [cleanRefEui, batch.started_at],
            ).catch(async () => {
              return await this.queryBatchTransaction(ds,
                `SELECT raw_payload, decoded_payload, f_port, f_cnt, rssi, snr, created_at
                 FROM system_schema.device_packets
                 WHERE LOWER(REPLACE(dev_eui, ':', '')) = $1 AND created_at >= $2::timestamptz
                 ORDER BY created_at DESC`,
                [cleanRefEui, batch.started_at],
              ).catch(() => []);
            });
          }

          const latestDut = dutPackets[0];
          const latestRef = refPackets[0];
          const packetsCount = dutPackets.length;

          let dutValues: any = {};
          let refValues: any = {};
          let comparison: any = {};

          if (latestDut?.decoded_payload && Object.keys(latestDut.decoded_payload).length > 0) {
            dutValues = latestDut.decoded_payload;
          }
          if (latestRef?.decoded_payload && Object.keys(latestRef.decoded_payload).length > 0) {
            refValues = latestRef.decoded_payload;
          }

          const extractSensorVal = (obj: any, keys: string[]): number | null => {
            if (!obj || typeof obj !== 'object') return null;
            for (const k of keys) {
              if (obj[k] !== undefined && obj[k] !== null) return Number(obj[k]);
            }
            const entries = Object.entries(obj);
            for (const k of keys) {
              const matched = entries.find(([ek]) => ek.toLowerCase() === k.toLowerCase());
              if (matched && matched[1] !== null && matched[1] !== undefined) {
                return Number(matched[1]);
              }
            }
            return null;
          };

          const hasRef = Boolean(item.reference_serial_number || item.reference_dev_eui);
          const dutT = extractSensorVal(dutValues, ['temperature', 'temp', 'TEMPERATURE', 'TEMP', 't']);
          const refT = hasRef ? extractSensorVal(refValues, ['temperature', 'temp', 'TEMPERATURE', 'TEMP', 't']) : null;
          const dutH = extractSensorVal(dutValues, ['humidity', 'hum', 'HUMIDITY', 'HUM', 'h']);
          const refH = hasRef ? extractSensorVal(refValues, ['humidity', 'hum', 'HUMIDITY', 'HUM', 'h']) : null;

          let tolerancePass: boolean | null = null;
          let tempDelta: number | null = null;
          let humDelta: number | null = null;

          if (hasRef) {
            if (dutT != null && refT != null) {
              tempDelta = +(Math.abs(Number(dutT) - Number(refT))).toFixed(2);
            }
            if (dutH != null && refH != null) {
              humDelta = +(Math.abs(Number(dutH) - Number(refH))).toFixed(2);
            }
            if (dutT != null && refT != null) {
              tolerancePass = (tempDelta != null ? tempDelta <= 1.0 : true) && (humDelta != null ? humDelta <= 5.0 : true);
            } else {
              tolerancePass = null;
            }
          } else {
            tolerancePass = true;
          }

          // Keep every packet in the batch window, not only the latest sensor values.
          const windowEnd = Math.min(now, started + flowDuration * 1000);
          const packetTimeline = (packets: any[]) => packets
            .filter(p => {
              const timestamp = new Date(p.created_at).getTime();
              return timestamp >= started && timestamp <= windowEnd;
            })
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map(p => ({
              timestamp: p.created_at,
              data: p.decoded_payload ?? {},
              raw_payload: p.raw_payload,
              f_port: p.f_port,
              f_cnt: p.f_cnt,
              rssi: p.rssi,
              snr: p.snr,
            }));

          const dutTimeline = packetTimeline(dutPackets);
          let avgCycle: number | null = null;
          if (dutTimeline.length >= 2) {
            const firstTime = new Date(dutTimeline[0].timestamp).getTime();
            const lastTime = new Date(dutTimeline[dutTimeline.length - 1].timestamp).getTime();
            const totalMinutes = (lastTime - firstTime) / 60000;
            const intervals = dutTimeline.length - 1;
            avgCycle = +(totalMinutes / intervals).toFixed(1);
          }

          let avgRssi: number | null = null;
          const rssiList = dutTimeline
            .map(p => p.rssi)
            .filter(r => r !== null && r !== undefined && !isNaN(Number(r)))
            .map(r => Number(r));
          if (rssiList.length > 0) {
            avgRssi = +(rssiList.reduce((acc, v) => acc + v, 0) / rssiList.length).toFixed(1);
          }

          let avgSnr: number | null = null;
          const snrList = dutTimeline
            .map(p => p.snr)
            .filter(s => s !== null && s !== undefined && !isNaN(Number(s)))
            .map(s => Number(s));
          if (snrList.length > 0) {
            avgSnr = +(snrList.reduce((acc, v) => acc + v, 0) / snrList.length).toFixed(1);
          }

          comparison = {
            dut_packets: dutTimeline,
            reference_packets: packetTimeline(refPackets),
            status: packetsCount > 0 ? 'ACTIVE_RECEIVING' : 'AWAITING_UPLINK',
            packets_since_start: packetsCount,
            packets_received: packetsCount,
            avg_cycle: avgCycle,
            avg_rssi: avgRssi,
            avg_snr: avgSnr,
            dut_temp: dutT,
            ref_temp: refT,
            temp_delta: tempDelta,
            temp_pass: tempDelta != null ? tempDelta <= 1.0 : (hasRef ? null : true),
            dut_hum: dutH,
            ref_hum: refH,
            hum_delta: humDelta,
            hum_pass: humDelta != null ? humDelta <= 5.0 : (hasRef ? null : true),
            tolerance_pass: tolerancePass,
            rssi: latestDut?.rssi ?? null,
            snr: latestDut?.snr ?? null,
            last_packet_at: latestDut?.created_at ?? null,
          };

          let startCounter: number | null = null;
          let endCounter: number | null = null;
          let windowPacketCount = 0;
          if (dutTimeline.length > 0) {
            const firstP = dutTimeline[dutTimeline.length - 1];
            const lastP = dutTimeline[0];
            startCounter = firstP.f_cnt != null ? Number(firstP.f_cnt) : null;
            endCounter = lastP.f_cnt != null ? Number(lastP.f_cnt) : null;
            if (startCounter != null && endCounter != null) {
              windowPacketCount = endCounter >= startCounter ? (endCounter - startCounter) : dutTimeline.length;
            } else {
              windowPacketCount = dutTimeline.length;
            }
          }

          const avgMetrics = {
            avg_rssi: avgRssi,
            avg_snr: avgSnr,
            dut_temp: dutT,
            ref_temp: refT,
            dut_hum: dutH,
            ref_hum: refH,
          };

          item.dut_values = dutValues;
          item.reference_values = refValues;
          item.comparison_result = comparison;
          item.packets_received = packetsCount;
          item.window_packet_count = windowPacketCount;
          item.start_counter = startCounter;
          item.end_counter = endCounter;
          item.avg_metrics = avgMetrics;

          try {
            await this.queryBatchTransaction(ds,
              `UPDATE system_schema.device_test_batch_items
               SET dut_values = $2, reference_values = $3, comparison_result = $4, packets_received = $5,
                   avg_cycle = $6, avg_rssi = $7, avg_snr = $8,
                   window_packet_count = $9, start_counter = $10, end_counter = $11, avg_metrics = $12
               WHERE id = $1`,
              [
                item.id,
                JSON.stringify(dutValues),
                JSON.stringify(refValues),
                JSON.stringify(comparison),
                packetsCount,
                avgCycle,
                avgRssi,
                avgSnr,
                windowPacketCount,
                startCounter,
                endCounter,
                JSON.stringify(avgMetrics),
              ]
            );
          } catch {
            try {
              await this.queryBatchTransaction(ds,
                `UPDATE system_schema.device_test_batch_items
                 SET dut_values = $2, reference_values = $3, comparison_result = $4, packets_received = $5,
                     avg_cycle = $6, avg_rssi = $7, avg_snr = $8
                 WHERE id = $1`,
                [item.id, JSON.stringify(dutValues), JSON.stringify(refValues), JSON.stringify(comparison), packetsCount, avgCycle, avgRssi, avgSnr]
              );
            } catch {
              await this.queryBatchTransaction(ds,
                `UPDATE system_schema.device_test_batch_items
                 SET dut_values = $2, reference_values = $3, comparison_result = $4, packets_received = $5
                 WHERE id = $1`,
                [item.id, JSON.stringify(dutValues), JSON.stringify(refValues), JSON.stringify(comparison), packetsCount]
              );
            }
          }
        }

        if (remainingSeconds === 0) {
          let allPass = true;
          const finished = new Date();
          for (const item of items) {
            const comp = item.comparison_result || {};
            const hasRef = Boolean(item.reference_serial_number || item.reference_dev_eui);
            const isPass = (item.packets_received || 0) > 0 && (hasRef ? comp.tolerance_pass === true : comp.tolerance_pass !== false);
            if (!isPass) allPass = false;
            const itemVerdict = isPass ? 'PASS' : 'FAIL';
            item.status = itemVerdict;
            item.verdict = itemVerdict;

            await this.queryBatchTransaction(ds, `
              UPDATE system_schema.device_test_batch_items
              SET status = $2, verdict = $2
              WHERE id = $1
            `, [item.id, itemVerdict]).catch(() => {});

            // Sync to traceability_manager.traceability_device with SO, WA, and tester name
            try {
              // 1. Lookup SO, WA, and creator from device_test_registrations
              const regRows = await this.queryBatchTransaction(ds,
                `SELECT r.id, r.so_id, r.so_number, r.wa_id, r.wa_number, r.created_by, r.item_code,
                        r.hw_version, r.fw_version, r.fw_code, r.long_fw,
                        r.network_server_id, r.network_server_url, r.is_reference
                 FROM system_schema.device_test_registrations r
                 WHERE LOWER(r.serial_number) = LOWER($1) OR LOWER(REPLACE(COALESCE(r.dev_eui, ''), ':', '')) = LOWER(REPLACE($2, ':', ''))
                 ORDER BY r.created_at DESC LIMIT 1`,
                [item.serial_number || '', item.dev_eui || ''],
              ).catch(() => []);
              const reg = regRows[0] || {};

              let soId = reg.so_id || null;
              let waId = reg.wa_id || null;
              const testerName = batch.created_by || reg.created_by || 'tester';
              const hwVersion = reg.hw_version || item.hw_version || null;
              const fwVersion = reg.fw_version || reg.long_fw || item.fw_version || batch.fw_version || null;

              if (!soId && reg.so_number) {
                const soRows = await this.queryBatchTransaction(ds,
                  `SELECT id FROM traceability_manager.traceability_so WHERE so_number = $1 LIMIT 1`,
                  [reg.so_number],
                ).catch(() => []);
                soId = soRows[0]?.id || null;
              }
              if (!waId && reg.wa_number) {
                const waRows = await this.queryBatchTransaction(ds,
                  `SELECT id FROM traceability_manager.traceability_wa WHERE wa_number = $1 LIMIT 1`,
                  [reg.wa_number],
                ).catch(() => []);
                waId = waRows[0]?.id || null;
              }
              if (!soId) {
                const fallbackSo = await this.queryBatchTransaction(ds,
                  `SELECT id FROM traceability_manager.traceability_so ORDER BY created_at DESC LIMIT 1`,
                ).catch(() => []);
                soId = fallbackSo[0]?.id || null;
              }
              if (!soId) {
                // Ensure default SO exists so foreign key constraint is never violated
                const defaultSo = await this.queryBatchTransaction(ds, `
                  INSERT INTO traceability_manager.traceability_so (so_number, customer_name, notes)
                  VALUES ('SO/TEST/AUTO', 'Hệ Thống Kiểm Thử Tự Động', 'Tự động tạo từ Test Batch Runner')
                  ON CONFLICT (so_number) DO UPDATE SET updated_at = NOW()
                  RETURNING id
                `).catch(() => []);
                soId = defaultSo?.[0]?.id || null;
              }

              const testRawData = JSON.stringify({
                batch_id: batch.id,
                batch_code: batch.batch_code,
                item_id: item.id,
                serial_number: item.serial_number,
                dev_eui: item.dev_eui,
                verdict: itemVerdict,
                autocheck_result: {
                  verdict: itemVerdict,
                  is_pass: isPass,
                  tolerance_pass: comp.tolerance_pass,
                  packets_received: item.packets_received || 0,
                  avg_cycle: comp.avg_cycle,
                  avg_rssi: comp.avg_rssi,
                  avg_snr: comp.avg_snr,
                  rules_passed: item.rules_passed || 0,
                  rules_failed: item.rules_failed || 0,
                },
                avg_cycle: comp.avg_cycle ?? item.avg_cycle ?? null,
                avg_rssi: comp.avg_rssi ?? item.avg_rssi ?? null,
                avg_snr: comp.avg_snr ?? item.avg_snr ?? null,
                hw_version: hwVersion,
                fw_version: fwVersion,
                comparison_result: item.comparison_result,
                auto_check_criteria: batch.auto_check_criteria,
                simulation_flow: batch.simulation_flow,
                dut_values: item.dut_values,
                reference_values: item.reference_values,
                reference_serial_number: item.reference_serial_number,
                reference_dev_eui: item.reference_dev_eui,
                started_at: batch.started_at,
                finished_at: finished.toISOString(),
                so_number: reg.so_number || null,
                wa_number: reg.wa_number || null,
                test_person: testerName,
              });
              const statusStr = itemVerdict === 'PASS' ? 'TESTED_PASS' : 'TESTED_FAIL';
              const targetIdentifier = item.serial_number || item.dev_eui;

              const updateRes = await this.queryBatchTransaction(ds, `
                UPDATE traceability_manager.traceability_device
                SET test_result = $2,
                    tested_at = $3,
                    test_raw_data = $4::jsonb,
                    status = $5,
                    test_person = COALESCE($6, test_person),
                    so_id = COALESCE($7, so_id),
                    wa_id = COALESCE($8, wa_id),
                    item_code = COALESCE($9, item_code),
                    hw_version = COALESCE($10, hw_version),
                    fw_version = COALESCE($11, fw_version)
                WHERE LOWER(serial_number) = LOWER($1) OR LOWER(REPLACE(COALESCE(dev_eui, ''), ':', '')) = LOWER(REPLACE($1, ':', ''))
              `, [
                targetIdentifier,
                itemVerdict,
                finished,
                testRawData,
                statusStr,
                testerName,
                soId,
                waId,
                reg.item_code || batch.item_code,
                hwVersion,
                fwVersion,
              ]);

              // If record doesn't exist yet in traceability_device, auto create with resolved SO, WA, and test_person
              if (!updateRes || updateRes.length === 0 || (updateRes as any)[1] === 0) {
                if (soId) {
                  await this.queryBatchTransaction(ds, `
                    INSERT INTO traceability_manager.traceability_device
                      (so_id, wa_id, serial_number, dev_eui, item_code, hw_version, fw_version, test_result, test_person, tested_at, test_raw_data, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
                    ON CONFLICT (serial_number) DO UPDATE
                    SET test_result = EXCLUDED.test_result,
                        test_person = EXCLUDED.test_person,
                        tested_at = EXCLUDED.tested_at,
                        test_raw_data = EXCLUDED.test_raw_data,
                        status = EXCLUDED.status,
                        hw_version = COALESCE(EXCLUDED.hw_version, traceability_device.hw_version),
                        fw_version = COALESCE(EXCLUDED.fw_version, traceability_device.fw_version),
                        wa_id = COALESCE(EXCLUDED.wa_id, traceability_device.wa_id),
                        so_id = COALESCE(EXCLUDED.so_id, traceability_device.so_id)
                  `, [
                    soId,
                    waId,
                    item.serial_number || item.dev_eui,
                    item.dev_eui,
                    reg.item_code || batch.item_code,
                    hwVersion,
                    fwVersion,
                    itemVerdict,
                    testerName,
                    finished,
                    testRawData,
                    statusStr,
                  ]).catch((insErr: any) => {
                    this.logger.debug(`Traceability insert note: ${insErr.message}`);
                  });
                }
              }

              // Auto-delete the device after test batch finishes so it cannot be re-tested without re-adding
              await this.queryBatchTransaction(ds, `
                DELETE FROM system_schema.device_test_registrations
                WHERE (serial_number = $1 OR dev_eui = $2)
                  AND COALESCE(is_reference, false) = false
              `, [item.serial_number, item.dev_eui]);

              // Also delete from devices table
              try {
                const deviceRepo = this.databaseService.getRepositoryForTable('devices', TestingDeviceEntity);
                if (item.serial_number) {
                  await deviceRepo.delete({ serial_number: item.serial_number }).catch(() => null);
                }
                if (item.dev_eui) {
                  await deviceRepo.delete({ network_id: item.dev_eui.toUpperCase() }).catch(() => null);
                }
              } catch (e: any) {
                this.logger.warn(`Could not delete from devices.devices: ${e.message}`);
              }

              // Best-effort delete from ChirpStack
              if (reg.dev_eui && (reg.network_server_url || reg.network_server_id)) {
                try {
                  let serverUrl = reg.network_server_url;
                  let apiToken = '';
                  const serverRepo = this.databaseService.getRepositoryForTable('lorawan_chirpstack', ChirpstackNetworkServerEntity);
                  let srv = null;
                  if (reg.network_server_id) {
                    srv = await serverRepo.findOne({ where: { id: reg.network_server_id } }).catch(() => null);
                  }
                  if (!srv) {
                    srv = await serverRepo.findOne({ where: { isActive: true } }).catch(() => null);
                  }
                  if (srv) {
                    serverUrl = srv.apiUrl || srv.api_url || serverUrl;
                    apiToken = srv.apiToken || srv.api_token || '';
                  }
                  if (serverUrl && apiToken) {
                    const cleanDevEui = (reg.dev_eui || '').replace(/[^0-9a-fA-F]/g, '').toLowerCase();
                    const csUrl = `${serverUrl.replace(/\/+$/, '')}/api/devices/${encodeURIComponent(cleanDevEui)}`;
                    await fetch(csUrl, {
                      method: 'DELETE',
                      headers: {
                        'Accept': 'application/json',
                        'Grpc-Metadata-Authorization': `Bearer ${apiToken}`,
                        'Authorization': `Bearer ${apiToken}`,
                      },
                      signal: AbortSignal.timeout(5000),
                    }).catch(() => null);
                  }
                } catch (csErr: any) {
                  this.logger.debug(`ChirpStack auto-delete skip for ${reg.dev_eui}: ${csErr.message}`);
                }
              }

              this.logger.log(`[Batch ${batch.batch_code}] Device ${item.serial_number} completed (${itemVerdict}), pushed to traceability and deleted from active test devices.`);
            } catch (traceErr: any) {
              this.logger.debug(`Traceability sync skip: ${traceErr.message}`);
            }
          }

          const finalVerdict = allPass ? 'PASS' : 'FAIL';
          await this.queryBatchTransaction(ds, `
            UPDATE system_schema.device_test_batches
            SET status = 'COMPLETED', verdict = $2, finished_at = $3, duration_seconds = $4, updated_at = $3
            WHERE id = $1
          `, [id, finalVerdict, finished, elapsedSeconds]).catch(() => {});

          batch.status = 'COMPLETED';
          batch.verdict = finalVerdict;
          batch.finished_at = finished;
          progressPercent = 100;
        }
      } else if (batch.status === 'COMPLETED') {
        progressPercent = 100;
        remainingSeconds = 0;
        elapsedSeconds = batch.duration_seconds || flowDuration;
      }

      let resolvedSoNumber: string | null = null;
      try {
        const soRow = await this.queryBatchTransaction(
          ds,
          `SELECT so_number FROM system_schema.so_test_batches WHERE batch_id = $1 LIMIT 1`,
          [id],
        );
        resolvedSoNumber = soRow?.[0]?.so_number || batch.metadata?.soNumber || null;
      } catch {
        resolvedSoNumber = batch.metadata?.soNumber || null;
      }

      return {
        success: true,
        data: {
          batchId: batch.id,
          batchCode: batch.batch_code,
          batchName: batch.batch_name,
          soNumber: resolvedSoNumber,
          status: batch.status,
          verdict: batch.verdict,
          flowDurationSeconds: flowDuration,
          elapsedSeconds,
          remainingSeconds,
          progressPercent,
          startedAt: batch.started_at,
          finishedAt: batch.finished_at,
          devices: items.map((i: any) => ({
            id: i.id,
            serialNumber: i.serial_number,
            devEui: i.dev_eui,
            itemCode: i.item_code,
            fwVersion: i.fw_version,
            referenceSerialNumber: i.reference_serial_number,
            referenceDeviceName: i.reference_device_name,
            status: i.status,
            verdict: i.verdict,
            dutValues: i.dut_values,
            referenceValues: i.reference_values,
            comparisonResult: i.comparison_result,
            packetsReceived: i.packets_received,
            avgCycle: i.comparison_result?.avg_cycle ?? null,
            avgRssi: i.comparison_result?.avg_rssi ?? null,
            avgSnr: i.comparison_result?.avg_snr ?? null,
            rulesPassed: i.rules_passed,
            rulesFailed: i.rules_failed,
          })),
        },
      };
      });
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException({ success: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(['api/plugins/testing/test-batches/:id', 'api/v1/plugins/testing/test-batches/:id'])
  @UseGuards(JwtAuthGuard)
  async deleteTestBatch(@Param('id') id: string, @Req() request: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) throw new NotFoundException('Database unavailable');

      await ds.transaction(async (manager: any) => {
        const rows = await manager.query(`SELECT * FROM system_schema.device_test_batches WHERE id = $1 FOR UPDATE`, [id]);
        if (!rows.length) throw new NotFoundException('Không tìm thấy Test Batch');
        this.assertTestBatchOwner(rows[0], request);
        if (rows[0].status === 'RUNNING') throw new ConflictException('Hủy Test Batch trước khi xóa');
        await manager.query(`DELETE FROM system_schema.device_test_batch_items WHERE batch_id = $1`, [id]);
        await manager.query(`DELETE FROM system_schema.device_test_batches WHERE id = $1`, [id]);
      });

      return {
        success: true,
        message: `Đã xóa Test Batch thành công`,
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      throw new HttpException({ success: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
