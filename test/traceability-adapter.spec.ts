import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { TraceabilityOrderEntity } from '../src/backend/core-models/traceability-order.entity';
import { TraceabilityDeviceEntity } from '../src/backend/core-models/traceability-device.entity';
import { FinalConfigExecutionSessionEntity } from '../src/backend/core-models/finalconfig-execution-session.entity';
import { FinalConfigExecutionLogEntity } from '../src/backend/core-models/finalconfig-execution-log.entity';
import { TraceabilityAdapterController } from '../src/backend/plugins/traceability.adapter.controller';

async function runTests() {
  console.log('--- Starting TraceabilityAdapterController & Entity Verification ---');

  // 1. Entity Metadata & DB Routing
  console.log('1. Verifying Traceability Entities & DB Routing...');
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(TraceabilityOrderEntity),
    'TraceabilityOrderEntity must be registered in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(TraceabilityDeviceEntity),
    'TraceabilityDeviceEntity must be registered in ALL_DATABASE_ENTITIES',
  );

  const configPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(configPath), 'db-routing.config.json must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  assert.strictEqual(
    config.table_routes['traceability_order'],
    'core_db',
    'traceability_order must route to core_db',
  );
  assert.strictEqual(
    config.table_routes['traceability_device'],
    'core_db',
    'traceability_device must route to core_db',
  );
  console.log('✓ Traceability entity metadata and db routing verified');

  // 2. Mock Database & Controller Setup
  const mockStorage: Record<string, any[]> = {
    traceability_order: [],
    traceability_device: [],
    finalconfig_execution_session: [],
    finalconfig_execution_log: [],
  };

  const mockDbService: any = {
    getRepositoryForTable: (table: string, entityClass: any) => {
      return {
        create: (d: any) => ({
          id: `uuid-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          created_at: new Date(),
          updated_at: new Date(),
          ...d,
        }),
        save: async (entityOrEntities: any) => {
          if (Array.isArray(entityOrEntities)) {
            for (const item of entityOrEntities) {
              const idx = mockStorage[table].findIndex((x) => x.id === item.id);
              if (idx >= 0) mockStorage[table][idx] = item;
              else mockStorage[table].push(item);
            }
            return entityOrEntities;
          } else {
            const idx = mockStorage[table].findIndex((x) => x.id === entityOrEntities.id);
            if (idx >= 0) mockStorage[table][idx] = entityOrEntities;
            else mockStorage[table].push(entityOrEntities);
            return entityOrEntities;
          }
        },
        findOne: async (options: any) => {
          if (options.where) {
            return (
              mockStorage[table].find((x) => {
                return Object.entries(options.where).every(([k, v]) => x[k] === v);
              }) || null
            );
          }
          return null;
        },
        findAndCount: async (options: any) => {
          let list = [...mockStorage[table]];
          if (options.where) {
            list = list.filter((x) => {
              return Object.entries(options.where).every(([k, v]) => x[k] === v);
            });
          }
          return [list, list.length];
        },
        find: async (options: any) => {
          let list = [...mockStorage[table]];
          if (options.where) {
            list = list.filter((x) => {
              return Object.entries(options.where).every(([k, v]) => x[k] === v);
            });
          }
          return list;
        },
        delete: async (id: string) => {
          mockStorage[table] = mockStorage[table].filter((x) => x.id !== id);
          return { affected: 1 };
        },
        createQueryBuilder: (alias: string) => {
          return {
            andWhere: function () {
              return this;
            },
            where: function () {
              return this;
            },
            skip: function () {
              return this;
            },
            take: function () {
              return this;
            },
            orderBy: function () {
              return this;
            },
            leftJoinAndSelect: function () {
              return this;
            },
            select: function () {
              return this;
            },
            addSelect: function () {
              return this;
            },
            groupBy: function () {
              return this;
            },
            getManyAndCount: async () => {
              return [mockStorage[table], mockStorage[table].length];
            },
            getRawMany: async () => {
              return [];
            },
            getRawOne: async () => {
              return { totalRegistered: '0', totalPass: '0', totalFail: '0' };
            },
            getOne: async () => {
              return mockStorage[table][0] || null;
            },
          };
        },
      };
    },
  };

  const controller = new TraceabilityAdapterController(mockDbService);

  // 3. Status Endpoint
  const statusRes = controller.getStatus();
  assert.strictEqual(statusRes.status, 'online');
  assert.strictEqual(statusRes.plugin, 'device-traceability');
  console.log('✓ Status endpoint verified');

  // 4. Create Order
  console.log('2. Verifying Order Creation...');
  const orderRes = await controller.createOrder({
    soNumber: 'SO/2026/01850',
    waNumber: 'WA/2026/00412',
    itemCode: 'WSLRW-ATH-11',
    connectivity: 'LoRaWAN',
    totalQuantity: 100,
    notes: 'Batch for smart city deployment',
    createdBy: 'engineer_tester',
  });

  assert.ok(orderRes.id, 'Created order should have an ID');
  assert.strictEqual(orderRes.soNumber, 'SO/2026/01850');
  assert.strictEqual(orderRes.waNumber, 'WA/2026/00412');
  assert.strictEqual(orderRes.connectivity, 'LoRaWAN');
  assert.strictEqual(orderRes.totalQuantity, 100);
  console.log('✓ Order created successfully');

  // Duplicate Order Check
  let duplicateThrew = false;
  try {
    await controller.createOrder({
      soNumber: 'SO/2026/01850',
      waNumber: 'WA/2026/00412',
      itemCode: 'WSLRW-ATH-11',
      totalQuantity: 50,
    });
  } catch (err) {
    duplicateThrew = err instanceof BadRequestException;
  }
  assert.ok(duplicateThrew, 'Duplicate order should throw BadRequestException');
  console.log('✓ Duplicate order constraint prevented');

  // 5. Batch Device Registration
  console.log('3. Verifying Batch Device Registration...');
  const batchRes = await controller.batchRegisterDevices(orderRes.id, {
    devices: [
      {
        serialNumber: 'SN202610220001',
        sku: 'WSLRW-ATH-11',
        fwVersion: 'v1.4.2_rev18',
        hwVersion: 'HW1.2',
        meVersion: 'ME1.0',
        devEui: '0018B20000000001',
        appEui: '0000000000000000',
        appKey: '0102030405060708090A0B0C0D0E0F10',
      },
      {
        serialNumber: 'SN202610220002',
        sku: 'WSLRW-ATH-11',
        fwVersion: 'v1.4.2_rev18',
        hwVersion: 'HW1.2',
        meVersion: 'ME1.0',
        devEui: '0018B20000000002',
        appEui: '0000000000000000',
        appKey: '0102030405060708090A0B0C0D0E0F11',
      },
    ],
  });

  assert.strictEqual(batchRes.success, true);
  assert.strictEqual(batchRes.enrolledCount, 2);
  assert.strictEqual(batchRes.devices[0].serialNumber, 'SN202610220001');
  assert.strictEqual(batchRes.devices[0].configStatus, 'PENDING');
  console.log('✓ Batch device registration verified');

  // In-batch duplicate check
  let dupeBatchThrew = false;
  try {
    await controller.batchRegisterDevices(orderRes.id, {
      devices: [
        { serialNumber: 'SN_DUP_1', sku: 'SKU1', fwVersion: 'v1' },
        { serialNumber: 'SN_DUP_1', sku: 'SKU1', fwVersion: 'v1' },
      ],
    });
  } catch (err) {
    dupeBatchThrew = err instanceof BadRequestException;
  }
  assert.ok(dupeBatchThrew, 'In-batch duplicate serial should throw BadRequestException');
  console.log('✓ In-batch duplicate check verified');

  // 6. Device Lookup
  console.log('4. Verifying Device Lookup...');
  const lookupRes = await controller.lookupDevice('SN202610220001');
  assert.strictEqual(lookupRes.serialNumber, 'SN202610220001');
  assert.strictEqual(lookupRes.sku, 'WSLRW-ATH-11');
  assert.strictEqual(lookupRes.devEui, '0018B20000000001');
  console.log('✓ Device lookup verified');

  // 7. Cross-System Linking (link Final Config session)
  console.log('5. Verifying Cross-system Link to Final Config Session...');
  const linkRes = await controller.linkFinalConfigSession({
    serialNumber: 'SN202610220001',
    finalConfigSessionId: 'mock-session-uuid-999',
    configStatus: 'CONFIGURED_PASS',
  });

  assert.strictEqual(linkRes.success, true);
  assert.strictEqual(linkRes.finalConfigSessionId, 'mock-session-uuid-999');
  assert.strictEqual(linkRes.configStatus, 'CONFIGURED_PASS');
  assert.strictEqual(linkRes.status, 'CONFIGURED');
  console.log('✓ Cross-system linking with Final Config session verified');

  // 8. Device Lifecycle
  console.log('6. Verifying Device Lifecycle Query...');
  const targetDevice = mockStorage['traceability_device'].find(
    (d) => d.serial_number === 'SN202610220001',
  );
  // Attach order relation mock for findOne
  targetDevice.order = mockStorage['traceability_order'].find((o) => o.id === targetDevice.order_id);

  // Insert mock session into mockStorage
  mockStorage['finalconfig_execution_session'].push({
    id: 'mock-session-uuid-999',
    profileId: 'mock-profile-1',
    status: 'COMPLETED',
    currentStep: 5,
    totalSteps: 5,
    passedSteps: 5,
    failedSteps: 0,
    startedAt: new Date(),
    completedAt: new Date(),
    errorMessage: null,
    profile: {
      id: 'mock-profile-1',
      sku: 'WSLRW-ATH-11',
      longFw: 'v1.4.2_rev18',
      shortFw: 'v1.4',
      connectivity: 'LoRaWAN',
    },
  });

  mockStorage['finalconfig_execution_log'].push({
    id: 'log-1',
    sessionId: 'mock-session-uuid-999',
    modbusRegisterDec: 100,
    modbusRegisterHex: '0x0064',
    action: 'WRITE',
    expectedValue: '0018B20000000001',
    writtenValue: '0018B20000000001',
    readValue: '0018B20000000001',
    rawHex: null,
    status: 'PASS',
    errorMessage: null,
    durationMs: 45,
    createdAt: new Date(),
  });

  const lifecycleRes = await controller.getDeviceLifecycle(targetDevice.id);
  assert.strictEqual(lifecycleRes.device.serialNumber, 'SN202610220001');
  assert.strictEqual(lifecycleRes.device.configStatus, 'CONFIGURED_PASS');
  assert.ok(lifecycleRes.finalConfig, 'Final config session should be populated');
  assert.strictEqual(lifecycleRes.finalConfig.sessionId, 'mock-session-uuid-999');
  assert.strictEqual(lifecycleRes.finalConfig.status, 'COMPLETED');
  assert.strictEqual(lifecycleRes.executionLogs.length, 1);
  assert.strictEqual(lifecycleRes.executionLogs[0].action, 'WRITE');
  console.log('✓ Full lifecycle tracing verified');

  console.log('\n>>> ALL TRACEABILITY TESTS PASSED SUCCESSFULLY! <<<');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
