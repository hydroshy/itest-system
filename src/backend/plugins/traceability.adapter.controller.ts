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
import { TraceabilitySoEntity } from '../core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../core-models/traceability-wa.entity';
import { TraceabilityOrderEntity } from '../core-models/traceability-order.entity';
import {
  TraceabilityDeviceEntity,
  TraceabilityTestResult,
  TraceabilityConfigStatus,
  TraceabilityDeviceStatus,
} from '../core-models/traceability-device.entity';
import { FinalConfigExecutionSessionEntity } from '../core-models/finalconfig-execution-session.entity';
import { FinalConfigExecutionLogEntity } from '../core-models/finalconfig-execution-log.entity';

export interface CreateSoDto {
  soNumber: string;
  customerName?: string;
  notes?: string;
}

export interface CreateWaDto {
  soId?: string;
  soNumber?: string;
  waNumber: string;
  itemCode?: string;
  plannedQuantity?: number;
  notes?: string;
}

export interface ImportTestedCsvDeviceItem {
  deviceKey?: string;
  devEui?: string;
  serialNumber: string;
  sku?: string;
  hwVersion?: string;
  fwVersion?: string;
  itemCode?: string;
  testResult?: string;
  testId?: string;
  testStation?: string;
  testPerson?: string;
  testedAt?: string | Date;
  testRawData?: Record<string, any>;
  [key: string]: any;
}

export interface ImportCsvDevicesDto {
  soId?: string;
  soNumber?: string;
  waId?: string;
  waNumber?: string;
  devices: ImportTestedCsvDeviceItem[];
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
      contractVersion: 'v2',
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================
  // SALE ORDERS (SO) MANAGEMENT
  // ==========================================

  @Get(['api/plugins/device-traceability/so', 'api/v1/plugins/device-traceability/so'])
  async getSaleOrders(
    @Query('soNumber') soNumber?: string,
    @Query('customerName') customerName?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = soRepo.createQueryBuilder('so');
      if (soNumber) {
        qb.andWhere('so.so_number ILIKE :soNumber', { soNumber: `%${soNumber.trim()}%` });
      }
      if (customerName) {
        qb.andWhere('so.customer_name ILIKE :customerName', {
          customerName: `%${customerName.trim()}%`,
        });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('so.created_at', 'DESC');

      const [sos, total] = await qb.getManyAndCount();

      // Aggregate statistics for each SO
      const items = await Promise.all(
        sos.map(async (so) => {
          const was = await waRepo.find({ where: { so_id: so.id } });
          const totalDevices = await deviceRepo.count({ where: { so_id: so.id } });
          const testPassCount = await deviceRepo.count({
            where: { so_id: so.id, test_result: TraceabilityTestResult.PASS },
          });
          const configPassCount = await deviceRepo.count({
            where: { so_id: so.id, config_status: TraceabilityConfigStatus.CONFIGURED_PASS },
          });

          return {
            id: so.id,
            soNumber: so.so_number,
            customerName: so.customer_name,
            notes: so.notes,
            waCount: was.length,
            workAuthorizations: was.map((w) => ({
              id: w.id,
              waNumber: w.wa_number,
              itemCode: w.item_code,
              plannedQuantity: w.planned_quantity,
              notes: w.notes,
              createdAt: w.created_at,
            })),
            stats: {
              totalDevices,
              testPassCount,
              configPassCount,
            },
            createdAt: so.created_at,
            updatedAt: so.updated_at,
          };
        }),
      );

      return {
        data: items,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get Sale Orders: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve Sale Orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/device-traceability/so/:id', 'api/v1/plugins/device-traceability/so/:id'])
  async getSaleOrderById(@Param('id') id: string) {
    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const so = await soRepo.findOne({ where: { id } });
      if (!so) {
        throw new NotFoundException(`Sale Order with ID ${id} not found`);
      }

      const was = await waRepo.find({ where: { so_id: so.id }, order: { created_at: 'ASC' } });
      const totalDevices = await deviceRepo.count({ where: { so_id: so.id } });
      const testPassCount = await deviceRepo.count({
        where: { so_id: so.id, test_result: TraceabilityTestResult.PASS },
      });
      const configPassCount = await deviceRepo.count({
        where: { so_id: so.id, config_status: TraceabilityConfigStatus.CONFIGURED_PASS },
      });

      return {
        id: so.id,
        soNumber: so.so_number,
        customerName: so.customer_name,
        notes: so.notes,
        workAuthorizations: was.map((w) => ({
          id: w.id,
          waNumber: w.wa_number,
          itemCode: w.item_code,
          plannedQuantity: w.planned_quantity,
          notes: w.notes,
          createdAt: w.created_at,
        })),
        stats: {
          totalDevices,
          testPassCount,
          configPassCount,
        },
        createdAt: so.created_at,
        updatedAt: so.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to get Sale Order ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve Sale Order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(['api/plugins/device-traceability/so', 'api/v1/plugins/device-traceability/so'])
  async createSaleOrder(@Body() body: CreateSoDto) {
    if (!body.soNumber || !body.soNumber.trim()) {
      throw new BadRequestException('soNumber is required');
    }

    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );

      const cleanSoNumber = body.soNumber.trim();
      const existing = await soRepo.findOne({ where: { so_number: cleanSoNumber } });
      if (existing) {
        throw new BadRequestException(`Sale Order ${cleanSoNumber} already exists`);
      }

      const so = soRepo.create({
        so_number: cleanSoNumber,
        customer_name: body.customerName ? body.customerName.trim() : null,
        notes: body.notes ? body.notes.trim() : null,
      });

      const saved = await soRepo.save(so);
      this.logger.log(`Created Sale Order [${saved.id}] ${saved.so_number}`);

      return {
        id: saved.id,
        soNumber: saved.so_number,
        customerName: saved.customer_name,
        notes: saved.notes,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to create Sale Order: ${error.message}`);
      throw new HttpException(
        `Failed to create Sale Order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // WORK AUTHORIZATION (WA) MANAGEMENT
  // ==========================================

  @Get(['api/plugins/device-traceability/wa', 'api/v1/plugins/device-traceability/wa'])
  async getWorkAuthorizations(
    @Query('soId') soId?: string,
    @Query('soNumber') soNumber?: string,
    @Query('waNumber') waNumber?: string,
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

      const list = await qb.getMany();
      return list.map((w) => ({
        id: w.id,
        soId: w.so_id,
        soNumber: w.so?.so_number,
        waNumber: w.wa_number,
        itemCode: w.item_code,
        plannedQuantity: w.planned_quantity,
        notes: w.notes,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      }));
    } catch (error) {
      this.logger.error(`Failed to get Work Authorizations: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve Work Authorizations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(['api/plugins/device-traceability/wa', 'api/v1/plugins/device-traceability/wa'])
  async createWorkAuthorization(@Body() body: CreateWaDto) {
    if (!body.waNumber || !body.waNumber.trim()) {
      throw new BadRequestException('waNumber is required');
    }

    const cleanWaNumber = body.waNumber.trim();
    const waRegex = /^WA\/\d{4}\/\d{5}$/;
    if (!waRegex.test(cleanWaNumber)) {
      throw new BadRequestException(
        `waNumber must strictly follow the format 'WA/xxxx/xxxxx' (e.g. WA/2026/00412). Received: ${cleanWaNumber}`,
      );
    }

    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );

      let targetSo: TraceabilitySoEntity | null = null;
      if (body.soId) {
        targetSo = await soRepo.findOne({ where: { id: body.soId } });
      } else if (body.soNumber) {
        targetSo = await soRepo.findOne({ where: { so_number: body.soNumber.trim() } });
      }

      if (!targetSo) {
        throw new BadRequestException(
          `Parent Sale Order could not be resolved from provided soId or soNumber`,
        );
      }

      const existingWa = await waRepo.findOne({ where: { wa_number: cleanWaNumber } });
      if (existingWa) {
        throw new BadRequestException(`Work Authorization ${cleanWaNumber} already exists`);
      }

      const wa = waRepo.create({
        so_id: targetSo.id,
        wa_number: cleanWaNumber,
        item_code: body.itemCode ? body.itemCode.trim() : null,
        planned_quantity: body.plannedQuantity || 0,
        notes: body.notes ? body.notes.trim() : null,
      });

      const saved = await waRepo.save(wa);
      this.logger.log(
        `Created Work Authorization [${saved.id}] ${saved.wa_number} under SO ${targetSo.so_number}`,
      );

      return {
        id: saved.id,
        soId: saved.so_id,
        soNumber: targetSo.so_number,
        waNumber: saved.wa_number,
        itemCode: saved.item_code,
        plannedQuantity: saved.planned_quantity,
        notes: saved.notes,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to create Work Authorization: ${error.message}`);
      throw new HttpException(
        `Failed to create Work Authorization: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICE TESTING LIST & CSV IMPORT
  // ==========================================

  @Get(['api/plugins/device-traceability/devices', 'api/v1/plugins/device-traceability/devices'])
  async getDevices(
    @Query('soId') soId?: string,
    @Query('waId') waId?: string,
    @Query('serialNumber') serialNumber?: string,
    @Query('testResult') testResult?: string,
    @Query('configStatus') configStatus?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = deviceRepo
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.so', 'so')
        .leftJoinAndSelect('device.wa', 'wa');

      if (soId) {
        qb.andWhere('device.so_id = :soId', { soId });
      }
      if (waId) {
        qb.andWhere('device.wa_id = :waId', { waId });
      }
      if (serialNumber) {
        qb.andWhere('device.serial_number ILIKE :serialNumber', {
          serialNumber: `%${serialNumber.trim()}%`,
        });
      }
      if (testResult) {
        qb.andWhere('device.test_result = :testResult', { testResult: testResult.toUpperCase() });
      }
      if (configStatus) {
        qb.andWhere('device.config_status = :configStatus', {
          configStatus: configStatus.toUpperCase(),
        });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('device.created_at', 'DESC');

      const [devices, total] = await qb.getManyAndCount();

      return {
        data: devices.map((d) => ({
          id: d.id,
          soId: d.so_id,
          soNumber: d.so?.so_number,
          waId: d.wa_id,
          waNumber: d.wa?.wa_number,
          serialNumber: d.serial_number,
          devEui: d.dev_eui,
          itemCode: d.item_code,
          sku: d.sku,
          hwVersion: d.hw_version,
          fwVersion: d.fw_version,
          testResult: d.test_result,
          testId: d.test_id,
          testStation: d.test_station,
          testPerson: d.test_person,
          testedAt: d.tested_at,
          testRawData: d.test_raw_data,
          finalConfigSessionId: d.final_config_session_id,
          configStatus: d.config_status,
          status: d.status,
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
      this.logger.error(`Failed to get devices: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve devices: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post([
    'api/plugins/device-traceability/devices/import-csv',
    'api/v1/plugins/device-traceability/devices/import-csv',
    'api/plugins/device-traceability/devices/import-test-results',
    'api/v1/plugins/device-traceability/devices/import-test-results',
  ])
  async importCsvDevices(@Body() body: ImportCsvDevicesDto) {
    if (!body.devices || !Array.isArray(body.devices) || body.devices.length === 0) {
      throw new BadRequestException('A non-empty "devices" array is required');
    }

    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      // Resolve WA & SO
      let resolvedWa: TraceabilityWaEntity | null = null;
      let resolvedSo: TraceabilitySoEntity | null = null;

      if (body.waId) {
        resolvedWa = await waRepo.findOne({ where: { id: body.waId }, relations: ['so'] });
        if (!resolvedWa) {
          throw new NotFoundException(`Work Authorization ID ${body.waId} not found`);
        }
        resolvedSo =
          resolvedWa.so || (await soRepo.findOne({ where: { id: resolvedWa.so_id } }));
      } else if (body.waNumber) {
        resolvedWa = await waRepo.findOne({
          where: { wa_number: body.waNumber.trim() },
          relations: ['so'],
        });
        if (!resolvedWa) {
          throw new NotFoundException(`Work Authorization ${body.waNumber} not found`);
        }
        resolvedSo =
          resolvedWa.so || (await soRepo.findOne({ where: { id: resolvedWa.so_id } }));
      }

      if (!resolvedSo) {
        if (body.soId) {
          resolvedSo = await soRepo.findOne({ where: { id: body.soId } });
        } else if (body.soNumber) {
          resolvedSo = await soRepo.findOne({ where: { so_number: body.soNumber.trim() } });
        }
      }

      if (!resolvedSo) {
        throw new BadRequestException(
          'Target Sale Order (SO) or Work Authorization (WA) must be provided and resolvable',
        );
      }

      const importedDevices: TraceabilityDeviceEntity[] = [];

      for (const item of body.devices) {
        const serialNumber = item.serialNumber || item['serial_number'];
        if (!serialNumber || !serialNumber.trim()) {
          continue; // skip invalid row
        }
        const cleanSerial = serialNumber.trim();

        const devEui =
          item.devEui || item.deviceKey || item['device_key'] || item['dev_eui'] || null;
        const sku = item.sku || null;
        const hwVersion = item.hwVersion || item['hw_ver'] || item['hw_version'] || null;
        const fwVersion = item.fwVersion || item['fw_ver'] || item['fw_version'] || null;
        const itemCode = item.itemCode || item['item_code'] || resolvedWa?.item_code || null;

        let testResult = TraceabilityTestResult.PENDING;
        const rawRes = (item.testResult || item['result'] || '').toUpperCase();
        if (rawRes === 'PASS') testResult = TraceabilityTestResult.PASS;
        else if (rawRes === 'FAIL') testResult = TraceabilityTestResult.FAIL;

        const testId = item.testId || item['test_id'] || null;
        const testStation = item.testStation || item['test_station'] || null;
        const testPerson = item.testPerson || item['test_person'] || null;

        let testedAt: Date | null = null;
        const rawTime =
          item.testedAt || item['time_finish'] || item['start_time'] || item['time_start'];
        if (rawTime) {
          const parsedDate = new Date(rawTime);
          if (!isNaN(parsedDate.getTime())) {
            testedAt = parsedDate;
          }
        }

        // Collect all remaining fields into test_raw_data
        const testRawData = item.testRawData ? { ...item.testRawData } : {};
        for (const [k, v] of Object.entries(item)) {
          if (
            ![
              'serialNumber',
              'serial_number',
              'deviceKey',
              'devEui',
              'device_key',
              'dev_eui',
              'sku',
              'hwVersion',
              'hw_ver',
              'hw_version',
              'fwVersion',
              'fw_ver',
              'fw_version',
              'itemCode',
              'item_code',
              'testResult',
              'result',
              'testId',
              'test_id',
              'testStation',
              'test_station',
              'testPerson',
              'test_person',
              'testedAt',
              'time_finish',
              'start_time',
              'testRawData',
            ].includes(k)
          ) {
            testRawData[k] = v;
          }
        }

        let device = await deviceRepo.findOne({ where: { serial_number: cleanSerial } });
        if (!device) {
          device = deviceRepo.create({
            so_id: resolvedSo.id,
            wa_id: resolvedWa ? resolvedWa.id : null,
            serial_number: cleanSerial,
            dev_eui: devEui,
            item_code: itemCode,
            sku,
            hw_version: hwVersion,
            fw_version: fwVersion,
            test_result: testResult,
            test_id: testId,
            test_station: testStation,
            test_person: testPerson,
            tested_at: testedAt,
            test_raw_data: testRawData,
            status:
              testResult === TraceabilityTestResult.PASS
                ? TraceabilityDeviceStatus.TESTED_PASS
                : testResult === TraceabilityTestResult.FAIL
                  ? TraceabilityDeviceStatus.TESTED_FAIL
                  : TraceabilityDeviceStatus.TESTED,
          });
        } else {
          // Update device
          device.so_id = resolvedSo.id;
          if (resolvedWa) device.wa_id = resolvedWa.id;
          if (devEui) device.dev_eui = devEui;
          if (itemCode) device.item_code = itemCode;
          if (sku) device.sku = sku;
          if (hwVersion) device.hw_version = hwVersion;
          if (fwVersion) device.fw_version = fwVersion;
          device.test_result = testResult;
          if (testId) device.test_id = testId;
          if (testStation) device.test_station = testStation;
          if (testPerson) device.test_person = testPerson;
          if (testedAt) device.tested_at = testedAt;
          device.test_raw_data = { ...device.test_raw_data, ...testRawData };
          if (device.status === TraceabilityDeviceStatus.TESTED || !device.status) {
            device.status =
              testResult === TraceabilityTestResult.PASS
                ? TraceabilityDeviceStatus.TESTED_PASS
                : TraceabilityDeviceStatus.TESTED_FAIL;
          }
        }

        const saved = await deviceRepo.save(device);
        importedDevices.push(saved);
      }

      this.logger.log(
        `Imported ${importedDevices.length} devices into SO: ${resolvedSo.so_number}${
          resolvedWa ? ', WA: ' + resolvedWa.wa_number : ''
        }`,
      );

      const passCount = importedDevices.filter((d) => d.test_result === 'PASS').length;
      const failCount = importedDevices.filter((d) => d.test_result === 'FAIL').length;

      return {
        message: 'Imported devices successfully',
        soNumber: resolvedSo.so_number,
        waNumber: resolvedWa?.wa_number || null,
        importedCount: importedDevices.length,
        totalImported: importedDevices.length,
        passCount,
        failCount,
        devices: importedDevices.map((d) => ({
          id: d.id,
          serialNumber: d.serial_number,
          devEui: d.dev_eui,
          sku: d.sku,
          testResult: d.test_result,
          status: d.status,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`CSV Import failed: ${error.message}`);
      throw new HttpException(
        `Device CSV import failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICE LOOKUP & LIFECYCLE
  // ==========================================

  @Get([
    'api/plugins/device-traceability/devices/lookup',
    'api/v1/plugins/device-traceability/devices/lookup',
  ])
  async lookupDevice(
    @Query('serialNumber') serialNumber?: string,
    @Query('devEui') devEui?: string,
  ) {
    if (!serialNumber && !devEui) {
      throw new BadRequestException(
        'At least one query parameter is required: serialNumber or devEui',
      );
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = deviceRepo
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.so', 'so')
        .leftJoinAndSelect('device.wa', 'wa');

      if (serialNumber) {
        qb.andWhere('device.serial_number = :serialNumber', {
          serialNumber: serialNumber.trim(),
        });
      } else if (devEui) {
        qb.andWhere('device.dev_eui ILIKE :devEui', { devEui: devEui.trim() });
      }

      const device = await qb.getOne();
      if (!device) {
        throw new NotFoundException('Device not found matching the criteria');
      }

      return {
        id: device.id,
        soId: device.so_id,
        soNumber: device.so?.so_number,
        waId: device.wa_id,
        waNumber: device.wa?.wa_number,
        serialNumber: device.serial_number,
        devEui: device.dev_eui,
        itemCode: device.item_code,
        sku: device.sku,
        hwVersion: device.hw_version,
        fwVersion: device.fw_version,
        testResult: device.test_result,
        testId: device.test_id,
        testStation: device.test_station,
        testPerson: device.test_person,
        testedAt: device.tested_at,
        testRawData: device.test_raw_data,
        finalConfigSessionId: device.final_config_session_id,
        configStatus: device.config_status,
        status: device.status,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Device lookup failed: ${error.message}`);
      throw new HttpException(
        `Lookup failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get([
    'api/plugins/device-traceability/devices/:id/lifecycle',
    'api/v1/plugins/device-traceability/devices/:id/lifecycle',
  ])
  async getDeviceLifecycle(@Param('id') id: string) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const device = await deviceRepo.findOne({
        where: { id },
        relations: ['so', 'wa'],
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
          });
          if (session) {
            const logs = await logRepo.find({
              where: { sessionId: session.id },
              order: { createdAt: 'ASC' },
            });

            finalConfigSessionDetail = {
              id: session.id,
              deviceId: session.deviceId,
              profileId: session.profileId,
              status: session.status,
              totalSteps: session.totalSteps,
              passedSteps: session.passedSteps,
              failedSteps: session.failedSteps,
              currentStep: session.currentStep,
              startedAt: session.startedAt,
              completedAt: session.completedAt,
              createdAt: session.createdAt,
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
              durationMs: l.durationMs,
              errorMessage: l.errorMessage,
              createdAt: l.createdAt,
            }));
          }
        } catch (linkErr: any) {
          this.logger.warn(
            `Could not query Final Config Session ${device.final_config_session_id}: ${linkErr.message}`,
          );
        }
      }

      return {
        device: {
          id: device.id,
          soId: device.so_id,
          waId: device.wa_id,
          serialNumber: device.serial_number,
          devEui: device.dev_eui,
          itemCode: device.item_code,
          sku: device.sku,
          hwVersion: device.hw_version,
          fwVersion: device.fw_version,
          testResult: device.test_result,
          testId: device.test_id,
          testStation: device.test_station,
          testPerson: device.test_person,
          testedAt: device.tested_at,
          testRawData: device.test_raw_data,
          finalConfigSessionId: device.final_config_session_id,
          configStatus: device.config_status,
          status: device.status,
          createdAt: device.created_at,
          updatedAt: device.updated_at,
        },
        so: device.so
          ? {
              id: device.so.id,
              soNumber: device.so.so_number,
              customerName: device.so.customer_name,
              notes: device.so.notes,
              createdAt: device.so.created_at,
            }
          : null,
        wa: device.wa
          ? {
              id: device.wa.id,
              waNumber: device.wa.wa_number,
              itemCode: device.wa.item_code,
              plannedQuantity: device.wa.planned_quantity,
              notes: device.wa.notes,
              createdAt: device.wa.created_at,
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
  // CROSS-SYSTEM LINKING & BUSINESS GUARD
  // ==========================================

  @Post([
    'api/plugins/device-traceability/devices/link-session',
    'api/v1/plugins/device-traceability/devices/link-session',
  ])
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
        throw new NotFoundException(`Device ${body.serialNumber} not found in Traceability system`);
      }

      // BUSINESS RULE GUARD:
      // Device MUST have test_result = 'PASS' to be eligible for Final Config.
      if (device.test_result !== TraceabilityTestResult.PASS) {
        this.logger.warn(
          `Security/Quality Guard rejected Final Config link for device ${device.serial_number}: test_result is ${device.test_result}`,
        );
        throw new BadRequestException(
          `Device ${device.serial_number} has not passed hardware testing (Current: ${device.test_result}). Final Config is blocked!`,
        );
      }

      const sessionRepo = this.databaseService.getRepositoryForTable(
        'finalconfig_execution_session',
        FinalConfigExecutionSessionEntity,
      );

      const session = await sessionRepo.findOne({
        where: { id: body.finalConfigSessionId },
      });

      if (!session) {
        throw new NotFoundException(
          `Final Config Session ${body.finalConfigSessionId} does not exist`,
        );
      }

      device.final_config_session_id = session.id;
      if (body.configStatus) {
        device.config_status = body.configStatus as TraceabilityConfigStatus;
      } else if (session.status === 'COMPLETED') {
        device.config_status = TraceabilityConfigStatus.CONFIGURED_PASS;
      } else if (session.status === 'FAILED') {
        device.config_status = TraceabilityConfigStatus.CONFIGURED_FAIL;
      }

      if (device.config_status === TraceabilityConfigStatus.CONFIGURED_PASS) {
        device.status = TraceabilityDeviceStatus.CONFIGURED;
      }

      const updated = await deviceRepo.save(device);
      this.logger.log(
        `Linked Device ${updated.serial_number} to Final Config Session ${session.id} (Config Status: ${updated.config_status})`,
      );

      return {
        message: 'Successfully linked Final Config Session to Device',
        serialNumber: updated.serial_number,
        finalConfigSessionId: updated.final_config_session_id,
        configStatus: updated.config_status,
        status: updated.status,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to link Final Config Session: ${error.message}`);
      throw new HttpException(
        `Linking Final Config Session failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // BACKWARD COMPATIBILITY ENDPOINTS (ORDERS)
  // ==========================================

  @Get(['api/plugins/device-traceability/orders', 'api/v1/plugins/device-traceability/orders'])
  async getLegacyOrders(
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
      return {
        data: orders.map((o) => ({
          id: o.id,
          soNumber: o.so_number,
          waNumber: o.wa_number,
          itemCode: o.item_code,
          connectivity: o.connectivity,
          totalQuantity: o.total_quantity,
          notes: o.notes,
          createdBy: o.created_by,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        })),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve legacy orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(['api/plugins/device-traceability/orders', 'api/v1/plugins/device-traceability/orders'])
  async createLegacyOrder(@Body() body: any) {
    const orderRepo = this.databaseService.getRepositoryForTable(
      'traceability_order',
      TraceabilityOrderEntity,
    );
    const order = orderRepo.create({
      so_number: body.soNumber || body.so_number,
      wa_number: body.waNumber || body.wa_number,
      item_code: body.itemCode || body.item_code,
      connectivity: body.connectivity || 'LoRaWAN',
      total_quantity: body.totalQuantity || body.total_quantity || 0,
      notes: body.notes || '',
      created_by: body.createdBy || 'system',
    });
    const saved = await orderRepo.save(order);
    return saved;
  }
}
