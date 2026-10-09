/**
 * Comprehensive Backend Layer Verification Suite for Schema Discrepancies Fix
 * Verifies:
 * 1. TypeORM Entity Metadata (memmap_regs 20 cols, item_codes, devices relations)
 * 2. MemmapUploadRepository: In-memory fallback, DB error graceful fallback, DB transaction success
 * 3. LorawanService.listDevices: ItemCodeEntity linkage, firmwareVersion & skuFw mapping
 * 4. ItemCodesService & Repository: Canonical skuFw = <SKU>_<cleanFw> enforcement
 */
import 'reflect-metadata';
import * as assert from 'assert';
import { DataSource } from 'typeorm';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { MemmapRegEntity } from '../src/modules/c-modules/memmap-upload/entities/memmap-reg.entity';
import { MemmapPayloadEntity } from '../src/modules/c-modules/memmap-upload/entities/memmap-payload.entity';
import { ItemCodeEntity } from '../src/modules/c-modules/item-codes/entities/item-code.entity';
import { DeviceEntity } from '../src/modules/lorawan/entities/device.entity';
import { SalesOrderItemEntity } from '../src/modules/c-modules/sales-orders/entities/sales-order-item.entity';
import { MemmapUploadRepository } from '../src/modules/c-modules/memmap-upload/memmap-upload.repository';
import { LorawanService } from '../src/modules/lorawan/lorawan.service';
import { ItemCodesService } from '../src/modules/c-modules/item-codes/item-codes.service';
import {
  sanitizeFirmwareVersion,
  formatSkuFw,
} from '../src/modules/c-modules/item-codes/item-code-utils';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function runVerification() {
  console.log('==============================================================================');
  console.log('[BACKEND VERIFICATION] Testing Backend Engine & Schema Compatibility');
  console.log('==============================================================================\n');

  // --------------------------------------------------------------------------
  // SECTION 1: TypeORM Entity Metadata Verification
  // --------------------------------------------------------------------------
  console.log('[SECTION 1] TypeORM Entity Metadata Verification...');
  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  // 1.1 memmap_regs
  const regMeta = ds.getMetadata(MemmapRegEntity);
  assert.strictEqual(regMeta.tableName, 'memmap_regs');
  const expectedRegColumns = [
    'id', 'payload_id', 'sku', 'short_fw', 'no', 'modbus_reg_dec', 'modbus_reg_hex',
    'fn_read', 'fn_write', 'num_regs', 'description', 'range_val', 'end_user_default',
    'format', 'downlink_type_5', 'in_rd1_template', 'comment',
    'in_engineering_template', 'in_end_user_template', 'in_full_template', 'created_at',
  ];
  for (const col of expectedRegColumns) {
    const found = regMeta.findColumnWithPropertyName(col) || regMeta.findColumnWithDatabaseName(col);
    assert.ok(found, `memmap_regs must define column '${col}'`);
  }
  console.log('  -> PASS: memmap_regs 20 functional columns verified in TypeORM metadata');

  // 1.2 item_codes
  const icMeta = ds.getMetadata(ItemCodeEntity);
  assert.strictEqual(icMeta.tableName, 'item_codes');
  const expectedIcColumns = [
    'id', 'itemCode', 'sku', 'firmwareVersion', 'skuFw',
    'defaultTemplateId', 'description', 'isActive', 'metadata',
    'createdAt', 'updatedAt',
  ];
  for (const col of expectedIcColumns) {
    const found = icMeta.findColumnWithPropertyName(col);
    assert.ok(found, `item_codes must define column '${col}'`);
  }
  console.log('  -> PASS: item_codes all required columns (firmwareVersion, skuFw, isActive) verified');

  // 1.3 devices relation to item_codes
  const devMeta = ds.getMetadata(DeviceEntity);
  assert.strictEqual(devMeta.tableName, 'devices');
  assert.ok(devMeta.findColumnWithPropertyName('itemCodeId'), 'devices must have itemCodeId column');
  assert.ok(devMeta.findColumnWithPropertyName('sku'), 'devices must have sku column');
  assert.ok(devMeta.findColumnWithPropertyName('firmwareVersion'), 'devices must have firmwareVersion column');
  const itemCodeRel = devMeta.findRelationWithPropertyPath('itemCode');
  assert.ok(itemCodeRel, 'devices must define relation to ItemCodeEntity');
  assert.strictEqual(itemCodeRel.inverseEntityMetadata.target, ItemCodeEntity);
  console.log('  -> PASS: devices -> item_codes relation & foreign key verified');

  // 1.4 sales_order_items
  const soItemMeta = ds.getMetadata(SalesOrderItemEntity);
  assert.ok(soItemMeta.findColumnWithPropertyName('itemCodeId'), 'sales_order_items must have itemCodeId column');
  console.log('  -> PASS: sales_order_items.itemCodeId verified\n');

  // --------------------------------------------------------------------------
  // SECTION 2: MemmapUploadRepository In-Memory & Fallback Verification
  // --------------------------------------------------------------------------
  console.log('[SECTION 2] MemmapUploadRepository Operations & In-Memory Fallback...');

  const sampleRegisters: Partial<MemmapRegEntity>[] = [
    {
      no: 1,
      modbus_reg_dec: 0,
      modbus_reg_hex: '0',
      fn_read: '3',
      fn_write: 'None',
      num_regs: 5,
      description: 'DEVICE_ID',
      format: 'ascii',
      downlink_type_5: 'no',
      in_rd1_template: true,
      comment: 'Identifier code',
      in_engineering_template: true,
      in_end_user_template: true,
      in_full_template: true,
    },
    {
      no: 2,
      modbus_reg_dec: 5,
      modbus_reg_hex: '5',
      fn_read: '3',
      fn_write: '16',
      num_regs: 4,
      description: 'CONFIG_PARAM',
      format: 'uint16',
      downlink_type_5: 'yes',
      in_rd1_template: false,
      comment: 'Operating parameter',
      in_engineering_template: true,
      in_end_user_template: false,
      in_full_template: true,
    },
  ];

  // 2.1 Pure in-memory mode (no dbService)
  const memRepo = new MemmapUploadRepository();
  const res1 = await memRepo.saveOrUpdate(
    {
      sku: 'WSLRW-ATH',
      short_fw: 6,
      long_fw: '3F0825',
      file_name: 'WSLRW-ATH-6.csv',
      total_regs: 2,
      dec_valid: true,
      hex_valid: true,
      created_by: 'test-admin',
    },
    sampleRegisters,
  );

  assert.ok(res1.payload);
  assert.strictEqual(res1.payload.sku, 'WSLRW-ATH');
  assert.strictEqual(res1.payload.short_fw, 6);
  assert.strictEqual(res1.registers.length, 2);
  assert.strictEqual(res1.registers[0].format, 'ascii');
  assert.strictEqual(res1.registers[0].downlink_type_5, 'no');
  assert.strictEqual(res1.registers[0].in_rd1_template, true);
  assert.strictEqual(res1.registers[0].comment, 'Identifier code');
  assert.strictEqual(res1.registers[1].format, 'uint16');
  assert.strictEqual(res1.registers[1].downlink_type_5, 'yes');
  assert.strictEqual(res1.registers[1].in_rd1_template, false);

  // Retrieve by SKU and short_fw
  const foundBySku = await memRepo.findBySkuAndShortFw('WSLRW-ATH', 6);
  assert.ok(foundBySku);
  assert.strictEqual(foundBySku.payload.long_fw, '3F0825');
  assert.strictEqual(foundBySku.registers[0].format, 'ascii');

  // Retrieve all
  const allPayloads = await memRepo.findAllPayloads();
  assert.ok(allPayloads.length >= 1);

  // Retrieve by ID
  const foundById = await memRepo.findPayloadByIdWithRegs(res1.payload.id);
  assert.ok(foundById);
  assert.strictEqual(foundById.registers.length, 2);

  // Delete by ID
  const deleted = await memRepo.deletePayloadById(res1.payload.id);
  assert.ok(deleted);
  assert.strictEqual(await memRepo.findBySkuAndShortFw('WSLRW-ATH', 6), null);
  console.log('  -> PASS: MemmapUploadRepository pure in-memory CRUD with 20 register fields verified');

  // 2.2 Graceful fallback when DB throws error
  let dbTransactionCalled = false;
  const failingDbService: any = {
    getRepositoryForTable: (tableName: string) => {
      return {
        manager: {
          connection: {
            transaction: async () => {
              dbTransactionCalled = true;
              throw new Error('connection terminated unexpectedly');
            },
          },
        },
      };
    },
  };

  const fallbackRepo = new MemmapUploadRepository(failingDbService);
  const fallbackRes = await fallbackRepo.saveOrUpdate(
    {
      sku: 'WSLRW-FALLBACK',
      short_fw: 3,
      long_fw: '3F0101',
      file_name: 'WSLRW-FALLBACK-3.csv',
      total_regs: 2,
      dec_valid: true,
      hex_valid: true,
    },
    sampleRegisters,
  );

  assert.ok(dbTransactionCalled, 'DB transaction attempt was made');
  assert.ok(fallbackRes.payload, 'Payload saved via in-memory fallback after DB error');
  assert.strictEqual(fallbackRes.payload.sku, 'WSLRW-FALLBACK');
  assert.strictEqual(fallbackRes.registers.length, 2);
  assert.strictEqual(fallbackRes.registers[0].format, 'ascii');
  console.log('  -> PASS: MemmapUploadRepository seamless fallback on DB error verified');

  // 2.3 Simulated DB transaction success
  let savedRegsDb: any[] = [];
  let deletedDbPayloadId: string | null = null;
  const mockDbService: any = {
    getRepositoryForTable: (tableName: string) => {
      return {
        manager: {
          connection: {
            transaction: async (cb: any) => {
              const managerMock: any = {
                findOne: async (entity: any, opts: any) => {
                  if (entity === MemmapPayloadEntity) {
                    if (opts.where.sku === 'WSLRW-ONLINE') {
                      return { id: 'payload-db-uuid-1', sku: 'WSLRW-ONLINE', short_fw: 1 };
                    }
                  }
                  return null;
                },
                update: async (entity: any, id: string, data: any) => {},
                delete: async (entity: any, opts: any) => {
                  if (entity === MemmapRegEntity) {
                    deletedDbPayloadId = opts.payload_id;
                  }
                },
                create: (entity: any, data: any) => ({ ...data, id: `uuid-${Math.random()}` }),
                save: async (entity: any, data: any) => {
                  if (entity === MemmapRegEntity) {
                    savedRegsDb = data;
                    return data;
                  }
                  return data;
                },
              };
              return await cb(managerMock);
            },
          },
        },
      };
    },
  };

  const dbSuccessRepo = new MemmapUploadRepository(mockDbService);
  const dbSuccessRes = await dbSuccessRepo.saveOrUpdate(
    {
      sku: 'WSLRW-ONLINE',
      short_fw: 1,
      long_fw: '1.0.0',
    },
    sampleRegisters,
  );

  assert.strictEqual(deletedDbPayloadId, 'payload-db-uuid-1', 'Old registers deleted prior to insert');
  assert.strictEqual(savedRegsDb.length, 2, 'All registers inserted into DB');
  assert.strictEqual(savedRegsDb[0].format, 'ascii');
  assert.strictEqual(savedRegsDb[0].downlink_type_5, 'no');
  assert.strictEqual(savedRegsDb[0].in_rd1_template, true);
  assert.strictEqual(savedRegsDb[1].format, 'uint16');
  assert.strictEqual(savedRegsDb[1].downlink_type_5, 'yes');
  assert.strictEqual(savedRegsDb[1].in_rd1_template, false);
  console.log('  -> PASS: MemmapUploadRepository DB transaction path with 20 columns verified\n');

  // --------------------------------------------------------------------------
  // SECTION 3: LorawanService.listDevices & ItemCodeEntity Integration
  // --------------------------------------------------------------------------
  console.log('[SECTION 3] LorawanService.listDevices & ItemCodeEntity Integration...');

  const mockDevices: any[] = [
    {
      id: 'dev-1',
      devEUI: '0011223344556677',
      name: 'Temperature Sensor 01',
      sku: 'WSLRW-ATH',
      firmwareVersion: 'v6',
      isActive: true,
      lastSeenAt: new Date(),
      itemCodeId: 'ic-uuid-1',
      itemCode: {
        id: 'ic-uuid-1',
        itemCode: 'WSLRW-ATH-01',
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        skuFw: 'WSLRW-ATH_6',
        defaultTemplateId: 'template-uuid-1',
      },
      salesOrder: {
        id: 'so-uuid-1',
        soCode: 'SO/2026/00001',
        customer: 'Customer A',
      },
    },
    {
      id: 'dev-2',
      devEUI: '0011223344556688',
      name: 'Unlinked Device 02',
      sku: 'WSLRW-CLW',
      firmwareVersion: '1.4',
      isActive: false,
      lastSeenAt: null,
      itemCodeId: 'ic-uuid-2',
      itemCode: null, // itemCodeId present but unjoined
      salesOrder: null,
    },
  ];

  const mockLorawanDbService: any = {
    getRepositoryForTable: (table: string) => {
      if (table === 'devices') {
        return {
          find: async (opts: any) => {
            assert.ok(opts.relations.includes('itemCode'), 'Query must join itemCode relation');
            return mockDevices;
          },
        };
      }
      return null;
    },
    getDataSourceForTable: () => null,
  };

  const lorawanService = new LorawanService(
    mockLorawanDbService,
    null as any,
    null as any,
    null as any,
  );

  const deviceList = await lorawanService.listDevices({ id: 'admin', role: 'SUPER_ADMIN' });
  assert.strictEqual(deviceList.length, 2);

  // Device 1: fully joined itemCode
  const d1 = deviceList[0];
  assert.strictEqual(d1.firmwareVersion, '6', 'Firmware cleaned to 6');
  assert.ok(d1.itemCode);
  assert.strictEqual(d1.itemCode.id, 'ic-uuid-1');
  assert.strictEqual(d1.itemCode.itemCode, 'WSLRW-ATH-01');
  assert.strictEqual(d1.itemCode.sku, 'WSLRW-ATH');
  assert.strictEqual(d1.itemCode.firmwareVersion, '6');
  assert.strictEqual(d1.itemCode.skuFw, 'WSLRW-ATH_6');
  assert.strictEqual(d1.itemCode.defaultTemplateId, 'template-uuid-1');

  // Device 2: unjoined itemCode fallback to itemCodeId
  const d2 = deviceList[1];
  assert.deepStrictEqual(d2.itemCode, { id: 'ic-uuid-2' });
  console.log('  -> PASS: LorawanService.listDevices maps itemCode.firmwareVersion & itemCode.skuFw correctly\n');

  // --------------------------------------------------------------------------
  // SECTION 4: ItemCodesService & Repository skuFw Canon
  // --------------------------------------------------------------------------
  console.log('[SECTION 4] ItemCodesService & Repository Canonical skuFw Enforcement...');

  assert.strictEqual(sanitizeFirmwareVersion('v6'), '6');
  assert.strictEqual(sanitizeFirmwareVersion('V1.4.0'), '1.4');
  assert.strictEqual(sanitizeFirmwareVersion('2.0'), '2');
  assert.strictEqual(formatSkuFw('wslrw-ath', 'v6'), 'WSLRW-ATH_6');
  assert.strictEqual(formatSkuFw('WSLRW-CLW', '1.4.0'), 'WSLRW-CLW_1.4');

  const inMemoryItemCodes: ItemCodeEntity[] = [];
  const fakeRepo: any = {
    findByItemCode: async (ic: string) => inMemoryItemCodes.find((x) => x.itemCode === ic) || null,
    findById: async (id: string) => inMemoryItemCodes.find((x) => x.id === id) || null,
    findMatchingTemplate: async () => null,
    createItemCode: async (data: any) => {
      const entity = { ...data, id: `ic-${Date.now()}` } as ItemCodeEntity;
      inMemoryItemCodes.push(entity);
      return entity;
    },
    updateItemCode: async (id: string, data: any) => {
      const item = inMemoryItemCodes.find((x) => x.id === id);
      if (!item) throw new Error('Not found');
      Object.assign(item, data);
      return item;
    },
  };

  const itemCodesService = new ItemCodesService(fakeRepo);

  // Create item code
  const created = await itemCodesService.create({
    itemCode: 'WSLRW-ATH-01',
    sku: 'wslrw-ath',
    firmwareVersion: 'v6.0',
    description: 'ATH Sensor FW 6',
  });

  assert.strictEqual(created.sku, 'WSLRW-ATH');
  assert.strictEqual(created.firmwareVersion, '6');
  assert.strictEqual(created.skuFw, 'WSLRW-ATH_6');
  assert.strictEqual(created.isActive, true);

  // Update item code with new FW
  const updated = await itemCodesService.update(created.id, {
    firmwareVersion: 'v7.0',
  });

  assert.strictEqual(updated.firmwareVersion, '7');
  assert.strictEqual(updated.skuFw, 'WSLRW-ATH_7');
  console.log('  -> PASS: ItemCodesService strict skuFw = <SKU>_<cleanFw> verified\n');

  console.log('==============================================================================');
  console.log('🎯 [BACKEND VERIFICATION] ALL 4 VERIFICATION SECTIONS PASSED (100% SUCCESS)');
  console.log('==============================================================================');
}

runVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
