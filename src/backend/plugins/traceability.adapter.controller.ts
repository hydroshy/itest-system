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
  Query,
} from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { TraceabilityOrderEntity } from '../core-models/traceability-order.entity';
import { TraceabilityDeviceEntity } from '../core-models/traceability-device.entity';
import { FinalConfigExecutionSessionEntity } from '../core-models/finalconfig-execution-session.entity';
import { FinalConfigExecutionLogEntity } from '../core-models/finalconfig-execution-log.entity';

export interface CreateTraceabilityOrderDto {
  soNumber: string;
  waNumber: string;
  itemCode: string;
  connectivity?: 'LoRaWAN' | 'Sigfox' | 'NB-IoT' | 'Others' | string;
  totalQuantity: number;
  notes?: string;
  createdBy?: string;
}

export interface RegisterDeviceDto {
  serialNumber: string;
  sku: string;
  fwVersion: string;
  hwVersion?: string;
  meVersion?: string;
  devEui?: string;
  appEui?: string;
  appKey?: string;
  sigfoxId?: string;
  sigfoxPac?: string;
  telecomCredentials?: Record<string, any>;
  notes?: string;
}

export interface BatchRegisterDevicesDto {
  devices: RegisterDeviceDto[];
}

export interface LinkSessionDto {
  serialNumber: string;
  finalConfigSessionId: string;
  configStatus?: 'PENDING' | 'CONFIGURED_PASS' | 'CONFIGURED_FAIL';
}

@Controller()
export class TraceabilityAdapterController {
  private readonly logger = new Logger(TraceabilityAdapterController.name);

  constructor(private readonly databaseService: DynamicDatabaseService) {}

  @Get(['api/plugins/device-traceability/status', 'api/v1/plugins/device-traceability/status'])
  getStatus() {
    return {
      status: 'online',
      plugin: 'device-traceability',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================
  // ORDERS MANAGEMENT
  // ==========================================

  @Get(['api/plugins/device-traceability/orders', 'api/v1/plugins/device-traceability/orders'])
  async getOrders(
    @Query('soNumber') soNumber?: string,
    @Query('waNumber') waNumber?: string,
    @Query('connectivity') connectivity?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const orderRepo = this.databaseService.getRepositoryForTable(
        'traceability_order',
        TraceabilityOrderEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = orderRepo.createQueryBuilder('order');

      if (soNumber) {
        qb.andWhere('order.so_number ILIKE :soNumber', { soNumber: `%${soNumber}%` });
      }
      if (waNumber) {
        qb.andWhere('order.wa_number ILIKE :waNumber', { waNumber: `%${waNumber}%` });
      }
      if (connectivity) {
        qb.andWhere('order.connectivity = :connectivity', { connectivity });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('order.created_at', 'DESC');

      const [orders, total] = await qb.getManyAndCount();

      // Aggregate device counts and pass rates for each order
      const orderIds = orders.map((o) => o.id);
      let deviceStats: Record<
        string,
        { registeredCount: number; configuredPassCount: number; configuredFailCount: number }
      > = {};

      if (orderIds.length > 0) {
        const stats = await deviceRepo
          .createQueryBuilder('device')
          .select('device.order_id', 'orderId')
          .addSelect('COUNT(*)', 'totalRegistered')
          .addSelect(
            "COUNT(CASE WHEN device.config_status = 'CONFIGURED_PASS' THEN 1 END)",
            'totalPass',
          )
          .addSelect(
            "COUNT(CASE WHEN device.config_status = 'CONFIGURED_FAIL' THEN 1 END)",
            'totalFail',
          )
          .where('device.order_id IN (:...orderIds)', { orderIds })
          .groupBy('device.order_id')
          .getRawMany();

        for (const s of stats) {
          deviceStats[s.orderId] = {
            registeredCount: parseInt(s.totalRegistered, 10) || 0,
            configuredPassCount: parseInt(s.totalPass, 10) || 0,
            configuredFailCount: parseInt(s.totalFail, 10) || 0,
          };
        }
      }

      const formatted = orders.map((order) => {
        const stat = deviceStats[order.id] || {
          registeredCount: 0,
          configuredPassCount: 0,
          configuredFailCount: 0,
        };
        const passRate =
          stat.registeredCount > 0
            ? Math.round((stat.configuredPassCount / stat.registeredCount) * 100)
            : 0;

        return {
          id: order.id,
          soNumber: order.so_number,
          waNumber: order.wa_number,
          itemCode: order.item_code,
          connectivity: order.connectivity,
          totalQuantity: order.total_quantity,
          registeredCount: stat.registeredCount,
          configuredPassCount: stat.configuredPassCount,
          configuredFailCount: stat.configuredFailCount,
          passRate: `${passRate}%`,
          notes: order.notes,
          createdBy: order.created_by,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        };
      });

      return {
        data: formatted,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get traceability orders: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to retrieve orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/device-traceability/orders/:id', 'api/v1/plugins/device-traceability/orders/:id'])
  async getOrderById(@Param('id') id: string) {
    try {
      const orderRepo = this.databaseService.getRepositoryForTable(
        'traceability_order',
        TraceabilityOrderEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const order = await orderRepo.findOne({ where: { id } });
      if (!order) {
        throw new NotFoundException(`Traceability order with ID ${id} not found`);
      }

      const stats = await deviceRepo
        .createQueryBuilder('device')
        .select('COUNT(*)', 'totalRegistered')
        .addSelect(
          "COUNT(CASE WHEN device.config_status = 'CONFIGURED_PASS' THEN 1 END)",
          'totalPass',
        )
        .addSelect(
          "COUNT(CASE WHEN device.config_status = 'CONFIGURED_FAIL' THEN 1 END)",
          'totalFail',
        )
        .where('device.order_id = :id', { id })
        .getRawOne();

      const registeredCount = parseInt(stats?.totalRegistered || '0', 10);
      const configuredPassCount = parseInt(stats?.totalPass || '0', 10);
      const configuredFailCount = parseInt(stats?.totalFail || '0', 10);
      const passRate =
        registeredCount > 0 ? Math.round((configuredPassCount / registeredCount) * 100) : 0;

      return {
        id: order.id,
        soNumber: order.so_number,
        waNumber: order.wa_number,
        itemCode: order.item_code,
        connectivity: order.connectivity,
        totalQuantity: order.total_quantity,
        registeredCount,
        configuredPassCount,
        configuredFailCount,
        passRate: `${passRate}%`,
        notes: order.notes,
        createdBy: order.created_by,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to get order ${id}: ${error.message}`);
      throw new HttpException(`Failed to get order: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(['api/plugins/device-traceability/orders', 'api/v1/plugins/device-traceability/orders'])
  async createOrder(@Body() body: CreateTraceabilityOrderDto) {
    if (!body.soNumber || !body.waNumber || !body.itemCode) {
      throw new BadRequestException('soNumber, waNumber, and itemCode are required');
    }

    try {
      const orderRepo = this.databaseService.getRepositoryForTable(
        'traceability_order',
        TraceabilityOrderEntity,
      );

      // Check unique (so_number, wa_number, item_code)
      const existing = await orderRepo.findOne({
        where: {
          so_number: body.soNumber,
          wa_number: body.waNumber,
          item_code: body.itemCode,
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Traceability Order already exists for SO: ${body.soNumber}, WA: ${body.waNumber}, Item: ${body.itemCode}`,
        );
      }

      const order = orderRepo.create({
        so_number: body.soNumber.trim(),
        wa_number: body.waNumber.trim(),
        item_code: body.itemCode.trim(),
        connectivity: body.connectivity || 'LoRaWAN',
        total_quantity: body.totalQuantity || 0,
        notes: body.notes || '',
        created_by: body.createdBy || 'system',
      });

      const saved = await orderRepo.save(order);
      this.logger.log(`Created Traceability Order [${saved.id}] for SO ${saved.so_number}`);

      return {
        id: saved.id,
        soNumber: saved.so_number,
        waNumber: saved.wa_number,
        itemCode: saved.item_code,
        connectivity: saved.connectivity,
        totalQuantity: saved.total_quantity,
        notes: saved.notes,
        createdBy: saved.created_by,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to create traceability order: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to create order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(['api/plugins/device-traceability/orders/:id', 'api/v1/plugins/device-traceability/orders/:id'])
  async deleteOrder(@Param('id') id: string) {
    try {
      const orderRepo = this.databaseService.getRepositoryForTable(
        'traceability_order',
        TraceabilityOrderEntity,
      );

      const order = await orderRepo.findOne({ where: { id } });
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      await orderRepo.delete(id);
      this.logger.log(`Deleted Traceability Order [${id}]`);

      return {
        success: true,
        message: `Order ${id} deleted successfully`,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to delete order ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to delete order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICES BATCH & ORDER DEVICES
  // ==========================================

  @Get(['api/plugins/device-traceability/orders/:orderId/devices', 'api/v1/plugins/device-traceability/orders/:orderId/devices'])
  async getDevicesByOrder(
    @Param('orderId') orderId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '100',
  ) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));

      const [devices, total] = await deviceRepo.findAndCount({
        where: { order_id: orderId },
        order: { serial_number: 'ASC' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });

      return {
        data: devices.map((d) => ({
          id: d.id,
          orderId: d.order_id,
          serialNumber: d.serial_number,
          sku: d.sku,
          fwVersion: d.fw_version,
          hwVersion: d.hw_version,
          meVersion: d.me_version,
          devEui: d.dev_eui,
          appEui: d.app_eui,
          appKey: d.app_key,
          sigfoxId: d.sigfox_id,
          sigfoxPac: d.sigfox_pac,
          telecomCredentials: d.telecom_credentials,
          finalConfigSessionId: d.final_config_session_id,
          configStatus: d.config_status,
          chirpstackSynced: d.chirpstack_synced,
          status: d.status,
          notes: d.notes,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get devices for order ${orderId}: ${error.message}`);
      throw new HttpException(
        `Failed to get devices: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(['api/plugins/device-traceability/orders/:orderId/devices/batch', 'api/v1/plugins/device-traceability/orders/:orderId/devices/batch'])
  async batchRegisterDevices(
    @Param('orderId') orderId: string,
    @Body() body: BatchRegisterDevicesDto,
  ) {
    if (!body.devices || !Array.isArray(body.devices) || body.devices.length === 0) {
      throw new BadRequestException('A non-empty "devices" array is required');
    }

    try {
      const orderRepo = this.databaseService.getRepositoryForTable(
        'traceability_order',
        TraceabilityOrderEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const order = await orderRepo.findOne({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundException(`Traceability order with ID ${orderId} not found`);
      }

      // Pre-validate serial duplicates inside the batch itself
      const serialSet = new Set<string>();
      for (const d of body.devices) {
        if (!d.serialNumber || !d.sku || !d.fwVersion) {
          throw new BadRequestException(
            'Each device must specify serialNumber, sku, and fwVersion',
          );
        }
        const sn = d.serialNumber.trim();
        if (serialSet.has(sn)) {
          throw new BadRequestException(`Duplicate serialNumber [${sn}] found within the batch`);
        }
        serialSet.add(sn);
      }

      // Check existing serials in DB
      const existingSerials = await deviceRepo
        .createQueryBuilder('device')
        .select('device.serial_number', 'sn')
        .where('device.serial_number IN (:...serials)', { serials: Array.from(serialSet) })
        .getRawMany();

      if (existingSerials.length > 0) {
        const dupes = existingSerials.map((e) => e.sn).join(', ');
        throw new BadRequestException(
          `The following serialNumber(s) already exist in database: ${dupes}`,
        );
      }

      const entities = body.devices.map((d) =>
        deviceRepo.create({
          order_id: orderId,
          serial_number: d.serialNumber.trim(),
          sku: d.sku.trim(),
          fw_version: d.fwVersion.trim(),
          hw_version: d.hwVersion ? d.hwVersion.trim() : null,
          me_version: d.meVersion ? d.meVersion.trim() : null,
          dev_eui: d.devEui ? d.devEui.trim() : null,
          app_eui: d.appEui ? d.appEui.trim() : null,
          app_key: d.appKey ? d.appKey.trim() : null,
          sigfox_id: d.sigfoxId ? d.sigfoxId.trim() : null,
          sigfox_pac: d.sigfoxPac ? d.sigfoxPac.trim() : null,
          telecom_credentials: d.telecomCredentials || {},
          final_config_session_id: null,
          config_status: 'PENDING',
          chirpstack_synced: false,
          status: 'INITIAL',
          notes: d.notes || '',
        }),
      );

      const saved = await deviceRepo.save(entities);
      this.logger.log(
        `Batch registered ${saved.length} devices for Order [${orderId}] (${order.so_number})`,
      );

      return {
        success: true,
        orderId,
        enrolledCount: saved.length,
        devices: saved.map((d) => ({
          id: d.id,
          serialNumber: d.serial_number,
          sku: d.sku,
          fwVersion: d.fw_version,
          configStatus: d.config_status,
          status: d.status,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Failed to batch register devices for order ${orderId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Batch enrollment failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICE LOOKUP & LIFECYCLE
  // ==========================================

  @Get(['api/plugins/device-traceability/devices/lookup', 'api/v1/plugins/device-traceability/devices/lookup'])
  async lookupDevice(
    @Query('serialNumber') serialNumber?: string,
    @Query('devEui') devEui?: string,
    @Query('sigfoxId') sigfoxId?: string,
  ) {
    if (!serialNumber && !devEui && !sigfoxId) {
      throw new BadRequestException('At least one query parameter is required: serialNumber, devEui, or sigfoxId');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = deviceRepo
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.order', 'order');

      if (serialNumber) {
        qb.andWhere('device.serial_number = :serialNumber', { serialNumber: serialNumber.trim() });
      } else if (devEui) {
        qb.andWhere('device.dev_eui ILIKE :devEui', { devEui: devEui.trim() });
      } else if (sigfoxId) {
        qb.andWhere('device.sigfox_id ILIKE :sigfoxId', { sigfoxId: sigfoxId.trim() });
      }

      const device = await qb.getOne();
      if (!device) {
        throw new NotFoundException('Device not found matching the criteria');
      }

      return {
        id: device.id,
        orderId: device.order_id,
        serialNumber: device.serial_number,
        sku: device.sku,
        fwVersion: device.fw_version,
        hwVersion: device.hw_version,
        meVersion: device.me_version,
        devEui: device.dev_eui,
        appEui: device.app_eui,
        appKey: device.app_key,
        sigfoxId: device.sigfox_id,
        sigfoxPac: device.sigfox_pac,
        telecomCredentials: device.telecom_credentials,
        finalConfigSessionId: device.final_config_session_id,
        configStatus: device.config_status,
        chirpstackSynced: device.chirpstack_synced,
        status: device.status,
        notes: device.notes,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
        order: device.order
          ? {
              id: device.order.id,
              soNumber: device.order.so_number,
              waNumber: device.order.wa_number,
              itemCode: device.order.item_code,
              connectivity: device.order.connectivity,
              totalQuantity: device.order.total_quantity,
            }
          : null,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Device lookup failed: ${error.message}`);
      throw new HttpException(`Lookup failed: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(['api/plugins/device-traceability/devices/:id/lifecycle', 'api/v1/plugins/device-traceability/devices/:id/lifecycle'])
  async getDeviceLifecycle(@Param('id') id: string) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const device = await deviceRepo.findOne({
        where: { id },
        relations: ['order'],
      });

      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      let finalConfigSessionDetail: any = null;
      let executionLogs: any[] = [];

      if (device.final_config_session_id) {
        try {
          const sessionRepo = this.databaseService.getRepositoryForTable(
            'finalconfig_execution_session',
            FinalConfigExecutionSessionEntity,
          );
          const logRepo = this.databaseService.getRepositoryForTable(
            'finalconfig_execution_log',
            FinalConfigExecutionLogEntity,
          );

          const session = await sessionRepo.findOne({
            where: { id: device.final_config_session_id },
            relations: ['profile'],
          });

          if (session) {
            const logs = await logRepo.find({
              where: { sessionId: session.id },
              order: { createdAt: 'ASC' },
            });

            finalConfigSessionDetail = {
              sessionId: session.id,
              profileId: session.profileId,
              status: session.status,
              currentStep: session.currentStep,
              totalSteps: session.totalSteps,
              passedSteps: session.passedSteps,
              failedSteps: session.failedSteps,
              startedAt: session.startedAt,
              completedAt: session.completedAt,
              errorMessage: session.errorMessage,
              profile: (session as any).profile
                ? {
                    id: (session as any).profile.id,
                    sku: (session as any).profile.sku,
                    longFw: (session as any).profile.longFw,
                    shortFw: (session as any).profile.shortFw,
                    connectivity: (session as any).profile.connectivity,
                  }
                : null,
            };

            executionLogs = logs.map((l) => ({
              id: l.id,
              modbusRegisterDec: l.modbusRegisterDec,
              modbusRegisterHex: l.modbusRegisterHex,
              action: l.action,
              expectedValue: l.expectedValue,
              writtenValue: l.writtenValue,
              readValue: l.readValue,
              rawHex: l.rawHex,
              status: l.status,
              errorMessage: l.errorMessage,
              durationMs: l.durationMs,
              createdAt: l.createdAt,
            }));
          }
        } catch (subErr) {
          this.logger.warn(`Could not load final config session ${device.final_config_session_id}: ${subErr.message}`);
        }
      }

      return {
        device: {
          id: device.id,
          serialNumber: device.serial_number,
          sku: device.sku,
          fwVersion: device.fw_version,
          hwVersion: device.hw_version,
          meVersion: device.me_version,
          devEui: device.dev_eui,
          appEui: device.app_eui,
          appKey: device.app_key,
          sigfoxId: device.sigfox_id,
          sigfoxPac: device.sigfox_pac,
          telecomCredentials: device.telecom_credentials,
          configStatus: device.config_status,
          chirpstackSynced: device.chirpstack_synced,
          status: device.status,
          notes: device.notes,
          createdAt: device.created_at,
          updatedAt: device.updated_at,
        },
        order: device.order
          ? {
              id: device.order.id,
              soNumber: device.order.so_number,
              waNumber: device.order.wa_number,
              itemCode: device.order.item_code,
              connectivity: device.order.connectivity,
              totalQuantity: device.order.total_quantity,
              notes: device.order.notes,
              createdBy: device.order.created_by,
              createdAt: device.order.created_at,
            }
          : null,
        finalConfig: finalConfigSessionDetail,
        executionLogs,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Lifecycle lookup failed for device ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve device lifecycle: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // CROSS-SYSTEM LINKING
  // ==========================================

  @Post(['api/plugins/device-traceability/devices/link-session', 'api/v1/plugins/device-traceability/devices/link-session'])
  async linkFinalConfigSession(@Body() body: LinkSessionDto) {
    if (!body.serialNumber || !body.finalConfigSessionId) {
      throw new BadRequestException('serialNumber and finalConfigSessionId are required');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const device = await deviceRepo.findOne({
        where: { serial_number: body.serialNumber.trim() },
      });

      if (!device) {
        throw new NotFoundException(`Device with serial ${body.serialNumber} not found in traceability records`);
      }

      device.final_config_session_id = body.finalConfigSessionId;
      if (body.configStatus) {
        device.config_status = body.configStatus;
        if (body.configStatus === 'CONFIGURED_PASS') {
          device.status = 'CONFIGURED';
        }
      }

      const updated = await deviceRepo.save(device);
      this.logger.log(
        `Linked device ${device.serial_number} to Final Config Session [${body.finalConfigSessionId}] (Status: ${device.config_status})`,
      );

      return {
        success: true,
        deviceId: updated.id,
        serialNumber: updated.serial_number,
        finalConfigSessionId: updated.final_config_session_id,
        configStatus: updated.config_status,
        status: updated.status,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to link session to device: ${error.message}`);
      throw new HttpException(
        `Link session failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
