import 'reflect-metadata';
import * as assert from 'assert';
import { DataSource } from 'typeorm';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { ItemCodeEntity } from '../src/modules/c-modules/item-codes/entities/item-code.entity';
import {
  sanitizeFirmwareVersion,
  formatSkuFw,
  isValidFirmwareVersion,
  isValidSkuFw,
  normalizeSoCode,
  isValidSoCode,
  SO_CODE_REGEX,
} from '../src/modules/c-modules/item-codes/item-code-utils';
import { ItemCodesService } from '../src/modules/c-modules/item-codes/item-codes.service';
import { SalesOrdersService } from '../src/modules/c-modules/sales-orders/sales-orders.service';
import { SalesOrderEntity, SalesOrderStatus, SalesOrderSource } from '../src/modules/c-modules/sales-orders/entities/sales-order.entity';
import { SalesOrderItemEntity, SalesOrderItemStatus } from '../src/modules/c-modules/sales-orders/entities/sales-order-item.entity';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING MASTER ITEM CODES BACKEND ENGINE TEST');
  console.log('====================================================\n');

  // Test 1: ALL_DATABASE_ENTITIES & TypeORM Metadata
  console.log('[Test 1] Verifying TypeORM ALL_DATABASE_ENTITIES & ItemCodeEntity metadata...');
  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  assert.ok(entityNames.includes('ItemCodeEntity'), 'ItemCodeEntity must be registered in ALL_DATABASE_ENTITIES');

  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const icMeta = ds.getMetadata(ItemCodeEntity);
  assert.strictEqual(icMeta.tableName, 'item_codes');
  assert.ok(icMeta.findColumnWithPropertyName('itemCode'), 'itemCode column must exist');
  assert.ok(icMeta.findColumnWithPropertyName('sku'), 'sku column must exist');
  assert.ok(icMeta.findColumnWithPropertyName('firmwareVersion'), 'firmwareVersion column must exist');
  assert.ok(icMeta.findColumnWithPropertyName('skuFw'), 'skuFw column must exist');
  assert.ok(icMeta.findColumnWithPropertyName('defaultTemplateId'), 'defaultTemplateId column must exist');
  assert.ok(icMeta.findColumnWithPropertyName('description'), 'description column must exist');
  assert.ok(icMeta.findColumnWithPropertyName('isActive'), 'isActive column must exist');
  assert.ok(icMeta.findColumnWithPropertyName('metadata'), 'metadata column must exist');

  const soItemMeta = ds.getMetadata(SalesOrderItemEntity);
  assert.ok(soItemMeta.findColumnWithPropertyName('itemCodeId'), 'sales_order_items.itemCodeId column must exist');

  console.log('  -> PASS: TypeORM tables, columns and relations verified.\n');

  // Test 2: SKU_FW & SO Code Standardization Utilities
  console.log('[Test 2] Verifying SKU_FW and SO Code formatting/validation utilities...');
  // sanitizeFirmwareVersion
  assert.strictEqual(sanitizeFirmwareVersion('v6'), '6', "Leading 'v' must be stripped");
  assert.strictEqual(sanitizeFirmwareVersion('V1.4'), '1.4', "Leading 'V' must be stripped");
  assert.strictEqual(sanitizeFirmwareVersion('vv2.0'), '2.0', "Multiple leading 'v's must be stripped");
  assert.strictEqual(sanitizeFirmwareVersion('1.0'), '1.0');
  assert.strictEqual(sanitizeFirmwareVersion(''), '1.0');
  assert.strictEqual(sanitizeFirmwareVersion(undefined), '1.0');

  // formatSkuFw
  assert.strictEqual(formatSkuFw('wslrw-ath', '6'), 'WSLRW-ATH_6', 'SKU must be capitalized and joined with FW');
  assert.strictEqual(formatSkuFw('WSLRW-ATH', 'v6'), 'WSLRW-ATH_6', "formatSkuFw must strip 'v' from firmware");
  assert.strictEqual(formatSkuFw('WSLRW-CLW', '1.4'), 'WSLRW-CLW_1.4');

  // isValidFirmwareVersion
  assert.strictEqual(isValidFirmwareVersion('6'), true);
  assert.strictEqual(isValidFirmwareVersion('1.4'), true);
  assert.strictEqual(isValidFirmwareVersion('2.0.1'), true);
  assert.strictEqual(isValidFirmwareVersion('v6'), false, "'v6' is invalid (must not have 'v')");
  assert.strictEqual(isValidFirmwareVersion('V1.4'), false);
  assert.strictEqual(isValidFirmwareVersion(''), false);

  // isValidSkuFw
  assert.strictEqual(isValidSkuFw('WSLRW-ATH_6'), true);
  assert.strictEqual(isValidSkuFw('WSLRW-CLW_1.4'), true);
  assert.strictEqual(isValidSkuFw('WSLRW-ATH_v6'), false);
  assert.strictEqual(isValidSkuFw('WSLRW-ATH'), false);

  // normalizeSoCode
  assert.strictEqual(normalizeSoCode('SO/2026/00001'), 'SO/2026/00001', 'Canonical format unchanged');
  assert.strictEqual(normalizeSoCode('SO-2026-001'), 'SO/2026/00001', 'SO-2026-001 converted to 5-digit padded canonical');
  assert.strictEqual(normalizeSoCode('SO-2026-42'), 'SO/2026/00042', 'SO-2026-42 converted to 5-digit padded canonical');
  assert.strictEqual(normalizeSoCode('SO0042'), 'SO/2026/00042', 'SO0042 converted to standard SO/2026/00042');
  assert.strictEqual(normalizeSoCode('SO-42'), 'SO/2026/00042', 'SO-42 converted to standard SO/2026/00042');

  // isValidSoCode
  assert.strictEqual(isValidSoCode('SO/2026/00001'), true);
  assert.strictEqual(isValidSoCode('SO/2026/BATCH_01'), true);
  assert.strictEqual(isValidSoCode('SO-2026-001'), false);
  assert.strictEqual(isValidSoCode('INVALID'), false);

  console.log('  -> PASS: All utility functions pass contracts.\n');

  // Test 3: ItemCodesService CRUD & Logic
  console.log('[Test 3] Verifying ItemCodesService CRUD and template auto-linking...');
  const fakeItemDb: {
    items: ItemCodeEntity[];
    templates: any[];
    soItems: any[];
  } = {
    items: [],
    templates: [
      {
        id: 'tt-ath-6',
        name: 'WSLRW-ATH Test Template FW 6',
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        isActive: true,
      },
      {
        id: 'tt-clw-14',
        name: 'WSLRW-CLW Test Template FW 1.4',
        sku: 'WSLRW-CLW',
        firmwareVersion: '1.4',
        isActive: true,
      },
    ],
    soItems: [],
  };

  const fakeItemRepo: any = {
    findByItemCode: async (itemCode: string) => {
      return (
        fakeItemDb.items.find(
          (it) => it.itemCode.toLowerCase() === itemCode.toLowerCase(),
        ) || null
      );
    },
    findById: async (id: string) => {
      return (
        fakeItemDb.items.find(
          (it) => it.id === id || it.itemCode.toLowerCase() === id.toLowerCase(),
        ) || null
      );
    },
    createItemCode: async (data: any) => {
      const created: ItemCodeEntity = {
        id: `ic-${fakeItemDb.items.length + 1}`,
        itemCode: data.itemCode,
        sku: data.sku,
        firmwareVersion: data.firmwareVersion,
        skuFw: data.skuFw,
        defaultTemplateId: data.defaultTemplateId,
        defaultTemplate: fakeItemDb.templates.find(
          (t) => t.id === data.defaultTemplateId,
        ),
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : true,
        metadata: data.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fakeItemDb.items.push(created);
      return created;
    },
    updateItemCode: async (id: string, data: any) => {
      const existing = fakeItemDb.items.find((it) => it.id === id);
      if (!existing) throw new Error('Not found');
      Object.assign(existing, data, { updatedAt: new Date() });
      if (data.defaultTemplateId) {
        existing.defaultTemplate = fakeItemDb.templates.find(
          (t) => t.id === data.defaultTemplateId,
        );
      }
      return existing;
    },
    deleteItemCode: async (id: string) => {
      const idx = fakeItemDb.items.findIndex((it) => it.id === id);
      if (idx >= 0) fakeItemDb.items.splice(idx, 1);
      return true;
    },
    countSalesOrderItems: async (id: string) => {
      return fakeItemDb.soItems.filter((soIt) => soIt.itemCodeId === id).length;
    },
    findMatchingTemplate: async (sku: string, fw: string) => {
      return (
        fakeItemDb.templates.find(
          (t) =>
            t.sku.toLowerCase() === sku.toLowerCase() &&
            t.firmwareVersion === fw &&
            t.isActive,
        ) || null
      );
    },
    findPickerItems: async (search?: string) => {
      return fakeItemDb.items
        .filter((it) => it.isActive)
        .map((it) => ({
          id: it.id,
          itemCode: it.itemCode,
          sku: it.sku,
          firmwareVersion: it.firmwareVersion,
          skuFw: it.skuFw,
          defaultTemplateId: it.defaultTemplateId,
          defaultTemplateName: it.defaultTemplate?.name,
          description: it.description,
        }));
    },
    findWithPagination: async (query: any) => {
      return {
        data: fakeItemDb.items,
        total: fakeItemDb.items.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    },
  };

  const itemService = new ItemCodesService(fakeItemRepo);

  // 3.1 Create Item with auto-sanitization & auto-link template
  const created1 = await itemService.create({
    itemCode: 'ITEM-WSLRW-ATH-01',
    sku: 'WSLRW-ATH',
    firmwareVersion: 'v6', // Test that 'v' prefix is sanitized
    description: 'Daviteq LoRaWAN ATH Sensor FW 6',
  });
  assert.strictEqual(created1.firmwareVersion, '6', "Firmware 'v6' must be sanitized to '6'");
  assert.strictEqual(created1.skuFw, 'WSLRW-ATH_6', 'Composite skuFw must be WSLRW-ATH_6');
  assert.strictEqual(
    created1.defaultTemplateId,
    'tt-ath-6',
    'Template must be auto-matched to tt-ath-6 based on SKU and FW 6',
  );
  console.log('  -> PASS: Created item code with auto-sanitized FW and auto-matched template.');

  // 3.2 Duplicate itemCode conflict
  try {
    await itemService.create({
      itemCode: 'ITEM-WSLRW-ATH-01',
      sku: 'WSLRW-ATH',
    });
    assert.fail('Should throw conflict exception for duplicate itemCode');
  } catch (err: any) {
    assert.ok(err.message.includes('already exists'), 'ConflictException expected');
  }
  console.log('  -> PASS: Duplicate itemCode correctly rejected with conflict exception.');

  // 3.3 Create second item
  const created2 = await itemService.create({
    itemCode: 'ITEM-WSLRW-CLW-01',
    sku: 'WSLRW-CLW',
    firmwareVersion: '1.4',
    description: 'Level Sensor',
  });
  assert.strictEqual(created2.skuFw, 'WSLRW-CLW_1.4');

  // 3.4 Picker Query
  const pickerList = await itemService.findPicker();
  assert.strictEqual(pickerList.length, 2);
  assert.strictEqual(pickerList[0].skuFw, 'WSLRW-ATH_6');
  assert.strictEqual(pickerList[0].defaultTemplateName, 'WSLRW-ATH Test Template FW 6');
  console.log('  -> PASS: Picker endpoint returns lightweight items with template names.');

  // 3.5 Delete safeguard when referenced by SO items
  fakeItemDb.soItems.push({
    id: 'so-line-1',
    itemCodeId: created1.id,
    itemCode: created1.itemCode,
  });
  try {
    await itemService.remove(created1.id);
    assert.fail('Should prevent deletion when itemCode is referenced by SO lines');
  } catch (err: any) {
    assert.ok(err.message.includes('referenced by 1 Sales Order line'), 'Safeguard message expected');
  }
  console.log('  -> PASS: Delete safeguard prevents removing catalog item in active use.\n');

  // Test 4: SalesOrdersService attachItems & catalog auto-population
  console.log('[Test 4] Verifying SalesOrdersService attachItems & catalog auto-population...');
  const fakeSoDb: {
    salesOrders: SalesOrderEntity[];
    items: SalesOrderItemEntity[];
  } = {
    salesOrders: [],
    items: [],
  };

  const fakeSoRepo: any = {
    findBySoCode: async (soCode: string) => {
      return fakeSoDb.salesOrders.find((so) => so.soCode === soCode) || null;
    },
    findById: async (id: string) => {
      return fakeSoDb.salesOrders.find((so) => so.id === id) || null;
    },
    findItemCodeById: fakeItemRepo.findById,
    findItemCodeByCode: fakeItemRepo.findByItemCode,
    findTemplateForSku: fakeItemRepo.findMatchingTemplate,
    createSalesOrder: async (soData: any, itemsData: any[] = []) => {
      const soId = `so-${fakeSoDb.salesOrders.length + 1}`;
      const items = itemsData.map((it, idx) => ({
        id: `so-it-${idx + 1}`,
        salesOrderId: soId,
        itemCodeId: it.itemCodeId,
        itemCode: it.itemCode,
        sku: it.sku,
        quantity: it.quantity || 1,
        firmwareVersion: it.firmwareVersion || '1.0',
        templateId: it.templateId,
        status: SalesOrderItemStatus.PENDING,
        testedQuantity: 0,
        passedQuantity: 0,
        failedQuantity: 0,
        metadata: it.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      const so: any = {
        id: soId,
        ...soData,
        items,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      fakeSoDb.salesOrders.push(so);
      return so;
    },
    attachItemsToSalesOrder: async (soId: string, itemsData: any[]) => {
      const so = fakeSoDb.salesOrders.find((s) => s.id === soId);
      if (!so) throw new Error('SO not found');
      for (const it of itemsData) {
        const existing = so.items.find((i) => i.itemCode.toLowerCase() === it.itemCode.toLowerCase());
        if (existing) {
          existing.quantity += it.quantity || 1;
        } else {
          so.items.push({
            id: `so-it-${so.items.length + 1}`,
            salesOrderId: soId,
            itemCodeId: it.itemCodeId,
            itemCode: it.itemCode,
            sku: it.sku,
            quantity: it.quantity || 1,
            firmwareVersion: it.firmwareVersion || '1.0',
            templateId: it.templateId,
            status: SalesOrderItemStatus.PENDING,
            testedQuantity: 0,
            passedQuantity: 0,
            failedQuantity: 0,
            metadata: it.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);
        }
      }
      return so;
    },
  };

  const soService = new SalesOrdersService(fakeSoRepo);

  // 4.1 Create SO with SO-2026-001 (normalized to SO/2026/00001)
  const newOrder = await soService.create({
    soCode: 'SO-2026-001',
    customer: 'VinFast Smart Plant',
    items: [
      {
        itemCodeId: created1.id,
        itemCode: created1.itemCode,
        quantity: 50,
      },
    ],
  });

  assert.strictEqual(newOrder.soCode, 'SO/2026/00001', 'Legacy SO-2026-001 must normalize to SO/2026/00001');
  assert.strictEqual(newOrder.items[0].sku, 'WSLRW-ATH', 'SKU must be auto-populated from catalog');
  assert.strictEqual(newOrder.items[0].firmwareVersion, '6', 'Firmware must be auto-populated from catalog');
  assert.strictEqual(newOrder.items[0].templateId, 'tt-ath-6', 'TemplateId must be auto-populated from catalog');
  assert.strictEqual(newOrder.items[0].itemCodeId, created1.id, 'itemCodeId reference must be preserved');
  console.log('  -> PASS: Created SO with auto-normalized soCode and catalog item auto-population.');

  // 4.2 Attach another item from catalog via attachItems
  const attachedOrder = await soService.attachItems(newOrder.id, {
    items: [
      {
        itemCode: 'ITEM-WSLRW-CLW-01',
        quantity: 20,
      },
    ],
  });

  assert.strictEqual(attachedOrder.items.length, 2);
  const clwItem = attachedOrder.items.find((i) => i.itemCode === 'ITEM-WSLRW-CLW-01');
  assert.ok(clwItem, 'Attached item must be present in SO');
  assert.strictEqual(clwItem!.sku, 'WSLRW-CLW', 'SKU auto-filled from catalog by itemCode');
  assert.strictEqual(clwItem!.firmwareVersion, '1.4', 'Firmware auto-filled from catalog by itemCode');
  assert.strictEqual(clwItem!.templateId, 'tt-clw-14', 'Template auto-filled from catalog');
  assert.strictEqual(clwItem!.quantity, 20);
  console.log('  -> PASS: attachItems successfully attached catalog item without manual typing.');

  console.log('\n====================================================');
  console.log('ALL ITEM CODES BACKEND ENGINE TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
