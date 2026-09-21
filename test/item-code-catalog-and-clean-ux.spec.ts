import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
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

async function runScenario1() {
  console.log('--- SCENARIO 1: Master Item Code Catalog CRUD & DDL Schema ---');

  // 1.1 Verify 06_create_item_code_catalog.sql
  const ddlPath = path.resolve(__dirname, '../../deploy/database/updates/06_create_item_code_catalog.sql');
  assert.ok(fs.existsSync(ddlPath), 'deploy/database/updates/06_create_item_code_catalog.sql must exist');
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');
  assert.ok(ddlContent.includes('CREATE TABLE IF NOT EXISTS "item_codes"'), 'DDL must create item_codes table idempotently');
  assert.ok(ddlContent.includes('itemCodeId'), 'DDL must add itemCodeId to sales_order_items');
  assert.ok(ddlContent.includes('UQ_item_codes_itemCode'), 'DDL must declare unique constraint on itemCode');
  assert.ok(ddlContent.includes("REGEXP_REPLACE(\"firmwareVersion\", '^[vV]+', '')"), "DDL must sanitize 'v' prefix in existing data");
  assert.ok(ddlContent.includes('WSLRW-ATH_6'), 'DDL must seed WSLRW-ATH_6');
  console.log('  [PASS] 1.1: DDL script exists with idempotent table, FK column, constraints and seed data');

  // 1.2 Verify db-routing.config.json
  const routingPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(routingPath), 'db-routing.config.json must exist');
  const routingJson = JSON.parse(fs.readFileSync(routingPath, 'utf8'));
  assert.strictEqual(routingJson.table_routes['item_codes'], 'core_db', 'item_codes must route to core_db');
  console.log('  [PASS] 1.2: Database routing configuration maps item_codes to core_db');

  // 1.3 Verify TypeORM ItemCodeEntity metadata
  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  assert.ok(entityNames.includes('ItemCodeEntity'), 'ItemCodeEntity must be in ALL_DATABASE_ENTITIES');

  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const icMeta = ds.getMetadata(ItemCodeEntity);
  assert.strictEqual(icMeta.tableName, 'item_codes');
  assert.ok(icMeta.findColumnWithPropertyName('itemCode'));
  assert.ok(icMeta.findColumnWithPropertyName('sku'));
  assert.ok(icMeta.findColumnWithPropertyName('firmwareVersion'));
  assert.ok(icMeta.findColumnWithPropertyName('skuFw'));
  assert.ok(icMeta.findColumnWithPropertyName('defaultTemplateId'));
  assert.ok(icMeta.findColumnWithPropertyName('description'));
  assert.ok(icMeta.findColumnWithPropertyName('isActive'));
  assert.ok(icMeta.findColumnWithPropertyName('metadata'));

  const soItemMeta = ds.getMetadata(SalesOrderItemEntity);
  assert.ok(soItemMeta.findColumnWithPropertyName('itemCodeId'), 'SalesOrderItemEntity must have itemCodeId column');
  console.log('  [PASS] 1.3: TypeORM Entity metadata matches specifications');

  // 1.4 In-Memory CRUD verification of ItemCodesService using ItemCodesRepository interface
  const fakeItemDb: {
    items: ItemCodeEntity[];
    templates: any[];
    soItems: any[];
  } = {
    items: [],
    templates: [
      {
        id: 'tmpl-ath-6',
        name: 'WSLRW-ATH Test Template FW 6',
        sku: 'WSLRW-ATH',
        firmwareVersion: '6',
        isActive: true,
      },
    ],
    soItems: [],
  };

  const mockItemCodesRepo: any = {
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
      let filtered = fakeItemDb.items.filter((it) => it.isActive);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (it) =>
            it.itemCode.toLowerCase().includes(s) ||
            it.sku.toLowerCase().includes(s) ||
            it.skuFw.toLowerCase().includes(s),
        );
      }
      return filtered.map((it) => ({
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
    findWithPagination: async () => {
      return {
        data: fakeItemDb.items,
        total: fakeItemDb.items.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    },
  };

  const itemCodesService = new ItemCodesService(mockItemCodesRepo);

  // CREATE
  const created = await itemCodesService.create({
    itemCode: 'ITEM-WSLRW-ATH-01',
    sku: 'WSLRW-ATH',
    firmwareVersion: 'v6', // Test auto-sanitization
    description: 'Industrial LoRaWAN Temperature & Humidity Sensor',
  });
  assert.strictEqual(created.firmwareVersion, '6', "Firmware 'v6' must be sanitized to '6'");
  assert.strictEqual(created.skuFw, 'WSLRW-ATH_6', "SKU_FW must be formatted as 'WSLRW-ATH_6'");
  assert.strictEqual(created.defaultTemplateId, 'tmpl-ath-6', 'Template auto-matched by SKU and FW 6');

  // READ (findOne)
  const found = await itemCodesService.findOne(created.id);
  assert.strictEqual(found.itemCode, 'ITEM-WSLRW-ATH-01');

  // UPDATE
  const updated = await itemCodesService.update(created.id, {
    description: 'Updated sensor description',
    firmwareVersion: 'V6.1', // Another sanitize check
  });
  assert.strictEqual(updated.description, 'Updated sensor description');
  assert.strictEqual(updated.firmwareVersion, '6.1');
  assert.strictEqual(updated.skuFw, 'WSLRW-ATH_6.1');

  // DELETE
  const deleted = await itemCodesService.remove(created.id);
  assert.strictEqual(deleted.success, true);
  await assert.rejects(async () => {
    await itemCodesService.findOne(created.id);
  }, /not found/i);

  console.log('  [PASS] 1.4: ItemCodesService CRUD and auto-match logic validated\n');
}

async function runScenario2() {
  console.log('--- SCENARIO 2: SKU_FW Standardization & Validation ---');

  // 2.1 sanitizeFirmwareVersion
  assert.strictEqual(sanitizeFirmwareVersion('v6'), '6');
  assert.strictEqual(sanitizeFirmwareVersion('V6'), '6');
  assert.strictEqual(sanitizeFirmwareVersion('v1.4'), '1.4');
  assert.strictEqual(sanitizeFirmwareVersion('V1.4.2'), '1.4.2');
  assert.strictEqual(sanitizeFirmwareVersion('vvv2.0'), '2');
  assert.strictEqual(sanitizeFirmwareVersion('6'), '6');
  assert.strictEqual(sanitizeFirmwareVersion(''), '1');
  assert.strictEqual(sanitizeFirmwareVersion(undefined), '1');
  console.log('  [PASS] 2.1: sanitizeFirmwareVersion strips leading v/V, trailing .0, and defaults to 1');

  // 2.2 formatSkuFw
  assert.strictEqual(formatSkuFw('wslrw-ath', '6'), 'WSLRW-ATH_6');
  assert.strictEqual(formatSkuFw('WSLRW-ATH', 'v6'), 'WSLRW-ATH_6');
  assert.strictEqual(formatSkuFw('WSLRW-CLW', '1.4'), 'WSLRW-CLW_1.4');
  assert.strictEqual(formatSkuFw('wslrw-clw', 'V1.4'), 'WSLRW-CLW_1.4');
  console.log('  [PASS] 2.2: formatSkuFw standardizes SKU_FW uppercase and joins with clean FW');

  // 2.3 isValidFirmwareVersion & isValidSkuFw
  assert.strictEqual(isValidFirmwareVersion('6'), true);
  assert.strictEqual(isValidFirmwareVersion('1.4'), true);
  assert.strictEqual(isValidFirmwareVersion('2.0.1'), true);
  assert.strictEqual(isValidFirmwareVersion('v6'), false);
  assert.strictEqual(isValidFirmwareVersion('V1.4'), false);
  assert.strictEqual(isValidFirmwareVersion(''), false);

  assert.strictEqual(isValidSkuFw('WSLRW-ATH_6'), true);
  assert.strictEqual(isValidSkuFw('WSLRW-CLW_1.4'), true);
  assert.strictEqual(isValidSkuFw('WSLRW-ATH_v6'), false);
  assert.strictEqual(isValidSkuFw('wslrw-ath_6'), false);
  assert.strictEqual(isValidSkuFw('WSLRW-ATH'), false);
  console.log('  [PASS] 2.3: Validation checks strictly reject versions with "v" prefix\n');
}

async function runScenario3() {
  console.log('--- SCENARIO 3: Sales Order Code Standardization (SO/2026/xxxxx) ---');

  // 3.1 Canonical format and regex validation
  assert.strictEqual(isValidSoCode('SO/2026/00001'), true);
  assert.strictEqual(isValidSoCode('SO/2026/00042'), true);
  assert.strictEqual(isValidSoCode('SO/2026/BATCH_01'), true);
  assert.strictEqual(isValidSoCode('SO/2025/12345'), true);
  assert.strictEqual(isValidSoCode('SO-2026-001'), false);
  assert.strictEqual(isValidSoCode('SO0042'), false);
  assert.strictEqual(isValidSoCode('SO/26/00001'), false);
  console.log('  [PASS] 3.1: Canonical regex ^SO/\\d{4}/[A-Za-z0-9_-]+$ enforces SO/YYYY/xxxxx');

  // 3.2 normalizeSoCode converter
  assert.strictEqual(normalizeSoCode('SO/2026/00001'), 'SO/2026/00001');
  assert.strictEqual(normalizeSoCode('so/2026/00001'), 'SO/2026/00001');
  assert.strictEqual(normalizeSoCode('SO-2026-001'), 'SO/2026/00001');
  assert.strictEqual(normalizeSoCode('SO-2026-42'), 'SO/2026/00042');
  assert.strictEqual(normalizeSoCode('SO0042'), 'SO/2026/00042');
  assert.strictEqual(normalizeSoCode('SO-42'), 'SO/2026/00042');
  console.log('  [PASS] 3.2: normalizeSoCode accurately converts legacy and unpadded SO codes\n');
}

async function runScenario4() {
  console.log('--- SCENARIO 4: Item Code Selection & Attach to Sales Order ---');

  const catalogList: ItemCodeEntity[] = [
    {
      id: 'cat-ath-01',
      itemCode: 'ITEM-WSLRW-ATH-01',
      sku: 'WSLRW-ATH',
      firmwareVersion: '6',
      skuFw: 'WSLRW-ATH_6',
      defaultTemplateId: 'tmpl-ath-temp-hum',
      defaultTemplate: { name: 'WSLRW-ATH Standard Template' } as any,
      description: 'Industrial LoRaWAN Temperature & Humidity Sensor',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ItemCodeEntity,
    {
      id: 'cat-clw-01',
      itemCode: 'ITEM-WSLRW-CLW-01',
      sku: 'WSLRW-CLW',
      firmwareVersion: '1.4',
      skuFw: 'WSLRW-CLW_1.4',
      defaultTemplateId: 'tmpl-clw-press',
      defaultTemplate: { name: 'WSLRW-CLW Standard Template' } as any,
      description: 'Industrial LoRaWAN Liquid Level & Pressure Sensor',
      isActive: true,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ItemCodeEntity,
    {
      id: 'cat-inactive',
      itemCode: 'ITEM-OBSOLETE-01',
      sku: 'OBSOLETE',
      firmwareVersion: '1.0',
      skuFw: 'OBSOLETE_1.0',
      defaultTemplateId: null,
      description: 'Obsolete sensor',
      isActive: false,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ItemCodeEntity,
  ];

  const mockItemCodesRepo: any = {
    findPickerItems: async (search?: string) => {
      let filtered = catalogList.filter((it) => it.isActive);
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (it) =>
            it.itemCode.toLowerCase().includes(s) ||
            it.sku.toLowerCase().includes(s) ||
            it.skuFw.toLowerCase().includes(s),
        );
      }
      return filtered.map((it) => ({
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
    findById: async (id: string) => {
      return catalogList.find((x) => x.id === id || x.itemCode.toLowerCase() === id.toLowerCase()) || null;
    },
    findByItemCode: async (code: string) => {
      return catalogList.find((x) => x.itemCode.toLowerCase() === code.toLowerCase()) || null;
    },
  };

  const itemCodesService = new ItemCodesService(mockItemCodesRepo);

  // 4.1 Picker API Test
  const pickerItems = await itemCodesService.findPicker('ATH');
  assert.strictEqual(pickerItems.length, 1);
  assert.strictEqual(pickerItems[0].itemCode, 'ITEM-WSLRW-ATH-01');
  assert.strictEqual(pickerItems[0].skuFw, 'WSLRW-ATH_6');
  assert.strictEqual(pickerItems[0].firmwareVersion, '6');
  assert.strictEqual(pickerItems[0].defaultTemplateId, 'tmpl-ath-temp-hum');

  const allActivePicker = await itemCodesService.findPicker();
  assert.strictEqual(allActivePicker.length, 2, 'Picker must only return active items');
  console.log('  [PASS] 4.1: Picker API returns active items with SKU_FW and defaultTemplateId');

  // 4.2 Attach Items to Sales Order Test
  const fakeSoDb: {
    salesOrders: SalesOrderEntity[];
    items: SalesOrderItemEntity[];
  } = {
    salesOrders: [],
    items: [],
  };

  const mockSoRepo: any = {
    findBySoCode: async (soCode: string) => {
      return fakeSoDb.salesOrders.find((so) => so.soCode === soCode) || null;
    },
    findById: async (id: string) => {
      return fakeSoDb.salesOrders.find((so) => so.id === id) || null;
    },
    findItemCodeById: mockItemCodesRepo.findById,
    findItemCodeByCode: mockItemCodesRepo.findByItemCode,
    findTemplateForSku: async () => null,
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

  const soService = new SalesOrdersService(mockSoRepo);

  // Create SO with auto-normalized soCode & itemCode snapshot
  const createdSo = await soService.create({
    soCode: 'SO-2026-001',
    customer: 'VinFast Smart Plant',
    items: [
      {
        itemCodeId: 'cat-ath-01',
        itemCode: 'ITEM-WSLRW-ATH-01',
        quantity: 50,
      },
    ],
  });

  assert.strictEqual(createdSo.soCode, 'SO/2026/00001');
  assert.strictEqual(createdSo.items[0].sku, 'WSLRW-ATH');
  assert.strictEqual(createdSo.items[0].firmwareVersion, '6');
  assert.strictEqual(createdSo.items[0].templateId, 'tmpl-ath-temp-hum');
  assert.strictEqual(createdSo.items[0].itemCodeId, 'cat-ath-01');

  // Attach another item from catalog via attachItems
  const attachedOrder = await soService.attachItems(createdSo.id, {
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
  assert.strictEqual(clwItem!.sku, 'WSLRW-CLW');
  assert.strictEqual(clwItem!.firmwareVersion, '1.4');
  assert.strictEqual(clwItem!.templateId, 'tmpl-clw-press');
  assert.strictEqual(clwItem!.quantity, 20);

  console.log('  [PASS] 4.2: Attach Items and SO creation auto-fill snapshot data accurately\n');
}

async function runScenario5() {
  console.log('--- SCENARIO 5: Clean UI & Minimalist UX Verification ---');

  const itemCodesModulePath = path.resolve(__dirname, '../src/views/control-panel-modules/item-codes.module.ts');
  const salesOrdersModulePath = path.resolve(__dirname, '../src/views/control-panel-modules/sales-orders.module.ts');
  const controlPanelViewPath = path.resolve(__dirname, '../src/views/control-panel.view.ts');

  assert.ok(fs.existsSync(itemCodesModulePath), 'item-codes.module.ts must exist');
  assert.ok(fs.existsSync(salesOrdersModulePath), 'sales-orders.module.ts must exist');
  assert.ok(fs.existsSync(controlPanelViewPath), 'control-panel.view.ts must exist');

  const itemCodesContent = fs.readFileSync(itemCodesModulePath, 'utf8');
  const salesOrdersContent = fs.readFileSync(salesOrdersModulePath, 'utf8');
  const controlPanelContent = fs.readFileSync(controlPanelViewPath, 'utf8');

  // 5.1 Verify elimination of jargon
  const forbiddenPhrases = [
    'C-Module</span>',
    'D-Module Bridge</span>',
    'C-Module (Control Panel)',
    'Test Session (D-Module):',
  ];

  for (const phrase of forbiddenPhrases) {
    assert.ok(!itemCodesContent.includes(phrase), `item-codes.module.ts must not contain "${phrase}"`);
    assert.ok(!salesOrdersContent.includes(phrase), `sales-orders.module.ts must not contain "${phrase}"`);
  }
  console.log('  [PASS] 5.1: Zero occurrences of forbidden jargon (C-Module, D-Module Bridge)');

  // 5.2 Verify clean navigation & catalog picker integration
  assert.ok(itemCodesContent.includes('Item Code Catalog'), 'Title must be clean Item Code Catalog');
  assert.ok(salesOrdersContent.includes('Pick from Catalog'), 'Picker button must be present in SO view');
  assert.ok(salesOrdersContent.includes('showCatalogPickerModal'), 'Modal state must exist');
  assert.ok(controlPanelContent.includes("switchTab('item-codes')"), 'Sidebar navigation must support item-codes');

  // 5.3 Verify Tabulator data-grid & Vue reactivity features
  assert.ok(itemCodesContent.includes('new Tabulator('), 'Tabulator 6.x must be initialized');
  assert.ok(itemCodesContent.includes('itemCodesViewMode'), 'Dual view mode switcher must be present');

  console.log('  [PASS] 5.2 & 5.3: Clean navigation, Catalog Picker, and Tabulator data grid verified\n');
}

async function main() {
  console.log('================================================================');
  console.log('LOM-TEST: MASTER ITEM CODES, SKU_FW, SO CODE & CLEAN UI SPEC');
  console.log('================================================================\n');

  try {
    await runScenario1();
    await runScenario2();
    await runScenario3();
    await runScenario4();
    await runScenario5();

    console.log('================================================================');
    console.log('ALL 5 SCENARIOS PASSED WITH 100% COMPLIANCE');
    console.log('================================================================');
  } catch (err) {
    console.error('\n[FAILED] Test failure encountered:');
    console.error(err);
    process.exit(1);
  }
}

main();
