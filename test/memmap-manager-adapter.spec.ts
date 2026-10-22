import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { MemmapProfileEntity } from '../src/backend/core-models/memmap-profile.entity';
import { MemmapRegisterEntity } from '../src/backend/core-models/memmap-register.entity';
import { MemmapManagerAdapterController } from '../src/backend/plugins/memmap-manager.adapter.controller';
import { MemmapManagerService } from '../src/backend/plugins/memmap-manager-core';

async function runTests() {
  console.log('--- Starting MemmapManagerAdapterController & Subsystem Verification ---');

  // 1. Entity Metadata & Routing
  console.log('1. Verifying TypeORM Entity Metadata & DB Routing...');
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(MemmapProfileEntity),
    'MemmapProfileEntity must be registered in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(MemmapRegisterEntity),
    'MemmapRegisterEntity must be registered in ALL_DATABASE_ENTITIES',
  );

  const configPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(configPath), 'db-routing.config.json must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  assert.strictEqual(
    config.table_routes['memmap_profiles'],
    'core_db',
    'memmap_profiles must route to core_db',
  );
  assert.strictEqual(
    config.table_routes['memmap_registers'],
    'core_db',
    'memmap_registers must route to core_db',
  );
  console.log('✓ Entity metadata and table-to-db routing verified.');

  // 2. MemmapManagerService Core Functionality
  console.log('2. Verifying MemmapManagerService core parsing and validation...');
  const service = new MemmapManagerService();

  const jsonContent = JSON.stringify({
    name: 'Inverter Map',
    description: 'Solar Inverter registers',
    registers: [
      { address: 0, name: 'voltage', dataType: 'float32', scale: 0.1, unit: 'V', accessMode: 'read' },
      { address: 2, name: 'current', dataType: 'float32', scale: 0.01, unit: 'A', accessMode: 'read' },
    ],
  });

  const resJson = service.previewImport(jsonContent, 'json');
  assert.strictEqual(resJson.valid, true);
  assert.strictEqual(resJson.errors.length, 0);
  assert.strictEqual(resJson.registers.length, 2);
  assert.strictEqual(resJson.profile?.name, 'Inverter Map');

  const csvContent = `name,address,dataType,scale,unit,accessMode\nvoltage,100,uint16,1,V,read\nfrequency,101,uint16,0.01,Hz,read`;
  const resCsv = service.previewImport(csvContent, 'csv');
  assert.strictEqual(resCsv.valid, true);
  assert.strictEqual(resCsv.errors.length, 0);
  assert.strictEqual(resCsv.registers.length, 2);
  assert.strictEqual(resCsv.registers[0].name, 'voltage');
  assert.strictEqual(resCsv.registers[0].address, 100);
  assert.strictEqual(resCsv.registers[0].dataType, 'uint16');

  const invalidJson = JSON.stringify({
    name: 'Bad Map',
    registers: [
      { address: 10, name: 'reg1', dataType: 'int32', accessMode: 'read' },
      { address: 10, name: 'reg2', dataType: 'unknown_type', accessMode: 'write' },
    ],
  });
  const resInvalid = service.previewImport(invalidJson, 'json');
  assert.strictEqual(resInvalid.valid, false);
  assert.ok(resInvalid.errors.some((e) => e.field === 'address' && e.message.includes('Duplicate address')));
  assert.ok(resInvalid.errors.some((e) => e.field === 'dataType'));
  console.log('✓ Core preview and validation verified.');

  // 3. Controller API & Persistence
  console.log('3. Verifying MemmapManagerAdapterController API & Persistence...');
  let mockProfiles: any[] = [];
  let mockRegisters: any[] = [];

  const mockProfileRepo: any = {
    find: async () => mockProfiles,
    findOne: async ({ where }: any) => mockProfiles.find((p) => p.id === where.id),
    remove: async (entity: any) => {
      mockProfiles = mockProfiles.filter((p) => p.id !== entity.id);
      mockRegisters = mockRegisters.filter((r) => r.profileId !== entity.id);
    },
    create: (dto: any) => ({
      id: 'mock-prof-uuid-' + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...dto,
    }),
    save: async (entity: any) => {
      mockProfiles.push(entity);
      return entity;
    },
  };

  const mockRegisterRepo: any = {
    create: (dto: any) => ({
      id: 'mock-reg-uuid-' + Math.random(),
      createdAt: new Date(),
      ...dto,
    }),
    save: async (entities: any[]) => {
      mockRegisters.push(...entities);
      return entities;
    },
  };

  const mockDataSource: any = {
    transaction: async (cb: (manager: any) => Promise<any>) => {
      const manager = {
        getRepository: (target: any) => {
          if (target === MemmapProfileEntity) return mockProfileRepo;
          if (target === MemmapRegisterEntity) return mockRegisterRepo;
          throw new Error(`Unknown entity: ${target}`);
        },
      };
      return cb(manager);
    },
  };

  const mockDatabaseService: any = {
    getRepositoryForTable: (table: string, entity: any) => {
      if (entity === MemmapProfileEntity || table === 'memmap_profiles') return mockProfileRepo;
      if (entity === MemmapRegisterEntity || table === 'memmap_registers') return mockRegisterRepo;
      throw new Error(`Unknown table: ${table}`);
    },
    getDataSourceForTable: () => mockDataSource,
  };

  const controller = new MemmapManagerAdapterController(mockDatabaseService);

  // Status check
  const status = controller.getStatus();
  assert.strictEqual(status.plugin, 'memmap-manager');
  assert.strictEqual(status.enabled, true);

  // Excel rejection (415)
  const excelFile = {
    originalname: 'registers.xlsx',
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('mock excel binary'),
  };
  try {
    await controller.previewImport(excelFile);
    assert.fail('Expected HTTP 415');
  } catch (err: any) {
    assert.ok(err instanceof HttpException);
    assert.strictEqual(err.getStatus(), HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  }

  try {
    await controller.previewImport(undefined, { format: 'xlsx', content: 'dummy' });
    assert.fail('Expected HTTP 415');
  } catch (err: any) {
    assert.ok(err instanceof HttpException);
    assert.strictEqual(err.getStatus(), HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  }

  // JSON Preview
  const previewRes = await controller.previewImport(undefined, {
    profile: {
      name: 'Controller Map',
      registers: [{ address: 0, name: 'speed', dataType: 'uint16', accessMode: 'read' }],
    },
  });
  assert.strictEqual(previewRes.valid, true);
  assert.strictEqual(previewRes.registers.length, 1);
  assert.strictEqual(previewRes.registers[0].name, 'speed');

  // Import profile
  const importRes = await controller.importProfile(undefined, {
    sku: 'SKU-001',
    longFw: '5F0820',
    shortFw: '5',
    createdBy: 'admin',
    profile: {
      name: 'HVAC Profile',
      description: 'HVAC Registers',
      sourceFormat: 'json',
      registers: [
        { address: 100, name: 'targetTemp', dataType: 'float32', scale: 0.1, unit: 'C', accessMode: 'readwrite' },
        { address: 102, name: 'currentTemp', dataType: 'float32', scale: 0.1, unit: 'C', accessMode: 'read' },
      ],
    },
  });
  assert.strictEqual(importRes.success, true);
  assert.strictEqual(importRes.data.name, 'HVAC Profile');
  assert.strictEqual(importRes.data.registersCount, 2);
  assert.strictEqual(mockProfiles.length, 1);
  assert.strictEqual(mockRegisters.length, 2);
  assert.strictEqual(mockProfiles[0].sku, 'SKU-001');
  assert.strictEqual(mockProfiles[0].longFw, '5F0820');
  assert.strictEqual(mockProfiles[0].shortFw, '5');
  assert.strictEqual(mockProfiles[0].createdBy, 'admin');

  // Validation failure import
  try {
    await controller.importProfile(undefined, {
      profile: {
        name: '',
        registers: [],
      },
    });
    assert.fail('Expected BadRequestException');
  } catch (err: any) {
    assert.ok(err instanceof BadRequestException);
  }

  // Profiles list
  mockProfiles[0].registers = [...mockRegisters];
  const list = await controller.getProfiles();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].name, 'HVAC Profile');
  assert.strictEqual(list[0].registersCount, 2);
  assert.strictEqual(list[0].sku, 'SKU-001');
  assert.strictEqual(list[0].longFw, '5F0820');
  assert.strictEqual(list[0].shortFw, '5');
  assert.strictEqual(list[0].createdBy, 'admin');

  // Profile by id
  const profileDetails = await controller.getProfileById(mockProfiles[0].id);
  assert.strictEqual(profileDetails.name, 'HVAC Profile');
  assert.strictEqual(profileDetails.registersCount, 2);
  assert.strictEqual(profileDetails.registers[0].address, 100);
  assert.strictEqual(profileDetails.registers[1].address, 102);

  // Non-existent profile 404
  try {
    await controller.getProfileById('non-existent-id');
    assert.fail('Expected NotFoundException');
  } catch (err: any) {
    assert.ok(err instanceof NotFoundException);
  }

  // Delete profile
  const deleteRes = await controller.deleteProfile(mockProfiles[0].id);
  assert.strictEqual(deleteRes.success, true);
  assert.strictEqual(mockProfiles.length, 0);

  console.log('✓ MemmapManagerAdapterController API and persistence tests passed successfully!');
  console.log('\nALL MEMMAP VERIFICATION TESTS COMPLETED SUCCESSFULLY.');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
