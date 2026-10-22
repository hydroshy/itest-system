import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { FinalConfigProfileEntity } from '../src/backend/core-models/finalconfig-profile.entity';
import { FinalConfigRegisterEntity } from '../src/backend/core-models/finalconfig-register.entity';
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
  console.log('✓ Entity metadata and table-to-db routing verified');

  // 2. Controller Validation Tests (SO regex, connectivity, FAIL registers)
  console.log('2. Verifying Controller Validation & Logic...');
  const mockDbService: any = {
    getRepositoryForTable: (table: string, entityClass: any) => {
      return {};
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
              create: (d: any) => ({ id: 'mock-id-123', ...d }),
              save: async (d: any) => d,
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

  console.log('All tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
