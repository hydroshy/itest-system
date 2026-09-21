import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import {
  SalesOrderEntity,
  SalesOrderStatus,
  SalesOrderSource,
} from '../src/modules/c-modules/sales-orders/entities/sales-order.entity';
import {
  SalesOrderItemEntity,
  SalesOrderItemStatus,
} from '../src/modules/c-modules/sales-orders/entities/sales-order-item.entity';
import {
  CreateSalesOrderDto,
  CreateSalesOrderItemDto,
  UpdateSalesOrderDto,
} from '../src/modules/c-modules/sales-orders/dto/sales-order.dto';
import { OdooImportDto } from '../src/modules/c-modules/sales-orders/dto/odoo-import.dto';
import { CsvImportDto } from '../src/modules/c-modules/sales-orders/dto/csv-import.dto';
import { SalesOrdersService } from '../src/modules/c-modules/sales-orders/sales-orders.service';
import { SalesOrdersRepository } from '../src/modules/c-modules/sales-orders/sales-orders.repository';
import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING SALES ORDERS & ITEMS BACKEND ENGINE TEST');
  console.log('====================================================\n');

  // Test 1: ALL_DATABASE_ENTITIES registration
  console.log('[Test 1] Verifying TypeORM ALL_DATABASE_ENTITIES registration...');
  const entityNames = ALL_DATABASE_ENTITIES.map((e: any) => e?.name);
  assert.ok(entityNames.includes('SalesOrderEntity'), 'SalesOrderEntity must be registered');
  assert.ok(entityNames.includes('SalesOrderItemEntity'), 'SalesOrderItemEntity must be registered');
  console.log('  -> PASS: SalesOrderEntity and SalesOrderItemEntity registered.\n');

  // Test 2: TypeORM Metadata resolution
  console.log('[Test 2] Building TypeORM DataSource metadata...');
  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const soMeta = ds.getMetadata(SalesOrderEntity);
  assert.strictEqual(soMeta.tableName, 'sales_orders');
  assert.ok(soMeta.findColumnWithPropertyName('soCode'), 'soCode column must exist');
  assert.ok(soMeta.findColumnWithPropertyName('customer'), 'customer column must exist');
  assert.ok(soMeta.findColumnWithPropertyName('orderDate'), 'orderDate column must exist');
  assert.ok(soMeta.findColumnWithPropertyName('status'), 'status column must exist');
  assert.ok(soMeta.findColumnWithPropertyName('source'), 'source column must exist');
  assert.ok(soMeta.findColumnWithPropertyName('odooId'), 'odooId column must exist');

  const itemMeta = ds.getMetadata(SalesOrderItemEntity);
  assert.strictEqual(itemMeta.tableName, 'sales_order_items');
  assert.ok(itemMeta.findColumnWithPropertyName('itemCode'), 'itemCode column must exist');
  assert.ok(itemMeta.findColumnWithPropertyName('sku'), 'sku column must exist');
  assert.ok(itemMeta.findColumnWithPropertyName('quantity'), 'quantity column must exist');
  assert.ok(itemMeta.findColumnWithPropertyName('firmwareVersion'), 'firmwareVersion column must exist');
  assert.ok(itemMeta.findColumnWithPropertyName('templateId'), 'templateId column must exist');
  assert.ok(itemMeta.findColumnWithPropertyName('testedQuantity'), 'testedQuantity column must exist');
  assert.ok(itemMeta.findColumnWithPropertyName('passedQuantity'), 'passedQuantity column must exist');
  assert.ok(itemMeta.findColumnWithPropertyName('failedQuantity'), 'failedQuantity column must exist');

  // Check 1-to-N relation
  const soRelation = soMeta.relations.find((r) => r.propertyName === 'items');
  assert.ok(soRelation, 'SalesOrderEntity must have items relation');
  assert.strictEqual(soRelation.isOneToMany, true);

  const itemRelation = itemMeta.relations.find((r) => r.propertyName === 'salesOrder');
  assert.ok(itemRelation, 'SalesOrderItemEntity must have salesOrder relation');
  assert.strictEqual(itemRelation.isManyToOne, true);
  console.log('  -> PASS: TypeORM table, columns and 1-to-N relationships verified.\n');

  // Test 3: C-Module Registry registration
  console.log('[Test 3] Verifying C-Module registry integration...');
  const cMod = C_MODULES_REGISTRY.find((m) => m.id === 'c-sales-orders');
  assert.ok(cMod, 'c-sales-orders must be registered in C_MODULES_REGISTRY');
  assert.strictEqual(cMod.routeHash, '#sales-orders');
  assert.strictEqual(cMod.code, 'C_MOD_SALES_ORDERS');
  console.log('  -> PASS: c-sales-orders registered in C-Module registry.\n');

  // Test 4: Mock Repository & Service Logic
  console.log('[Test 4] Verifying SalesOrdersService CRUD & parsing logic...');
  const fakeDb: {
    salesOrders: SalesOrderEntity[];
    items: SalesOrderItemEntity[];
    templates: any[];
  } = {
    salesOrders: [],
    items: [],
    templates: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'WSLRW-ATH Standard Test Template',
        code: 'TT-WSLRW-ATH-1.4',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.4',
        isActive: true,
        executionMode: 'FLOW',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'WSLRW-CLW Base Test Template',
        code: 'TT-WSLRW-CLW',
        sku: 'WSLRW-CLW',
        firmwareVersion: '1.0',
        isActive: true,
        executionMode: 'SCRIPT',
      },
    ],
  };

  const mockRepo = {
    findWithPagination: async (query: any) => {
      let filtered = [...fakeDb.salesOrders];
      if (query.search) {
        filtered = filtered.filter(
          (o) =>
            o.soCode.toLowerCase().includes(query.search.toLowerCase()) ||
            (o.customer && o.customer.toLowerCase().includes(query.search.toLowerCase())),
        );
      }
      return {
        data: filtered.map((so) => ({
          ...so,
          itemsCount: so.items.length,
          totalQuantity: so.items.reduce((acc, i) => acc + (i.quantity || 0), 0),
          testedQuantity: so.items.reduce((acc, i) => acc + (i.testedQuantity || 0), 0),
          passedQuantity: so.items.reduce((acc, i) => acc + (i.passedQuantity || 0), 0),
          failedQuantity: so.items.reduce((acc, i) => acc + (i.failedQuantity || 0), 0),
          testProgress: 0,
        })),
        total: filtered.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
    },
    findById: async (id: string) => {
      return fakeDb.salesOrders.find((o) => o.id === id || o.soCode === id) || null;
    },
    findBySoCode: async (soCode: string) => {
      return fakeDb.salesOrders.find((o) => o.soCode === soCode) || null;
    },
    createSalesOrder: async (soData: any, itemsData: any[]) => {
      const soId = `so-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const items: SalesOrderItemEntity[] = itemsData.map((item, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        salesOrderId: soId,
        salesOrder: null as any,
        itemCode: item.itemCode,
        sku: item.sku,
        quantity: item.quantity || 1,
        firmwareVersion: item.firmwareVersion || '1.0',
        templateId: item.templateId,
        template: fakeDb.templates.find((t) => t.id === item.templateId),
        testedQuantity: item.testedQuantity || 0,
        passedQuantity: item.passedQuantity || 0,
        failedQuantity: item.failedQuantity || 0,
        status: item.status || SalesOrderItemStatus.PENDING,
        notes: item.notes,
        metadata: item.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const newSo: SalesOrderEntity = {
        id: soId,
        soCode: soData.soCode,
        customer: soData.customer,
        orderDate: soData.orderDate || new Date(),
        status: soData.status || SalesOrderStatus.DRAFT,
        source: soData.source || SalesOrderSource.MANUAL,
        odooId: soData.odooId,
        notes: soData.notes,
        metadata: soData.metadata || {},
        createdBy: soData.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        items,
      };

      fakeDb.salesOrders.push(newSo);
      return newSo;
    },
    updateSalesOrder: async (id: string, soData: any, itemsData?: any[]) => {
      const existing = fakeDb.salesOrders.find((o) => o.id === id);
      if (!existing) throw new Error('Not found');
      Object.assign(existing, soData);
      if (itemsData) {
        existing.items = itemsData.map((it, idx) => ({
          id: it.id || `item-up-${idx}`,
          salesOrderId: existing.id,
          salesOrder: null as any,
          itemCode: it.itemCode,
          sku: it.sku,
          quantity: it.quantity || 1,
          firmwareVersion: it.firmwareVersion || '1.0',
          templateId: it.templateId,
          template: fakeDb.templates.find((t) => t.id === it.templateId),
          testedQuantity: it.testedQuantity || 0,
          passedQuantity: it.passedQuantity || 0,
          failedQuantity: it.failedQuantity || 0,
          status: it.status || SalesOrderItemStatus.PENDING,
          notes: it.notes,
          metadata: it.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }
      return existing;
    },
    deleteSalesOrder: async (id: string) => {
      const idx = fakeDb.salesOrders.findIndex((o) => o.id === id);
      if (idx >= 0) fakeDb.salesOrders.splice(idx, 1);
      return true;
    },
    findTemplateForSku: async (sku: string, firmwareVersion?: string) => {
      const exact = fakeDb.templates.find(
        (t) =>
          t.sku.toLowerCase() === sku.toLowerCase() &&
          t.firmwareVersion === (firmwareVersion || '1.0') &&
          t.isActive,
      );
      if (exact) {
        return {
          matched: true,
          matchType: 'EXACT' as const,
          template: exact,
          message: 'Exact match',
        };
      }
      const base = fakeDb.templates.find(
        (t) => t.sku.toLowerCase() === sku.toLowerCase() && t.isActive,
      );
      if (base) {
        return {
          matched: true,
          matchType: 'SKU_FALLBACK' as const,
          template: base,
          message: 'SKU base match',
        };
      }
      return {
        matched: false,
        matchType: 'NONE' as const,
        template: null,
        message: 'No match',
      };
    },
    findTestSessionForItem: async (soCode: string, itemCode: string) => {
      return {
        id: 'session-123',
        sessionCode: `TS-${soCode}`,
        soCode,
        itemCode,
        status: 'IN_PROGRESS',
        totalDevices: 10,
        passedDevices: 8,
        failedDevices: 2,
      };
    },
  };

  const service = new SalesOrdersService(mockRepo as any);

  // 4.1 Test Manual Create
  console.log('  [4.1] Manual SO Creation with Auto-Template Matching...');
  const createdSo = await service.create(
    {
      soCode: 'SO-2026-MANUAL-001',
      customer: 'Daviteq Production Plant',
      status: SalesOrderStatus.CONFIRMED,
      source: SalesOrderSource.MANUAL,
      items: [
        {
          itemCode: 'ITEM-01',
          sku: 'WSLRW-ATH',
          firmwareVersion: '1.4',
          quantity: 25,
        },
        {
          itemCode: 'ITEM-02',
          sku: 'WSLRW-CLW',
          firmwareVersion: '1.0',
          quantity: 10,
        },
      ],
    },
    'engineer',
  );

  assert.strictEqual(createdSo.soCode, 'SO-2026-MANUAL-001');
  assert.strictEqual(createdSo.items.length, 2);
  assert.strictEqual(createdSo.items[0].templateId, '11111111-1111-1111-1111-111111111111');
  assert.strictEqual(createdSo.items[1].templateId, '22222222-2222-2222-2222-222222222222');
  console.log('    -> PASS: Created SO with 2 items and auto-resolved template IDs.');

  // 4.2 Test Odoo JSON Import
  console.log('  [4.2] Odoo JSON Import (webhook/direct export)...');
  const odooPayload = {
    id: 99,
    name: 'SO-ODOO-8888',
    partner_id: [14, 'VinFast Smart Factory'],
    date_order: '2026-09-25 10:30:00',
    state: 'sale',
    order_line: [
      {
        id: 501,
        name: '[WSLRW-ATH] Ambient Temp & Humidity Sensor',
        product_id: [45, '[WSLRW-ATH] Sensor'],
        default_code: 'WSLRW-ATH',
        product_uom_qty: 100,
        firmware_version: '1.4',
      },
    ],
  };

  const odooResult = await service.importOdooJson(odooPayload, 'odoo-bot');
  assert.strictEqual(odooResult.success, true);
  assert.strictEqual(odooResult.orders[0].soCode, 'SO-ODOO-8888');
  assert.strictEqual(odooResult.orders[0].customer, 'VinFast Smart Factory');
  assert.strictEqual(odooResult.orders[0].status, SalesOrderStatus.CONFIRMED);
  assert.strictEqual(odooResult.orders[0].source, SalesOrderSource.ODOO);
  assert.strictEqual(odooResult.orders[0].items[0].sku, 'WSLRW-ATH');
  assert.strictEqual(odooResult.orders[0].items[0].quantity, 100);
  assert.strictEqual(odooResult.orders[0].items[0].templateId, '11111111-1111-1111-1111-111111111111');
  console.log('    -> PASS: Odoo JSON parsed correctly with customer, SKU, and template linkage.');

  // 4.3 Test CSV Bulk Import
  console.log('  [4.3] CSV Bulk Upload Parsing (with quotes and multi-items)...');
  const csvContent = [
    'soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes',
    'SO-CSV-9001,"Daviteq Partner, Inc.",2026-10-01,ITEM-A1,WSLRW-ATH,1.4,50,"Lot A, priority 1"',
    'SO-CSV-9001,"Daviteq Partner, Inc.",2026-10-01,ITEM-A2,WSLRW-CLW,1.0,20,"Lot B, standard"',
    'SO-CSV-9002,"Samsung SEVT",2026-10-05,ITEM-B1,WSLRW-UNKNOWN,2.0,15,"Special batch"',
  ].join('\n');

  const csvResult = await service.importCsv({ csvContent, overwriteExisting: true }, 'csv-importer');
  assert.strictEqual(csvResult.success, true);
  assert.strictEqual(csvResult.totalOrders, 2);
  assert.strictEqual(csvResult.totalItems, 3);

  const so1 = csvResult.orders.find((o) => o.soCode === 'SO-CSV-9001');
  assert.ok(so1, 'SO-CSV-9001 must exist');
  assert.strictEqual(so1.customer, 'Daviteq Partner, Inc.');
  assert.strictEqual(so1.items.length, 2);
  assert.strictEqual(so1.items[0].notes, 'Lot A, priority 1');
  assert.strictEqual(so1.items[0].templateId, '11111111-1111-1111-1111-111111111111');

  const so2 = csvResult.orders.find((o) => o.soCode === 'SO-CSV-9002');
  assert.ok(so2, 'SO-CSV-9002 must exist');
  assert.strictEqual(so2.items[0].templateId, undefined); // unknown SKU fallback
  console.log('    -> PASS: CSV parsing handles quotes, commas, multi-items, and fallback.');

  // 4.4 Test Real-Time Test Status Query
  console.log('  [4.4] Real-Time Item Test Status from D-Module...');
  const testStatus = await service.getItemTestStatus('SO-2026-MANUAL-001', 'ITEM-01');
  assert.strictEqual(testStatus.soCode, 'SO-2026-MANUAL-001');
  assert.strictEqual(testStatus.itemCode, 'ITEM-01');
  assert.strictEqual(testStatus.targetQuantity, 25);
  assert.strictEqual(testStatus.testedQuantity, 10);
  assert.strictEqual(testStatus.passedQuantity, 8);
  assert.strictEqual(testStatus.failedQuantity, 2);
  assert.strictEqual(testStatus.testSession?.sessionCode, 'TS-SO-2026-MANUAL-001');
  console.log('    -> PASS: Test status queries item and session metrics successfully.\n');

  console.log('====================================================');
  console.log('ALL TESTS PASSED! BACKEND ENGINE FULLY VERIFIED.');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
