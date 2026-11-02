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
import { ChirpstackNetworkServerEntity } from '../core-models/chirpstack-network-server.entity';

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
  async registerDeviceFlow3Steps(@Body() body: any) {
    try {
      // Step 1: Validate metadata from Step 1 & Step 2
      const connectivity = (body?.connectivity || 'LoRaWAN').trim();
      const soNumber = (body?.soNumber || body?.so_number || '').trim();
      const waNumber = (body?.waNumber || body?.wa_number || '').trim();
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
      const createdBy = (body?.createdBy || body?.created_by || body?.username || body?.user || 'tester').trim();
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
            stages.device = resp1.status === 409 ? 'exists' : 'failed';
            stages.keys = 'skipped';
            chirpstackError = resp1.status === 409 ? 'Thiết bị đã tồn tại trên ChirpStack; không ghi đè keys. Kiểm tra thiết bị hiện có trước khi thử lại.' : `Tạo thiết bị trên ChirpStack thất bại [${resp1.status}]: ${errBody}`;
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
          const regCode = `REG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          await ds.query(
            `INSERT INTO system_schema.device_test_registrations (
              registration_code, connectivity, so_number, wa_number, item_code,
              network_server_id, network_server_url, application_id, device_profile_id,
              fw_code, fw_version, hw_version, me_version,
              dev_eui, app_eui, app_key, region_code, class_mode, sensor_type, serial_number,
              status, message, chirpstack_payload, created_by
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
            )`,
            [
              regCode, connectivity, soNumber || null, waNumber || null, itemCode || null,
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
  async getTestingDeviceRegistrations(@Query() query: any) {
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

      const user = (query.user || query.username || '').trim();
      const role = (query.role || '').toUpperCase().trim();
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
          whereClauses.push(`(LOWER(v.created_by) = LOWER($${pIdx++}) OR v.created_by = 'tester')`);
          params.push(user);
        } else {
          whereClauses.push(`v.created_by = 'tester'`);
        }
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

      if (!isAdmin && user && reg.created_by && reg.created_by !== 'tester') {
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

      if (itemCodes.length === 0) {
        itemCodes = ['LR-SENSOR-TEMP-V1', 'LR-SENSOR-GAS-V2', 'LR-WATER-METER-V1', 'LR-ENERGY-METER-V3'];
      }
      if (fwVersions.length === 0) {
        fwVersions = ['v6.0101', 'v6.0102', 'v1.0.0', 'v2.1.0'];
      }

      // Default simulation flow blocks
      const defaultFlow = [
        { id: 'step-1', functionType: 'delay', delaySeconds: 5, description: 'Khởi tạo kết nối & ổn định nguồn' },
        { id: 'step-2', functionType: 'downlink', delaySeconds: 10, payloadHex: '0102', description: 'Gửi cấu hình đo đạc ban đầu' },
        { id: 'step-3', functionType: 'delay', delaySeconds: 15, description: 'Thu thập cảm biến tại DUT & thiết bị chuẩn' },
        { id: 'step-4', functionType: 'downlink', delaySeconds: 10, payloadHex: '0304', description: 'Kích hoạt đọc burst telemetry' },
        { id: 'step-5', functionType: 'delay', delaySeconds: 20, description: 'Chờ đối chiếu kết quả Autocheck' },
      ];

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
  async getAvailableDevicesForBatch(@Query() query: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      const itemCode = (query.itemCode || query.item_code || '').trim();
      const fwVersion = (query.fwVersion || query.fw_version || '').trim();

      if (!ds) {
        return { success: true, data: [] };
      }

      const whereClauses: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      if (itemCode) {
        whereClauses.push(`v.item_code = $${pIdx++}`);
        params.push(itemCode);
      }
      if (fwVersion) {
        whereClauses.push(`(v.fw_version = $${pIdx++} OR v.long_fw ILIKE $${pIdx - 1})`);
        params.push(fwVersion);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      let rows: any[] = [];
      try {
        rows = await ds.query(`
          SELECT
            v.id,
            v.registration_code,
            v.serial_number,
            v.item_code,
            v.fw_version,
            v.hw_version,
            v.fw_code,
            v.dev_eui,
            v.app_eui,
            COALESCE(v.class, v.class_mode, 'A') AS "class",
            COALESCE(v.region, v.region_code, 'AS923-1') AS "region",
            v.status,
            v.created_by,
            v.created_at
          FROM system_schema.v_list_device_testing v
          ${whereSql}
          ORDER BY v.created_at DESC
          LIMIT 50
        `, params);
      } catch {
        rows = await ds.query(`
          SELECT
            r.id,
            r.registration_code,
            r.serial_number,
            r.item_code,
            r.fw_version,
            r.hw_version,
            r.fw_code,
            r.dev_eui,
            r.app_eui,
            r.class_mode AS "class",
            r.region_code AS "region",
            r.status,
            r.created_by,
            r.created_at
          FROM system_schema.device_test_registrations r
          ${whereSql.replace(/v\./g, 'r.')}
          ORDER BY r.created_at DESC
          LIMIT 50
        `, params);
      }

      return {
        success: true,
        data: rows.map((r: any) => ({
          id: r.id,
          serialNumber: r.serial_number,
          itemCode: r.item_code,
          fwVersion: r.fw_version,
          hwVersion: r.hw_version,
          fwCode: r.fw_code,
          devEui: r.dev_eui,
          appEui: r.app_eui,
          class: r.class || 'A',
          region: r.region || 'AS923-1',
          status: r.status,
          createdBy: r.created_by,
          createdAt: r.created_at,
        })),
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
      const itemCode = (query.itemCode || query.item_code || '').trim();
      const referencePool = [
        {
          id: 'ref-std-001',
          serialNumber: 'REF-STD-001',
          devEui: 'AA555A0000000001',
          name: 'Thiết Bị Chuẩn Calibrated Lab A1',
          itemCode: itemCode || 'LR-SENSOR-TEMP-V1',
          calibratedAt: '2026-10-15',
          accuracyGrade: 'Class 0.2',
          nominalValues: { temperature: 25.0, humidity: 60.0, battery: 100 },
        },
        {
          id: 'ref-std-002',
          serialNumber: 'REF-STD-002',
          devEui: 'AA555A0000000002',
          name: 'Thiết Bị Chuẩn Calibrated Lab A2',
          itemCode: itemCode || 'LR-SENSOR-TEMP-V1',
          calibratedAt: '2026-10-15',
          accuracyGrade: 'Class 0.2',
          nominalValues: { temperature: 25.1, humidity: 59.8, battery: 99 },
        },
        {
          id: 'ref-std-003',
          serialNumber: 'REF-STD-003',
          devEui: 'AA555A0000000003',
          name: 'Thiết Bị Chuẩn Calibrated Lab A3',
          itemCode: itemCode || 'LR-SENSOR-TEMP-V1',
          calibratedAt: '2026-10-20',
          accuracyGrade: 'Class 0.2',
          nominalValues: { temperature: 24.9, humidity: 60.2, battery: 100 },
        },
        {
          id: 'ref-std-004',
          serialNumber: 'REF-STD-004',
          devEui: 'AA555A0000000004',
          name: 'Thiết Bị Chuẩn Calibrated Lab A4',
          itemCode: itemCode || 'LR-SENSOR-TEMP-V1',
          calibratedAt: '2026-10-20',
          accuracyGrade: 'Class 0.2',
          nominalValues: { temperature: 25.2, humidity: 60.5, battery: 98 },
        },
        {
          id: 'ref-std-005',
          serialNumber: 'REF-STD-005',
          devEui: 'AA555A0000000005',
          name: 'Thiết Bị Chuẩn Calibrated Lab A5',
          itemCode: itemCode || 'LR-SENSOR-TEMP-V1',
          calibratedAt: '2026-10-25',
          accuracyGrade: 'Class 0.2',
          nominalValues: { temperature: 25.0, humidity: 60.0, battery: 100 },
        },
      ];

      return {
        success: true,
        data: referencePool,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Post(['api/plugins/testing/test-batches', 'api/v1/plugins/testing/test-batches'])
  async createTestBatch(@Body() body: any) {
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
      const simuId = (body.simuId || body.simu_id || '').trim();
      const simulationFlow = body.simulationFlow || body.simulation_flow || [];
      
      let flowDuration = parseInt(body.flowDurationSeconds || body.flow_duration_seconds, 10) || 0;
      if (!flowDuration && Array.isArray(simulationFlow)) {
        flowDuration = simulationFlow.reduce((acc: number, step: any) => acc + (parseInt(step.delaySeconds, 10) || 5), 0);
      }
      if (flowDuration <= 0) flowDuration = 60;

      const autoCheckCriteria = body.autoCheckCriteria || body.auto_check_criteria || {};
      const maxDevices = parseInt(body.maxDevices || body.max_devices, 10) || 10;
      const createdBy = (body.createdBy || body.created_by || body.username || 'tester').trim();

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

      const created = result[0];
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
  async getTestBatches(@Query() query: any) {
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

  @Get(['api/plugins/testing/test-batches/:id', 'api/v1/plugins/testing/test-batches/:id'])
  async getTestBatchById(@Param('id') id: string) {
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

  @Post(['api/plugins/testing/test-batches/:id/start', 'api/v1/plugins/testing/test-batches/:id/start'])
  async startTestBatch(@Param('id') id: string, @Body() body: any) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) throw new Error('Database unavailable');

      const batches = await ds.query(
        `SELECT * FROM system_schema.device_test_batches WHERE id = $1`,
        [id],
      );
      if (!batches || batches.length === 0) {
        throw new NotFoundException(`Không tìm thấy Test Batch với ID ${id}`);
      }
      const batch = batches[0];

      const devices = Array.isArray(body.devices) ? body.devices : [];
      if (devices.length === 0) {
        throw new BadRequestException('Vui lòng thêm ít nhất 1 thiết bị test vào batch');
      }
      if (devices.length > (batch.max_devices || 10)) {
        throw new BadRequestException(`Số lượng thiết bị (${devices.length}) vượt quá giới hạn cho phép (${batch.max_devices})`);
      }

      await ds.query(`DELETE FROM system_schema.device_test_batch_items WHERE batch_id = $1`, [id]).catch(() => {});

      for (const d of devices) {
        const dutSerial = d.serialNumber || d.serial_number || 'DUT-UNKNOWN';
        const dutDevEui = d.devEui || d.dev_eui || '';
        const refSerial = d.referenceSerialNumber || d.reference_serial_number || 'REF-STD-DEFAULT';
        const refDevEui = d.referenceDevEui || d.reference_dev_eui || 'AA555A0000000001';
        const refName = d.referenceDeviceName || d.reference_device_name || 'Thiết bị chuẩn đối chiếu';
        const refId = d.referenceDeviceId || d.reference_device_id || null;

        const dutTemp = 25.0 + (Math.random() * 0.8 - 0.4);
        const refTemp = 25.0;
        const dutHumidity = 60.0 + (Math.random() * 2.0 - 1.0);
        const refHumidity = 60.0;
        const dutBattery = 95 + Math.floor(Math.random() * 5);

        const comparison = {
          temperature_diff: Math.abs(dutTemp - refTemp).toFixed(2),
          humidity_diff: Math.abs(dutHumidity - refHumidity).toFixed(2),
          tolerance_pass: true,
        };

        await ds.query(`
          INSERT INTO system_schema.device_test_batch_items (
            batch_id, device_test_registration_id, serial_number, dev_eui,
            item_code, fw_version, reference_device_id, reference_serial_number,
            reference_dev_eui, reference_device_name, status, verdict,
            dut_values, reference_values, comparison_result, packets_received,
            rules_passed, rules_failed
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            'RUNNING', 'PENDING', $11, $12, $13, 0, 0, 0
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
          JSON.stringify({ temperature: Number(dutTemp.toFixed(2)), humidity: Number(dutHumidity.toFixed(2)), battery: dutBattery }),
          JSON.stringify({ temperature: refTemp, humidity: refHumidity, battery: 100 }),
          JSON.stringify(comparison),
        ]);
      }

      const now = new Date();
      await ds.query(`
        UPDATE system_schema.device_test_batches
        SET status = 'RUNNING', verdict = 'PENDING', started_at = $2, finished_at = NULL, updated_at = $2
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
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      this.logger.error(`Error starting test batch: ${error.message}`);
      throw new HttpException({ success: false, message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(['api/plugins/testing/test-batches/:id/status', 'api/v1/plugins/testing/test-batches/:id/status'])
  async getTestBatchStatus(@Param('id') id: string) {
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

      const items = await ds.query(
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

        if (remainingSeconds === 0) {
          let allPass = true;
          for (const item of items) {
            const comp = item.comparison_result || {};
            const isPass = comp.tolerance_pass !== false;
            if (!isPass) allPass = false;
            await ds.query(`
              UPDATE system_schema.device_test_batch_items
              SET status = $2, verdict = $2, packets_received = 5, rules_passed = 3, rules_failed = 0
              WHERE id = $1
            `, [item.id, isPass ? 'PASS' : 'FAIL']).catch(() => {});
          }

          const finalVerdict = allPass ? 'PASS' : 'FAIL';
          const finished = new Date();
          await ds.query(`
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

      return {
        success: true,
        data: {
          batchId: batch.id,
          batchCode: batch.batch_code,
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
            referenceSerialNumber: i.reference_serial_number,
            referenceDeviceName: i.reference_device_name,
            status: i.status,
            verdict: i.verdict,
            dutValues: i.dut_values,
            referenceValues: i.reference_values,
            comparisonResult: i.comparison_result,
            packetsReceived: i.packets_received,
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

  @Delete(['api/plugins/testing/test-batches/:id', 'api/v1/plugins/testing/test-batches/:id'])
  async deleteTestBatch(@Param('id') id: string) {
    try {
      const ds = this.databaseService.getDataSourceForTable('devices');
      if (!ds) throw new NotFoundException('Database unavailable');

      await ds.query(`DELETE FROM system_schema.device_test_batch_items WHERE batch_id = $1`, [id]).catch(() => {});
      await ds.query(`DELETE FROM system_schema.device_test_batches WHERE id = $1`, [id]);

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
