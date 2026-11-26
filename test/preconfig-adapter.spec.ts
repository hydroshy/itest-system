import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { PreconfigAdapterController } from '../src/backend/plugins/preconfig.adapter.controller';
import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { PreconfigProfileEntity } from '../src/backend/core-models/preconfig-profile.entity';
import { PreconfigRegisterEntity } from '../src/backend/core-models/preconfig-register.entity';

async function runTests() {
  console.log('--- Starting PreconfigAdapterController Verification ---');

  // 1. Entity Metadata & DB Routing
  console.log('1. Verifying Preconfig Entities & DB Routing...');
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(PreconfigProfileEntity),
    'PreconfigProfileEntity must be registered in ALL_DATABASE_ENTITIES',
  );
  assert.ok(
    ALL_DATABASE_ENTITIES.includes(PreconfigRegisterEntity),
    'PreconfigRegisterEntity must be registered in ALL_DATABASE_ENTITIES',
  );

  const configPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(configPath), 'db-routing.config.json must exist');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  assert.strictEqual(
    config.table_routes['preconfig_profile'],
    'core_db',
    'preconfig_profile must route to core_db',
  );
  assert.strictEqual(
    config.table_routes['preconfig_regs'],
    'core_db',
    'preconfig_regs must route to core_db',
  );
  console.log('✓ Entity metadata and table-to-db routing verified');

  // 2. Mock DB Service and Controller Validation
  console.log('2. Verifying Controller API & Validation...');
  const mockStorage: Record<string, any[]> = {
    traceability_so: [{ id: 'so-1', so_number: 'SO/2026/01850' }],
    traceability_wa: [
      { id: 'wa-1', so_id: 'so-1', wa_number: 'WA/2026/00001', item_code: 'ITEM-01' },
      { id: 'wa-2', so_id: 'so-1', wa_number: 'WA/2026/00001', item_code: 'ITEM-02' },
    ],
    traceability_device: [{ so_id: 'so-1', wa_id: 'wa-1', item_code: 'ITEM-01', fw_version: '5F1234' }],
    memmap_profiles: [{ id: 'map-1', itemCode: 'ITEM-01', fwVersion: '5F1234', sku: 'WSLRW-001', longFw: '5F1234', registers: [{ no: 1, address: 303, name: 'Reg 1', numRegisters: 1 }] }],
    preconfig_profile: [],
    preconfig_regs: [],
  };

  const mockDbService: any = {
    getRepositoryForTable: (table: string, entityClass: any) => {
      return {
        create: (d: any) => ({ id: `mock-${Date.now()}-${Math.random()}`, ...d }),
        save: async (d: any) => {
          const list = mockStorage[table] || (mockStorage[table] = []);
          if (Array.isArray(d)) {
            const saved = d.map((item) => ({ id: item.id || `mock-${Date.now()}-${Math.random()}`, ...item }));
            list.push(...saved);
            return saved;
          }
          const item = { id: d.id || `mock-${Date.now()}-${Math.random()}`, ...d };
          list.push(item);
          return item;
        },
        findOne: async ({ where }: any) => {
          const list = mockStorage[table] || [];
          return list.find((item) => {
            return Object.entries(where).every(([k, v]) => item[k] === v);
          });
        },
        find: async (opts?: any) => {
          let list = [...(mockStorage[table] || [])];
          if (opts?.where) {
            list = list.filter((item) => {
              return Object.entries(opts.where).every(([k, v]) => item[k] === v);
            });
          }
          return list;
        },
        delete: async (id: string) => {
          const list = mockStorage[table] || [];
          const idx = list.findIndex((x) => x.id === id);
          if (idx >= 0) list.splice(idx, 1);
          return { affected: 1 };
        },
        createQueryBuilder: (alias: string) => {
          let filters: any = {};
          let orderByCol = '';
          let orderDir = 'ASC';
          const qb: any = {
            leftJoinAndSelect: () => qb,
            where: (clause: string, params: any) => {
              Object.assign(filters, params);
              return qb;
            },
            andWhere: (clause: string, params: any) => {
              Object.assign(filters, params);
              return qb;
            },
            orderBy: (col: string, dir: string) => {
              orderByCol = col;
              orderDir = dir;
              return qb;
            },
            getOne: async () => {
              const list = mockStorage[table] || [];
              const found = list.find((item) => {
                if (filters.soNumber && item.soNumber !== filters.soNumber) return false;
                if (filters.itemCode && item.itemCode !== filters.itemCode) return false;
                return true;
              });
              if (!found) return null;
              return {
                ...found,
                registers: mockStorage['preconfig_regs']?.filter((r) => r.profileId === found.id) || [],
              };
            },
          };
          return qb;
        },
      };
    },
    getDataSourceForTable: (table: string) => {
      return {
        createQueryRunner: () => {
          return {
            connect: async () => {},
            startTransaction: async () => {},
            commitTransaction: async () => {},
            rollbackTransaction: async () => {},
            release: async () => {},
            manager: {
              getRepository: (entityClass: any) => {
                const tableName = entityClass === PreconfigProfileEntity ? 'preconfig_profile' : 'preconfig_regs';
                return mockDbService.getRepositoryForTable(tableName, entityClass);
              },
            },
          };
        },
      };
    },
  };

  const controller = new PreconfigAdapterController(mockDbService);

  // Status check
  const status = controller.getStatus();
  assert.strictEqual(status.status, 'online');
  assert.strictEqual(status.plugin, 'preconfig');
  console.log('✓ Status endpoint verified');

  // Options check
  const options = await controller.getCreateOptions('SO/2026/01850', 'WA/2026/00001');
  assert.deepStrictEqual(options.soNumbers, ['SO/2026/01850']);
  assert.deepStrictEqual(options.waNumbers, ['WA/2026/00001']);
  assert.deepStrictEqual(options.itemCodes, ['ITEM-01', 'ITEM-02']);
  console.log('✓ Options endpoint verified (all items for WA returned without duplicate WA numbers)');

  // Resolve check
  const resolved = await controller.resolveCreate('SO/2026/01850', 'WA/2026/00001', 'ITEM-01');
  assert.strictEqual(resolved.sku, 'WSLRW-001');
  assert.strictEqual(resolved.fwVersion, '5F1234');
  assert.strictEqual(resolved.connectivity, 'LoRaWAN');
  assert.strictEqual(resolved.registers.length, 1);
  console.log('✓ Resolve endpoint verified');

  // Create Profile check
  const created = await controller.createProfile({
    soNumber: 'SO/2026/01850',
    waNumber: 'WA/2026/00001',
    itemCode: 'ITEM-01',
    registers: [
      {
        rowNumber: 1,
        modbusRegisterDec: 303,
        modbusRegisterHex: '0x012F',
        registerCount: 1,
        description: 'Test Register',
        format: 'uint16',
        inputConfig: '100',
        configCheck: 'PASS',
        selected: true,
      },
    ],
  });
  assert.ok(created.id, 'Created profile must have an ID');
  assert.strictEqual(created.soNumber, 'SO/2026/01850');
  assert.strictEqual(created.registersCount, 1);
  console.log('✓ Profile creation verified');

  // Profile by device check (for Step 2 Write-Verify)
  const byDevice = await controller.getProfileByDevice('SO/2026/01850', 'WA/2026/00001', 'ITEM-01', '5F1234');
  assert.ok(byDevice, 'Profile by device must exist');
  assert.strictEqual(byDevice.registers.length, 1);
  assert.strictEqual(byDevice.registers[0].modbusRegisterDec, 303);
  console.log('✓ Profile by device lookup (Step 2 integration) verified');

  console.log('======================================================');
  console.log('ALL PRECONFIG ADAPTER TESTS PASSED CLEANLY (100%)!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
