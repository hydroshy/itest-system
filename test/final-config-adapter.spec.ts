import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { FinalConfigProfileEntity } from '../src/backend/core-models/finalconfig-profile.entity';
import { FinalConfigRegisterEntity } from '../src/backend/core-models/finalconfig-register.entity';
import {
  FinalConfigExecutionSessionEntity,
  FinalConfigSessionStatus,
} from '../src/backend/core-models/finalconfig-execution-session.entity';
import {
  FinalConfigExecutionLogEntity,
  FinalConfigExecutionAction,
  FinalConfigExecutionStatus,
} from '../src/backend/core-models/finalconfig-execution-log.entity';
import { FinalConfigAdapterController } from '../src/backend/plugins/final-config.adapter.controller';

async function runTests() {
  console.log('--- Starting FinalConfigAdapterController & Entity Verification ---');

  // 1. Entity Metadata & DB Routing
  console.log('1. Verifying FinalConfig Entities & DB Routing...');
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(FinalConfigProfileEntity),
    'FinalConfigProfileEntity must be registered in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(FinalConfigRegisterEntity),
    'FinalConfigRegisterEntity must be registered in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(FinalConfigExecutionSessionEntity),
    'FinalConfigExecutionSessionEntity must be registered in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(FinalConfigExecutionLogEntity),
    'FinalConfigExecutionLogEntity must be registered in ALL_DATABASE_ENTITIES',
  );

  const configPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(configPath), 'db-routing.config.json must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  assert.strictEqual(
    config.table_routes['finalconfig_profile'],
    'core_db',
    'finalconfig_profile must route to core_db',
  );
  assert.strictEqual(
    config.table_routes['finalconfig_regs'],
    'core_db',
    'finalconfig_regs must route to core_db',
  );
  assert.strictEqual(
    config.table_routes['finalconfig_execution_session'],
    'core_db',
    'finalconfig_execution_session must route to core_db',
  );
  assert.strictEqual(
    config.table_routes['finalconfig_execution_log'],
    'core_db',
    'finalconfig_execution_log must route to core_db',
  );
  console.log('✓ Entity metadata and table-to-db routing verified');

  // 2. Controller Validation Tests (SO regex, connectivity, FAIL registers)
  console.log('2. Verifying Controller Validation & Logic...');
  const mockStorage: Record<string, any[]> = {
    finalconfig_profile: [],
    finalconfig_regs: [],
    finalconfig_execution_session: [],
    finalconfig_execution_log: [],
  };

  const mockDbService: any = {
    getRepositoryForTable: (table: string, entityClass: any) => {
      return {
        create: (d: any) => ({ id: `mock-${Date.now()}-${Math.random()}`, ...d }),
        save: async (d: any) => {
          const list = mockStorage[table] || (mockStorage[table] = []);
          const existingIdx = list.findIndex((x) => x.id === d.id);
          if (existingIdx >= 0) {
            list[existingIdx] = { ...list[existingIdx], ...d };
            return list[existingIdx];
          } else {
            const item = { id: d.id || `mock-${Date.now()}-${Math.random()}`, ...d };
            list.push(item);
            return item;
          }
        },
        findOne: async ({ where }: any) => {
          const list = mockStorage[table] || [];
          return list.find((item) => {
            return Object.entries(where).every(([k, v]) => item[k] === v);
          }) || null;
        },
        find: async ({ where, order }: any = {}) => {
          let list = [...(mockStorage[table] || [])];
          if (where) {
            list = list.filter((item) =>
              Object.entries(where).every(([k, v]) => item[k] === v),
            );
          }
          return list;
        },
        count: async ({ where }: any = {}) => {
          let list = [...(mockStorage[table] || [])];
          if (where) {
            list = list.filter((item) =>
              Object.entries(where).every(([k, v]) => item[k] === v),
            );
          }
          return list.length;
        },
        remove: async (d: any) => {
          const list = mockStorage[table] || [];
          const idx = list.findIndex((x) => x.id === d.id);
          if (idx >= 0) list.splice(idx, 1);
          return d;
        },
      };
    },
    getDataSourceForTable: (table: string) => {
      return {
        createQueryRunner: () => ({
          connect: async () => {},
          startTransaction: async () => {},
          commitTransaction: async () => {},
          rollbackTransaction: async () => {},
          release: async () => {},
          manager: {
            getRepository: (cls: any) => ({
              create: (d: any) => ({ id: `mock-${Date.now()}-${Math.random()}`, ...d }),
              save: async (d: any) => {
                const tableName =
                  cls === FinalConfigProfileEntity
                    ? 'finalconfig_profile'
                    : 'finalconfig_regs';
                const list = mockStorage[tableName] || (mockStorage[tableName] = []);
                if (Array.isArray(d)) {
                  list.push(...d);
                  return d;
                }
                list.push(d);
                return d;
              },
            }),
          },
        }),
      };
    },
  };

  const controller = new FinalConfigAdapterController(mockDbService);

  // Status check
  const status = controller.getStatus();
  assert.strictEqual(status.status, 'online');
  assert.strictEqual(status.plugin, 'final-config');

  // Validate SO number format
  try {
    await controller.createProfile({
      soNumber: 'INVALID_SO',
      itemCode: 'ITEM-1',
      connectivity: 'LoRaWAN',
      sku: 'SKU-001',
      longFw: 'FW123',
      shortFw: 'F',
      registers: [{ modbusRegisterDec: 303, modbusRegisterHex: '0x012F', registerCount: 1, description: 'Test' }],
    });
    assert.fail('Should have failed for invalid SO_NUMBER');
  } catch (err: any) {
    assert.ok(err instanceof BadRequestException);
    assert.ok(err.message.includes('Invalid SO_NUMBER format'));
  }

  // Validate connectivity
  try {
    await controller.createProfile({
      soNumber: 'SO/2026/01850',
      itemCode: 'ITEM-1',
      connectivity: 'WiFi' as any,
      sku: 'SKU-001',
      longFw: 'FW123',
      shortFw: 'F',
      registers: [{ modbusRegisterDec: 303, modbusRegisterHex: '0x012F', registerCount: 1, description: 'Test' }],
    });
    assert.fail('Should have failed for invalid connectivity');
  } catch (err: any) {
    assert.ok(err instanceof BadRequestException);
    assert.ok(err.message.includes('connectivity must be either "LoRaWAN" or "Sigfox"'));
  }

  // Validate FAIL registers
  try {
    await controller.createProfile({
      soNumber: 'SO/2026/01850',
      itemCode: 'ITEM-1',
      connectivity: 'LoRaWAN',
      sku: 'SKU-001',
      longFw: 'FW123',
      shortFw: 'F',
      registers: [
        { modbusRegisterDec: 303, modbusRegisterHex: '0x012F', registerCount: 1, description: 'Reg 1', configCheck: 'FAIL', selected: true },
      ],
    });
    assert.fail('Should have failed for FAIL selected register');
  } catch (err: any) {
    assert.ok(err instanceof BadRequestException);
    assert.ok(err.message.includes('failed validation'));
  }

  // Success profile creation
  const created = await controller.createProfile({
    soNumber: 'SO/2026/01850',
    itemCode: 'ITEM-01',
    connectivity: 'LoRaWAN',
    sku: 'SKU-XYZ',
    longFw: 'FW-9.0.1',
    shortFw: '9',
    registers: [
      { modbusRegisterDec: 303, modbusRegisterHex: '0x012F', registerCount: 1, description: 'Reg 1', configCheck: 'PASS', selected: true },
      { modbusRegisterDec: 304, modbusRegisterHex: '0x0130', registerCount: 1, description: 'Reg Spare', configCheck: 'FAIL', selected: false },
    ],
  });

  assert.strictEqual(created.soNumber, 'SO/2026/01850');
  assert.strictEqual(created.connectivity, 'LoRaWAN');
  assert.strictEqual(created.registersCount, 2);
  console.log('✓ Validation and creation flow passed cleanly');

  // 3. Stateful Execution Sessions & Step Checkpoints
  console.log('3. Verifying Stateful Execution Session Lifecycle & Checkpoints...');
  const profileId = created.id;

  // Initialize session
  const sessionRes = await controller.createExecutionSession(profileId, {
    deviceId: 'DEV-1001',
    serialNumber: 'SN-ABC-001',
    metadata: { operator: 'Alice' },
  });
  assert.ok(sessionRes.session.id, 'Session should have an id');
  assert.strictEqual(sessionRes.session.profileId, profileId);
  assert.strictEqual(sessionRes.session.status, FinalConfigSessionStatus.IN_PROGRESS);
  assert.strictEqual(sessionRes.session.totalSteps, 1, 'Only selected registers count towards total steps');
  assert.strictEqual(sessionRes.session.currentStep, 0);

  const sessionId = sessionRes.session.id;

  // Step 1: Write Pass
  const step1Res = await controller.logExecutionStep(sessionId, {
    modbusRegisterDec: 303,
    modbusRegisterHex: '0x012F',
    action: 'WRITE',
    writeValue: '100',
    readValue: '100',
    status: 'PASS',
    durationMs: 45,
  });
  assert.strictEqual(step1Res.log.status, FinalConfigExecutionStatus.PASS);
  assert.strictEqual(step1Res.session.currentStep, 1);
  assert.strictEqual(step1Res.session.passedSteps, 1);
  assert.strictEqual(step1Res.session.failedSteps, 0);

  // Step 2: Failed Step Checkpoint
  const step2Res = await controller.logExecutionStep(sessionId, {
    modbusRegisterDec: 304,
    modbusRegisterHex: '0x0130',
    action: 'WRITE',
    writeValue: '50',
    status: 'FAIL',
    errorMessage: 'Modbus Timeout Error',
    durationMs: 120,
  });
  assert.strictEqual(step2Res.log.status, FinalConfigExecutionStatus.FAIL);
  assert.strictEqual(step2Res.session.currentStep, 2);
  assert.strictEqual(step2Res.session.passedSteps, 1);
  assert.strictEqual(step2Res.session.failedSteps, 1);

  // Fetch session & logs
  const sessionDetails = await controller.getExecutionSession(sessionId);
  assert.strictEqual(sessionDetails.session.id, sessionId);
  assert.strictEqual(sessionDetails.logs.length, 2);
  assert.strictEqual(sessionDetails.logs[0].modbusRegisterDec, 303);
  assert.strictEqual(sessionDetails.logs[1].modbusRegisterDec, 304);

  // Finalize session
  const finalRes = await controller.finalizeExecutionSession(sessionId, {
    status: 'COMPLETED',
    metadata: { note: 'Finished execution with 1 fail' },
  });
  assert.strictEqual(finalRes.session.status, FinalConfigSessionStatus.COMPLETED);
  assert.ok(finalRes.session.completedAt instanceof Date);
  console.log('✓ Stateful execution sessions and step checkpoints passed cleanly');

  console.log('All tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
