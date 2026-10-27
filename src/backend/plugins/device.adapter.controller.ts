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
import { TraceabilitySoEntity } from '../core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../core-models/traceability-wa.entity';

export interface RegisterDeviceDto {
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

export interface IngestDevicePacketDto {
  deviceId?: string;
  networkId?: string;
  packetType?: string;
  fPort?: number;
  fCnt?: number | string;
  rawPayload?: string;
  decodedPayload?: Record<string, any>;
  rfInfo?: Record<string, any>;
}

@Controller()
export class DeviceAdapterController {
  private readonly logger = new Logger(DeviceAdapterController.name);

  constructor(
    private readonly databaseService: DynamicDatabaseService,
    @Optional() private readonly realtimeService?: RealtimeService,
  ) {}

  // ============================================================================
  // 1. LOOKUP ENDPOINTS (Traceability Integration for Devices)
  // ============================================================================

  @Get([
    'api/plugins/device/lookup/so',
    'api/v1/plugins/device/lookup/so',
    'api/plugins/devices/lookup/so',
    'api/v1/plugins/devices/lookup/so',
  ])
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
      this.logger.error(`Failed to lookup SOs: ${error.message}`);
      throw new HttpException(
        `Failed to lookup sales orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get([
    'api/plugins/device/lookup/wa',
    'api/v1/plugins/device/lookup/wa',
    'api/plugins/devices/lookup/wa',
    'api/v1/plugins/devices/lookup/wa',
  ])
  async lookupWorkAuthorizations(
    @Query('soId') soId?: string,
    @Query('soNumber') soNumber?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const qb = waRepo
        .createQueryBuilder('wa')
        .leftJoinAndSelect('wa.so', 'so');

      if (soId) {
        qb.andWhere('wa.so_id = :soId', { soId });
      }

      if (soNumber) {
        qb.andWhere('so.so_number ILIKE :soNumber', { soNumber: `%${soNumber.trim()}%` });
      }

      const term = (search || '').trim();
      if (term) {
        qb.andWhere('(wa.wa_number ILIKE :term OR wa.item_code ILIKE :term)', {
          term: `%${term}%`,
        });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('wa.created_at', 'DESC');

      const [items, total] = await qb.getManyAndCount();

      return {
        data: items.map((item) => ({
          id: item.id,
          soId: item.so_id,
          soNumber: item.so?.so_number || null,
          waNumber: item.wa_number,
          itemCode: item.item_code,
          plannedQuantity: item.planned_quantity,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error: any) {
      this.logger.error(`Failed to lookup WAs: ${error.message}`);
      throw new HttpException(
        `Failed to lookup work authorizations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get([
    'api/plugins/device/lookup/items',
    'api/v1/plugins/device/lookup/items',
    'api/plugins/devices/lookup/items',
    'api/v1/plugins/devices/lookup/items',
  ])
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
      const qb = waRepo.createQueryBuilder('wa');

      if (soId) {
        qb.andWhere('wa.so_id = :soId', { soId });
      }
      if (waId) {
        qb.andWhere('wa.id = :waId', { waId });
      }
      if (search && search.trim()) {
        qb.andWhere('wa.item_code ILIKE :search', { search: `%${search.trim()}%` });
      }

      qb.select('DISTINCT wa.item_code', 'item_code');
      const rows = await qb.getRawMany();

      return {
        data: rows.map((r) => r.item_code).filter(Boolean),
      };
    } catch (error: any) {
      this.logger.error(`Failed to lookup items: ${error.message}`);
      throw new HttpException(
        `Failed to lookup items: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ============================================================================
  // 2. DEVICE MANAGEMENT & REGISTRATION
  // ============================================================================

  @Get([
    'api/plugins/device/devices',
    'api/v1/plugins/device/devices',
    'api/plugins/devices',
    'api/v1/plugins/devices',
  ])
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
        data: items.map((dev) => ({
          id: dev.id,
          serialNumber: dev.serial_number,
          networkId: dev.network_id,
          deviceName: dev.device_name,
          deviceType: dev.device_type,
          pluginId: dev.plugin_id,
          soId: dev.so_id,
          soNumber: dev.so_number,
          waId: dev.wa_id,
          waNumber: dev.wa_number,
          itemCode: dev.item_code,
          status: dev.status,
          metadata: dev.metadata || {},
          createdAt: dev.created_at,
          updatedAt: dev.updated_at,
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
    'api/plugins/device/devices/:id',
    'api/v1/plugins/device/devices/:id',
    'api/plugins/devices/:id',
    'api/v1/plugins/devices/:id',
  ])
  async getDeviceById(@Param('id') id: string) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );

      const device = await deviceRepo.findOne({ where: { id } });
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

  @Post([
    'api/plugins/device/devices',
    'api/v1/plugins/device/devices',
    'api/plugins/devices',
    'api/v1/plugins/devices',
  ])
  async registerDevice(@Body() body: RegisterDeviceDto) {
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

      // Check duplicate serial
      const existing = await deviceRepo.findOne({
        where: { serial_number: body.serialNumber.trim() },
      });
      if (existing) {
        throw new BadRequestException(
          `Device with serial_number "${body.serialNumber}" already exists`,
        );
      }

      let resolvedSoId = body.soId;
      let resolvedSoNumber = body.soNumber;
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
        plugin_id: body.pluginId?.trim() || 'device',
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
        this.realtimeService?.publishPluginLifecycle('device:registered', {
          device: saved,
        });
      } catch (_) {
        // Non-blocking
      }

      return {
        message: 'Device registered successfully',
        data: saved,
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

  @Put([
    'api/plugins/device/devices/:id',
    'api/v1/plugins/device/devices/:id',
    'api/plugins/devices/:id',
    'api/v1/plugins/devices/:id',
  ])
  async updateDevice(@Param('id') id: string, @Body() body: Partial<RegisterDeviceDto>) {
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
      if (body.networkId !== undefined) device.network_id = body.networkId.trim() || null;
      if (body.pluginId !== undefined) device.plugin_id = body.pluginId.trim();
      if (body.status !== undefined) device.status = body.status.trim();
      if (body.soId !== undefined) device.so_id = body.soId;
      if (body.soNumber !== undefined) device.so_number = body.soNumber;
      if (body.waId !== undefined) device.wa_id = body.waId;
      if (body.waNumber !== undefined) device.wa_number = body.waNumber;
      if (body.itemCode !== undefined) device.item_code = body.itemCode;
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

  @Delete([
    'api/plugins/device/devices/:id',
    'api/v1/plugins/device/devices/:id',
    'api/plugins/devices/:id',
    'api/v1/plugins/devices/:id',
  ])
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
    'api/plugins/device/packets',
    'api/v1/plugins/device/packets',
    'api/plugins/devices/packets',
    'api/v1/plugins/devices/packets',
  ])
  async getDevicePackets(
    @Query('deviceId') deviceId?: string,
    @Query('networkId') networkId?: string,
    @Query('packetType') packetType?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );
      const qb = packetRepo.createQueryBuilder('p');

      if (deviceId) {
        qb.andWhere('p.device_id = :deviceId', { deviceId });
      }
      if (networkId) {
        qb.andWhere('p.network_id ILIKE :networkId', { networkId: `%${networkId.trim()}%` });
      }
      if (packetType) {
        qb.andWhere('p.packet_type = :packetType', { packetType });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('p.created_at', 'DESC');

      const [items, total] = await qb.getManyAndCount();

      return {
        data: items,
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get device packets: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve device packets: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post([
    'api/plugins/device/packets',
    'api/v1/plugins/device/packets',
    'api/plugins/devices/packets',
    'api/v1/plugins/devices/packets',
  ])
  async ingestDevicePacket(@Body() body: IngestDevicePacketDto) {
    if (!body.rawPayload && !body.decodedPayload) {
      throw new BadRequestException('Either rawPayload or decodedPayload must be provided');
    }

    try {
      const packetRepo = this.databaseService.getRepositoryForTable(
        'device_packets',
        DevicePacketEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'devices',
        TestingDeviceEntity,
      );

      let resolvedDeviceId = body.deviceId;
      let resolvedNetworkId = body.networkId;

      if (resolvedDeviceId && !resolvedNetworkId) {
        const dev = await deviceRepo.findOne({ where: { id: resolvedDeviceId } });
        if (dev) {
          resolvedNetworkId = dev.network_id || dev.serial_number;
        }
      } else if (!resolvedDeviceId && resolvedNetworkId) {
        const dev = await deviceRepo.findOne({
          where: [{ network_id: resolvedNetworkId }, { serial_number: resolvedNetworkId }],
        });
        if (dev) {
          resolvedDeviceId = dev.id;
        }
      }

      if (!resolvedDeviceId) {
        throw new BadRequestException(
          'Target device could not be identified. Provide a valid deviceId or matching networkId/serialNumber',
        );
      }

      const packet = packetRepo.create({
        device_id: resolvedDeviceId,
        packet_type: body.packetType?.toLowerCase() || 'uplink',
        f_port: body.fPort !== undefined ? Number(body.fPort) : null,
        f_cnt: body.fCnt !== undefined ? String(body.fCnt) : null,
        raw_payload: body.rawPayload || null,
        decoded_payload: body.decodedPayload || {},
        rf_info: body.rfInfo || {},
      });

      const saved = await packetRepo.save(packet);

      try {
        this.realtimeService?.publishTelemetry({
          deviceId: resolvedDeviceId,
          packet: saved,
        });
        this.realtimeService?.publishPluginLifecycle('device:packet_received', {
          packet: saved,
          deviceId: resolvedDeviceId,
        });
      } catch (_) {
        // Non-blocking
      }

      return {
        message: 'Packet ingested successfully',
        data: saved,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to ingest packet: ${error.message}`);
      throw new HttpException(
        `Failed to ingest packet: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
