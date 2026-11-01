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
} from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { RealtimeService } from '../realtime/modules/realtime/realtime.service';
import { TestingDeviceEntity } from '../core-models/testing-device.entity';
import { DevicePacketEntity } from '../core-models/device-packet.entity';
import { GatewayTestSessionEntity } from '../core-models/gateway-test-session.entity';
import { TraceabilitySoEntity } from '../core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../core-models/traceability-wa.entity';

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
  target: {
    packetId?: string;
    deviceId?: string;
    networkId?: string;
    serialNumber?: string;
    packet?: any;
  };
  criteria?: {
    minRssi?: number;
    maxRssi?: number;
    minSnr?: number;
    expectedFPort?: number;
    requiredFields?: string[];
    fieldRules?: Record<string, { min?: number; max?: number; equals?: any }>;
  };
}

@Controller()
export class TestingAdapterController {
  private readonly logger = new Logger(TestingAdapterController.name);
  private simulationProfiles: Map<string, any> = new Map();
  private simulationResults: any[] = [];
  private autoCheckEvaluations: any[] = [];

  constructor(
    private readonly databaseService: DynamicDatabaseService,
    @Optional() private readonly realtimeService?: RealtimeService,
  ) {}

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

      return {
        data: items.map((d) => ({
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
          status: d.status,
          metadata: d.metadata || {},
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })),
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
  ])
  async getSimulationDevices(@Query('label') label?: string) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const devices = await deviceRepo
        .createQueryBuilder('device')
        .where('device.status IN (:...statuses) OR device.plugin_id = :pluginId', {
          statuses: ['simulation', 'template'],
          pluginId: 'testing',
        })
        .orderBy('device.updated_at', 'DESC')
        .getMany();

      return {
        success: true,
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
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to get simulation devices: ${error.message}`);
      return {
        success: true,
        data: Array.from(this.simulationProfiles.values()).map((p) => ({
          id: p.id,
          serialNumber: p.serialNumber,
          networkId: p.networkId,
          deviceName: p.deviceName,
          deviceType: p.deviceType,
          status: p.status,
          itemCode: p.itemCode,
          soNumber: p.soNumber,
          waNumber: p.waNumber,
        })),
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

  @Get(['api/plugins/testing/packets', 'api/v1/plugins/testing/packets'])
  async getPackets(
    @Query('deviceId') deviceId?: string,
    @Query('networkId') networkId?: string,
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
    const sensorConnectivity = (body?.sensorConnectivity || body?.sensor_connectivity || 'LoRaWAN').trim();
    const sku = (body?.sku || '').trim();
    const flowBlocks = Array.isArray(body?.flowBlocks) ? body.flowBlocks : (Array.isArray(body?.flow_blocks) ? body.flow_blocks : []);
    const status = (body?.status || 'simulation').trim();
    const flowDurationMinutes = body?.flowDurationMinutes || 30;
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
      sensorConnectivity,
      sku,
      flowBlocks,
      profileName: body?.profileName || deviceName,
      targetDeviceName: deviceName,
      devEui: networkId,
      flowDurationMinutes,
      timedActions,
      updatedAt: new Date().toISOString(),
    };
    this.simulationProfiles.set(id, profile);

    // Sync template device to devices database table
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      let dev = await deviceRepo.findOne({ where: { serial_number: serialNumber } });
      if (!dev) {
        dev = deviceRepo.create({
          serial_number: serialNumber,
          network_id: networkId || null,
          device_name: deviceName,
          device_type: deviceType,
          plugin_id: pluginId,
          so_number: soNumber || null,
          wa_number: waNumber || null,
          item_code: itemCode || null,
          status: 'template',
          metadata: {
            simu_id: simuId,
            long_fw: longFw,
            flow_duration_minutes: flowDurationMinutes,
            timed_actions: timedActions,
            is_template: true,
          },
        });
      } else {
        dev.device_name = deviceName;
        dev.device_type = deviceType;
        if (networkId) dev.network_id = networkId;
        if (itemCode) dev.item_code = itemCode;
        if (soNumber) dev.so_number = soNumber;
        if (waNumber) dev.wa_number = waNumber;
        dev.status = 'template';
        dev.metadata = {
          ...(dev.metadata || {}),
          simu_id: simuId,
          long_fw: longFw,
          flow_duration_minutes: flowDurationMinutes,
          timed_actions: timedActions,
          is_template: true,
        };
      }
      await deviceRepo.save(dev);
    } catch (e: any) {
      this.logger.warn(`Could not sync template device to DB table: ${e.message}`);
    }

    return {
      success: true,
      message: 'Simulation profile and template device saved',
      data: profile,
    };
  }

  @Get(['api/plugins/testing/simulation/profiles', 'api/v1/plugins/testing/simulation/profiles'])
  async getSimulationProfiles() {
    if (this.simulationProfiles.size === 0) {
      this.seedDefaultSimulationProfiles();
    }
    return {
      success: true,
      data: Array.from(this.simulationProfiles.values()),
    };
  }

  private seedDefaultSimulationProfiles() {
    const defaults = [
      {
        id: 'SIMU-LORA-SP01',
        simuId: 'SIMU-LORA-SP01',
        serialNumber: 'SN-TMPL-SP01',
        networkId: '70B3D57ED005ABCD',
        deviceName: 'Smart Socket Multi-Sensor Node',
        deviceType: 'lorawan_node',
        pluginId: 'testing',
        soNumber: 'SO-2025-9901',
        waNumber: 'WA-2025-9901',
        itemCode: 'ITEM-9901-SMART-PLUG',
        status: 'template',
        profileName: 'Ổ Cắm Thông Minh & Còi Báo Động (Chuẩn 30 Phút)',
        longFw: 'v1.2.0-rc3-long-fw-build9482',
        targetDeviceName: 'Smart Socket Multi-Sensor Node',
        activation: 'OTAA',
        devEui: '70B3D57ED005ABCD',
        appEui: '0000000000000000',
        appKey: '2B7E151628AED2A6ABF7158809CF4F3C',
        region: 'AS923-1',
        sf: 'SF7',
        bw: 125,
        fPort: 2,
        presetId: 'env',
        flowDurationMinutes: 30,
        autoTerminate: true,
        uplinkIntervalSec: 10,
        timedActions: [
          {
            id: 'act-sp-1',
            triggerMinute: 1,
            actionType: 'downlink_buzzer',
            label: 'Downlink bật thiết bị còi giả lập lúc 1 phút',
            payloadHex: '0101',
            fPort: 10,
            executed: false,
          },
          {
            id: 'act-sp-2',
            triggerMinute: 5,
            actionType: 'downlink_command',
            label: 'Downlink cấu hình chu kỳ đo 15s',
            payloadHex: '02000F',
            fPort: 10,
            executed: false,
          },
          {
            id: 'act-sp-3',
            triggerMinute: 15,
            actionType: 'downlink_buzzer',
            label: 'Downlink tắt thiết bị còi giả lập',
            payloadHex: '0100',
            fPort: 10,
            executed: false,
          },
          {
            id: 'act-sp-4',
            triggerMinute: 30,
            actionType: 'change_rate',
            label: 'Tự động kết thúc Flow sau 30 phút',
            payloadHex: 'FF',
            fPort: 10,
            executed: false,
          },
        ],
      },
      {
        id: 'SIMU-LORA-WM02',
        simuId: 'SIMU-LORA-WM02',
        serialNumber: 'SN-TMPL-WM02',
        networkId: '70B3D57ED0052211',
        deviceName: 'Water Meter Ultrasonic DN15',
        deviceType: 'lorawan_node',
        pluginId: 'testing',
        soNumber: 'SO-2025-5520',
        waNumber: 'WA-2025-5520',
        itemCode: 'ITEM-5520-WATER-METER',
        status: 'template',
        profileName: 'Đồng Hồ Nước Siêu Âm LoRaWAN DN15',
        longFw: 'v2.4.1-long-fw-build1029',
        targetDeviceName: 'Water Meter Ultrasonic DN15',
        activation: 'OTAA',
        devEui: '70B3D57ED0052211',
        appEui: '0000000000000000',
        appKey: '0102030405060708090A0B0C0D0E0F10',
        region: 'VN923',
        sf: 'SF8',
        bw: 125,
        fPort: 1,
        presetId: 'water',
        flowDurationMinutes: 30,
        autoTerminate: true,
        uplinkIntervalSec: 10,
        timedActions: [
          {
            id: 'act-wm-1',
            triggerMinute: 1,
            actionType: 'downlink_buzzer',
            label: 'Downlink đóng van ngắt nước & bật còi cảnh báo',
            payloadHex: 'AA000101',
            fPort: 1,
            executed: false,
          },
          {
            id: 'act-wm-2',
            triggerMinute: 10,
            actionType: 'downlink_command',
            label: 'Downlink mở lại van cấp nước',
            payloadHex: 'AA01',
            fPort: 1,
            executed: false,
          },
          {
            id: 'act-wm-3',
            triggerMinute: 30,
            actionType: 'change_rate',
            label: 'Tự động kết thúc sau 30 phút',
            payloadHex: 'FF',
            fPort: 1,
            executed: false,
          },
        ],
      },
      {
        id: 'SIMU-LORA-ENV03',
        simuId: 'SIMU-LORA-ENV03',
        serialNumber: 'SN-TMPL-ENV03',
        networkId: '70B3D57ED0059988',
        deviceName: 'Gas & Smoke Industrial Node',
        deviceType: 'lorawan_node',
        pluginId: 'testing',
        soNumber: 'SO-2025-8812',
        waNumber: 'WA-2025-8812',
        itemCode: 'ITEM-8812-ENV-SENSOR',
        status: 'template',
        profileName: 'Cảm Biến Khí & Cảnh Báo Khói Cháy',
        longFw: 'v1.0.5-long-fw-build3311',
        targetDeviceName: 'Gas & Smoke Industrial Node',
        activation: 'OTAA',
        devEui: '70B3D57ED0059988',
        appEui: '0000000000000000',
        appKey: 'A1B2C3D4E5F60102030405060708090A',
        region: 'AS923-1',
        sf: 'SF7',
        bw: 125,
        fPort: 3,
        presetId: 'env',
        flowDurationMinutes: 30,
        autoTerminate: true,
        uplinkIntervalSec: 10,
        timedActions: [
          {
            id: 'act-env-1',
            triggerMinute: 1,
            actionType: 'downlink_buzzer',
            label: 'Downlink bật còi báo khói giả lập',
            payloadHex: '0101',
            fPort: 10,
            executed: false,
          },
          {
            id: 'act-env-2',
            triggerMinute: 12,
            actionType: 'downlink_buzzer',
            label: 'Downlink tắt còi báo khói',
            payloadHex: '0100',
            fPort: 10,
            executed: false,
          },
          {
            id: 'act-env-3',
            triggerMinute: 30,
            actionType: 'change_rate',
            label: 'Tự động kết thúc sau 30 phút',
            payloadHex: 'FF',
            fPort: 10,
            executed: false,
          },
        ],
      },
    ];
    for (const item of defaults) {
      this.simulationProfiles.set(item.simuId, item);
    }
  }

  @Get(['api/plugins/testing/simulation/results', 'api/v1/plugins/testing/simulation/results'])
  async getSimulationResults() {
    return {
      success: true,
      data: this.simulationResults,
    };
  }

  // ============================================================================
  // 8. DEVICE AUTO CHECK FLOW
  // ============================================================================

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
    const criteria = body?.criteria || {};

    const minRssi = criteria.minRssi ?? -120;
    const maxRssi = criteria.maxRssi ?? -30;
    const minSnr = criteria.minSnr ?? -15;
    const expectedFPort = criteria.expectedFPort;
    const requiredFields = criteria.requiredFields || ['dev_eui', 'payload'];
    const fieldRules = criteria.fieldRules || {};

    try {
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );

      let packet: any = target.packet;

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

      if (!packet) {
        throw new NotFoundException(
          'No packet found for auto-check evaluation. Please run a simulation or ingest a packet first.',
        );
      }

      const ruleResults: any[] = [];
      const rf = packet.rf_info || packet.rfInfo || {};
      const rssi = rf.rssi;
      const snr = rf.snr;
      const fPort = packet.f_port ?? packet.fPort;
      const fCnt = packet.f_cnt ?? packet.fCnt;
      const rawPayload = packet.raw_payload || packet.rawPayload || '';
      const decoded = packet.decoded_payload || packet.decodedPayload || {};

      // 1. RSSI Check
      const rssiPassed = rssi !== undefined && rssi >= minRssi && rssi <= maxRssi;
      ruleResults.push({
        rule: 'RSSI_RANGE_CHECK',
        passed: rssiPassed,
        actual: rssi,
        expected: `Between ${minRssi} and ${maxRssi} dBm`,
        message: rssiPassed
          ? `RSSI ${rssi} dBm is acceptable`
          : `RSSI ${rssi} dBm is outside allowable range [${minRssi}, ${maxRssi}]`,
      });

      // 2. SNR Check
      const snrPassed = snr !== undefined && snr >= minSnr;
      ruleResults.push({
        rule: 'SNR_MIN_CHECK',
        passed: snrPassed,
        actual: snr,
        expected: `>= ${minSnr} dB`,
        message: snrPassed
          ? `SNR ${snr} dB meets link budget threshold`
          : `SNR ${snr} dB is below threshold ${minSnr} dB`,
      });

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
      for (const field of requiredFields) {
        let actualVal: any;
        if (field === 'dev_eui' || field === 'network_id') {
          actualVal = packet.device?.network_id || target.networkId;
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

      // 5. Specific Field Rules
      for (const [field, rule] of Object.entries(fieldRules)) {
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

      const passedCount = ruleResults.filter((r) => r.passed).length;
      const failedCount = ruleResults.length - passedCount;
      const verdict = failedCount === 0 ? 'PASS' : 'FAIL';

      const evaluation = {
        evaluationId: `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        packetId: packet.id,
        deviceId: packet.device_id || packet.device?.id,
        serialNumber: packet.device?.serial_number || target.serialNumber,
        networkId: packet.device?.network_id || target.networkId,
        verdict,
        totalRules: ruleResults.length,
        passedRules: passedCount,
        failedRules: failedCount,
        ruleResults,
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
}
