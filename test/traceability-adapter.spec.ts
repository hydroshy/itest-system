import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { TraceabilitySoEntity } from '../src/backend/core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../src/backend/core-models/traceability-wa.entity';
import {
  TraceabilityDeviceEntity,
  TraceabilityTestResult,
  TraceabilityConfigStatus,
  TraceabilityDeviceStatus,
} from '../src/backend/core-models/traceability-device.entity';
import { FinalConfigExecutionSessionEntity } from '../src/backend/core-models/finalconfig-execution-session.entity';
import { FinalConfigExecutionLogEntity } from '../src/backend/core-models/finalconfig-execution-log.entity';
import { TraceabilityAdapterController } from '../src/backend/plugins/traceability.adapter.controller';
import { DisManagerAdapterController } from '../src/backend/plugins/dis-manager.adapter.controller';
import { DisClientService } from '../src/backend/plugins/dis-client/dis-client.service';

async function runTests() {
  console.log('--- Starting TraceabilityAdapterController & Entity v2 Verification ---');

  // 1. Entity Metadata & DB Routing
  console.log('1. Verifying Traceability v2 Entities & DB Routing...');
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(TraceabilitySoEntity),
    'TraceabilitySoEntity must be registered in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(TraceabilityWaEntity),
    'TraceabilityWaEntity must be registered in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(TraceabilityDeviceEntity),
    'TraceabilityDeviceEntity must be registered in ALL_DATABASE_ENTITIES',
  );

  const configPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(configPath), 'db-routing.config.json must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  assert.strictEqual(
    config.table_routes['traceability_so'],
    'core_db',
    'traceability_so must route to core_db',
  );
  assert.strictEqual(
    config.table_routes['traceability_wa'],
    'core_db',
    'traceability_wa must route to core_db',
  );
  assert.strictEqual(
    config.table_routes['traceability_device'],
    'core_db',
    'traceability_device must route to core_db',
  );

  // 2. Mock DynamicDatabaseService
  console.log('2. Mocking In-Memory Storage for SO, WA, Device, FinalConfig...');
  const soStore: Map<string, TraceabilitySoEntity> = new Map();
  const waStore: Map<string, TraceabilityWaEntity> = new Map();
  const deviceStore: Map<string, TraceabilityDeviceEntity> = new Map();
  const sessionStore: Map<string, FinalConfigExecutionSessionEntity> = new Map();
  const logStore: Map<string, FinalConfigExecutionLogEntity> = new Map();

  const mockDbService: any = {
    getRepositoryForTable: (tableName: string, entityTarget: any) => {
      if (tableName === 'traceability_so') {
        return {
          create: (data: any) => ({
            id: `so-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date(),
            updated_at: new Date(),
            ...data,
          }),
          save: async (entity: any) => {
            soStore.set(entity.id, { ...entity });
            return entity;
          },
          findOne: async ({ where }: any) => {
            for (const so of soStore.values()) {
              if (where.id && so.id === where.id) return so;
              if (where.so_number && so.so_number === where.so_number) return so;
            }
            return null;
          },
          find: async () => Array.from(soStore.values()),
          createQueryBuilder: () => {
            let filters: any[] = [];
            const qb: any = {
              andWhere: (clause: string, params: any) => {
                filters.push({ clause, params });
                return qb;
              },
              skip: () => qb,
              take: () => qb,
              orderBy: () => qb,
              getMany: async () => Array.from(soStore.values()),
              getManyAndCount: async () => [Array.from(soStore.values()), soStore.size],
            };
            return qb;
          },
        };
      }

      if (tableName === 'traceability_wa') {
        return {
          create: (data: any) => ({
            id: `wa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date(),
            updated_at: new Date(),
            ...data,
          }),
          save: async (entity: any) => {
            waStore.set(entity.id, { ...entity });
            return entity;
          },
          findOne: async ({ where }: any) => {
            for (const wa of waStore.values()) {
              if (where.id && wa.id === where.id) {
                const so = soStore.get(wa.so_id);
                return { ...wa, so };
              }
              if (where.wa_number && wa.wa_number === where.wa_number) {
                const so = soStore.get(wa.so_id);
                return { ...wa, so };
              }
            }
            return null;
          },
          find: async ({ where }: any = {}) => {
            let res = Array.from(waStore.values());
            if (where?.so_id) {
              res = res.filter((w) => w.so_id === where.so_id);
            }
            return res;
          },
          createQueryBuilder: () => {
            return {
              leftJoinAndSelect: () => this,
              orderBy: () => this,
              andWhere: () => this,
              getMany: async () => {
                return Array.from(waStore.values()).map((w) => ({
                  ...w,
                  so: soStore.get(w.so_id),
                }));
              },
            };
          },
        };
      }

      if (tableName === 'traceability_device') {
        return {
          create: (data: any) => ({
            id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date(),
            updated_at: new Date(),
            test_result: TraceabilityTestResult.PENDING,
            config_status: TraceabilityConfigStatus.PENDING,
            status: TraceabilityDeviceStatus.TESTED,
            test_raw_data: {},
            ...data,
          }),
          save: async (entity: any) => {
            deviceStore.set(entity.id, { ...entity });
            return entity;
          },
          findOne: async ({ where }: any) => {
            for (const dev of deviceStore.values()) {
              if (where.id && dev.id === where.id) {
                return {
                  ...dev,
                  so: soStore.get(dev.so_id),
                  wa: dev.wa_id ? waStore.get(dev.wa_id) : null,
                };
              }
              if (where.serial_number && dev.serial_number === where.serial_number) {
                return {
                  ...dev,
                  so: soStore.get(dev.so_id),
                  wa: dev.wa_id ? waStore.get(dev.wa_id) : null,
                };
              }
            }
            return null;
          },
          count: async ({ where }: any = {}) => {
            let res = Array.from(deviceStore.values());
            if (where?.so_id) res = res.filter((d) => d.so_id === where.so_id);
            if (where?.test_result) res = res.filter((d) => d.test_result === where.test_result);
            if (where?.config_status)
              res = res.filter((d) => d.config_status === where.config_status);
            return res.length;
          },
          createQueryBuilder: () => {
            return {
              leftJoinAndSelect: () => this,
              andWhere: () => this,
              skip: () => this,
              take: () => this,
              orderBy: () => this,
              getManyAndCount: async () => [
                Array.from(deviceStore.values()).map((d) => ({
                  ...d,
                  so: soStore.get(d.so_id),
                  wa: d.wa_id ? waStore.get(d.wa_id) : null,
                })),
                deviceStore.size,
              ],
              getOne: async () => {
                const first = Array.from(deviceStore.values())[0];
                if (!first) return null;
                return {
                  ...first,
                  so: soStore.get(first.so_id),
                  wa: first.wa_id ? waStore.get(first.wa_id) : null,
                };
              },
            };
          },
        };
      }

      if (tableName === 'finalconfig_execution_session') {
        return {
          findOne: async ({ where }: any) => {
            return sessionStore.get(where.id) || null;
          },
        };
      }

      if (tableName === 'finalconfig_execution_log') {
        return {
          find: async ({ where }: any) => {
            return Array.from(logStore.values()).filter((l) => l.sessionId === where.sessionId);
          },
        };
      }

      throw new Error(`Unsupported table: ${tableName}`);
    },
  };

  const disClientService = new DisClientService();
  const controller = new TraceabilityAdapterController(mockDbService, disClientService);

  // 3. Test SO Creation and Validation
  console.log('3. Testing SO creation and duplicate rejection...');
  const so1 = await controller.createSaleOrder({
    soNumber: 'SO/2026/01855',
    customerName: 'Smart Agrotech Corp',
    notes: 'Batch for IoT irrigation',
  });
  assert.strictEqual(so1.soNumber, 'SO/2026/01855');
  assert.strictEqual(so1.customerName, 'Smart Agrotech Corp');

  await assert.rejects(
    async () => {
      await controller.createSaleOrder({ soNumber: 'SO/2026/01855' });
    },
    BadRequestException,
    'Duplicate SO number must be rejected',
  );

  // 4. Test WA Creation and Regex Validation
  console.log('4. Testing WA creation and WA/xxxx/xxxxx regex validation...');
  await assert.rejects(
    async () => {
      await controller.createWorkAuthorization({
        soId: so1.id,
        waNumber: 'INVALID_WA_FORMAT',
      });
    },
    BadRequestException,
    'Invalid WA format must be rejected',
  );

  const wa1 = await controller.createWorkAuthorization({
    soId: so1.id,
    waNumber: 'WA/2026/00412',
    itemCode: 'WSLRW-C-RS485-01',
    plannedQuantity: 100,
  });
  assert.strictEqual(wa1.waNumber, 'WA/2026/00412');
  assert.strictEqual(wa1.soNumber, 'SO/2026/01855');

  // 5. Test CSV Device Import with Test Data & Metrics
  console.log('5. Testing CSV Device Import under WA/SO...');
  const importResult = await controller.importCsvDevices({
    waId: wa1.id,
    devices: [
      {
        serialNumber: 'LRCR26000093',
        deviceKey: '3632373265326610',
        sku: 'WSLRW-MB485',
        hwVersion: '2H',
        fwVersion: '5F0917',
        testResult: 'PASS',
        testId: 'TEST-EN-9921',
        testStation: 'STATION-EN-3',
        testPerson: 'DO QUANG KHANH',
        testedAt: '2026-03-24T08:30:00Z',
        duration_time: '12s',
        label_check_code: 'LBL-001',
        actual_cyclic_period: '60s',
      },
      {
        serialNumber: 'LRCR26000094',
        deviceKey: '3632373265326611',
        sku: 'WSLRW-MB485',
        hwVersion: '2H',
        fwVersion: '5F0917',
        testResult: 'FAIL',
        testId: 'TEST-EN-9922',
        testStation: 'STATION-EN-3',
        testPerson: 'DO QUANG KHANH',
        testedAt: '2026-03-24T08:35:00Z',
        failure_reason: 'Current draw exceeded threshold',
      },
    ],
  });

  assert.strictEqual(importResult.importedCount, 2);
  assert.strictEqual(importResult.soNumber, 'SO/2026/01855');
  assert.strictEqual(importResult.waNumber, 'WA/2026/00412');

  const passDevice = Array.from(deviceStore.values()).find(
    (d) => d.serial_number === 'LRCR26000093',
  );
  assert.ok(passDevice, 'Device LRCR26000093 must exist');
  assert.strictEqual(passDevice?.test_result, TraceabilityTestResult.PASS);
  assert.strictEqual(passDevice?.status, TraceabilityDeviceStatus.TESTED_PASS);
  assert.strictEqual(passDevice?.test_raw_data['label_check_code'], 'LBL-001');

  const failDevice = Array.from(deviceStore.values()).find(
    (d) => d.serial_number === 'LRCR26000094',
  );
  assert.ok(failDevice, 'Device LRCR26000094 must exist');
  assert.strictEqual(failDevice?.test_result, TraceabilityTestResult.FAIL);
  assert.strictEqual(failDevice?.status, TraceabilityDeviceStatus.TESTED_FAIL);
  assert.strictEqual(
    failDevice?.test_raw_data['failure_reason'],
    'Current draw exceeded threshold',
  );

  // 6. Test SO and WA listing / stats
  console.log('6. Verifying SO stats calculation...');
  const soDetail = await controller.getSaleOrderById(so1.id);
  assert.strictEqual(soDetail.stats.totalDevices, 2);
  assert.strictEqual(soDetail.stats.testPassCount, 1);
  assert.strictEqual(soDetail.stats.configPassCount, 0);

  // 7. Test Final Config Business Guard
  console.log('7. Testing Final Config Business Guard (test_result = PASS required)...');
  sessionStore.set('sess-uuid-101', {
    id: 'sess-uuid-101',
    deviceId: 'LRCR26000094',
    profileId: 'prof-mb485',
    status: 'COMPLETED',
    totalSteps: 5,
    completedSteps: 5,
    currentStep: 5,
    startedAt: new Date(),
    completedAt: new Date(),
    createdAt: new Date(),
  } as any);

  // Attempting to link session to FAIL device must be BLOCKED!
  await assert.rejects(
    async () => {
      await controller.linkFinalConfigSession({
        serialNumber: 'LRCR26000094',
        finalConfigSessionId: 'sess-uuid-101',
      });
    },
    BadRequestException,
    'Linking Final Config session to non-PASS device must be rejected',
  );

  // Linking to PASS device must SUCCEED!
  const linkResult = await controller.linkFinalConfigSession({
    serialNumber: 'LRCR26000093',
    finalConfigSessionId: 'sess-uuid-101',
  });
  assert.strictEqual(linkResult.serialNumber, 'LRCR26000093');
  assert.strictEqual(linkResult.configStatus, TraceabilityConfigStatus.CONFIGURED_PASS);
  assert.strictEqual(linkResult.status, TraceabilityDeviceStatus.CONFIGURED);

  // 8. Test Device Lifecycle Aggregation
  console.log('8. Testing Device Lifecycle Aggregation...');
  logStore.set('log-1', {
    id: 'log-1',
    sessionId: 'sess-uuid-101',
    modbusRegisterDec: 100,
    modbusRegisterHex: '0x0064',
    action: 'WRITE',
    expectedValue: '1',
    writtenValue: '1',
    readValue: '1',
    status: 'PASS',
    durationMs: 15,
    errorMessage: null,
    createdAt: new Date(),
  } as any);

  const lifecycle = await controller.getDeviceLifecycle(passDevice!.id);
  assert.strictEqual(lifecycle.device.serialNumber, 'LRCR26000093');
  assert.strictEqual(lifecycle.so?.soNumber, 'SO/2026/01855');
  assert.strictEqual(lifecycle.wa?.waNumber, 'WA/2026/00412');
  assert.strictEqual(lifecycle.finalConfig?.id, 'sess-uuid-101');
  assert.strictEqual(lifecycle.executionLogs.length, 1);
  assert.strictEqual(lifecycle.executionLogs[0].modbusRegisterDec, 100);

  // 9. Test Tree Hierarchy (Tabulator dataTree)
  console.log('9. Testing Tabulator dataTree hierarchy API (SO -> ITEM_CODE -> SERIAL_NUMBER)...');
  const tree = await controller.getHierarchyTree();
  assert.ok(Array.isArray(tree), 'Tree must return an array');
  assert.strictEqual(tree.length, 1);
  assert.strictEqual(tree[0].type, 'SO');
  assert.strictEqual(tree[0].code, 'SO/2026/01855');
  assert.ok(Array.isArray(tree[0]._children), 'SO node must have _children array');
  assert.strictEqual(tree[0]._children[0].type, 'ITEM_CODE');
  assert.strictEqual(tree[0]._children[0].itemCode, 'WSLRW-C-RS485-01');
  assert.ok(Array.isArray(tree[0]._children[0]._children), 'ITEM_CODE node must have _children array');
  assert.strictEqual(tree[0]._children[0]._children[0].type, 'DEVICE');
  assert.strictEqual(tree[0]._children[0]._children[0].waNumber, 'WA/2026/00412');

  // 10. Test Context Menu Status Update & Delete
  console.log('10. Testing Context Menu Status Update & Delete...');
  const updateRes = await controller.updateDeviceStatus(passDevice!.id, undefined, {
    statusType: 'test',
    status: 'FAIL',
  });
  assert.strictEqual(updateRes.testResult, 'FAIL');

  const updateFinalConfigRes = await controller.updateDeviceStatus(undefined, 'LRCR26000093', {
    statusType: 'final_config',
    status: 'PASS',
  });
  assert.strictEqual(updateFinalConfigRes.finalConfigStatus, 'CONFIGURED_PASS');

  // 11. Test Final Config Devices Listing
  console.log('11. Testing Final Config Devices Listing...');
  const finalConfigDevs = await controller.getFinalConfigDevices();
  assert.ok(Array.isArray(finalConfigDevs.data));
  assert.ok(finalConfigDevs.data.some((d) => d.serialNumber === 'LRCR26000093'));

  // 12. Test Device Delete
  console.log('12. Testing Device Deletion...');
  const delRes = await controller.deleteDevice(failDevice!.id);
  assert.strictEqual(delRes.success, true);
  const checkDel = await controller.getDevices(undefined, undefined, 'LRCR26000094');
  assert.strictEqual(checkDel.data.length, 0);

  // 13. Test DIS Sales Order Integration & Sync
  console.log('13. Testing DIS Sales Order Integration & Sync...');
  const disStatus = controller.getDisStatus();
  assert.strictEqual(disStatus.enabled, true);
  assert.strictEqual(disStatus.mockMode, true);

  const searchRes = await controller.searchDisOrders('2026', '10', undefined, undefined, 'sale', '01856');
  assert.ok(Array.isArray(searchRes.items));
  assert.strictEqual(searchRes.items.length, 1);
  assert.strictEqual(searchRes.items[0].name, 'SO/2026/01856');

  const detailRes = await controller.getDisOrderDetail('101856');
  assert.strictEqual(detailRes.name, 'SO/2026/01856');
  assert.ok(detailRes.lines.length >= 2);

  const syncRes = await controller.syncDisOrderToTraceability('101856');
  assert.strictEqual(syncRes.so.soNumber, 'SO/2026/01856');
  assert.strictEqual(syncRes.so.partnerEmail, 'procurement@eco-iot.vn');
  assert.ok(syncRes.workAuthorizations.length >= 2);
  assert.strictEqual(syncRes.workAuthorizations[0].itemCode, 'WSLRW-C-RS485-01');

  // Verify synced SO exists in DB with partner_email
  const testSoRepo = (mockDbService as any).getRepository('traceability_so');
  const verifySo = await testSoRepo.findOne({ where: { so_number: 'SO/2026/01856' } });
  assert.ok(verifySo, 'Synced SO must be saved in database');
  assert.strictEqual(verifySo.partner_email, 'procurement@eco-iot.vn');

  // 14. Test DisManagerAdapterController Endpoints & Sandbox Query
  console.log('14. Testing DisManagerAdapterController Endpoints & Sandbox Explorer...');
  const disManagerController = new DisManagerAdapterController(disClientService, mockDbService);
  const managerStatus = disManagerController.getStatus();
  assert.strictEqual(managerStatus.plugin, 'dis-manager');
  assert.strictEqual(managerStatus.status, 'online');
  assert.strictEqual(managerStatus.isMock, true);
  assert.strictEqual(managerStatus.tokenConfigured, false);
  assert.strictEqual(managerStatus.connected, false);
  assert.strictEqual(managerStatus.dis.mockMode, true);

  const sandboxSearch = await disManagerController.executeTestQuery({
    endpoint: '/api/v1/sales-orders/search',
    params: { year: 2026, month: 10, states: 'sale', limit: 5 },
  });
  assert.strictEqual(sandboxSearch.success, true);
  assert.strictEqual(sandboxSearch.statusCode, 200);
  assert.strictEqual(sandboxSearch.mockMode, true);
  assert.ok(sandboxSearch.data.items.length >= 1);

  const sandboxDetail = await disManagerController.executeTestQuery({
    endpoint: '/api/v1/sales-orders/101857',
    id: '101857',
  });
  assert.strictEqual(sandboxDetail.success, true);
  assert.strictEqual(sandboxDetail.data.name, 'SO/2026/01857');

  console.log('--- ALL TRACEABILITY V2 & DIS INTEGRATION VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
