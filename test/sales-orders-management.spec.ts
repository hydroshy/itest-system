import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { DataSource } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

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
import { TestTemplateEntity } from '../src/modules/c-modules/test-builder/entities/test-template.entity';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
} from '../src/modules/c-modules/sales-orders/dto/sales-order.dto';
import { OdooImportDto } from '../src/modules/c-modules/sales-orders/dto/odoo-import.dto';
import { CsvImportDto } from '../src/modules/c-modules/sales-orders/dto/csv-import.dto';
import { sanitizeFirmwareVersion } from '../src/modules/c-modules/item-codes/item-code-utils';
import { SalesOrdersService } from '../src/modules/c-modules/sales-orders/sales-orders.service';
import { SalesOrdersController } from '../src/modules/c-modules/sales-orders/sales-orders.controller';
import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';
import {
  SALES_ORDERS_TEMPLATE,
  SALES_ORDERS_MODALS,
  SALES_ORDERS_SCRIPT,
} from '../src/views/control-panel-modules/sales-orders.module';
import { CONTROL_PANEL_HTML } from '../src/views/control-panel.view';

class TestMetadataDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

/**
 * In-Memory Mock Database Store for Unit & Integration Verification
 */
interface MockDatabase {
  salesOrders: SalesOrderEntity[];
  items: SalesOrderItemEntity[];
  templates: TestTemplateEntity[];
  testSessions: any[];
}

function createMockDatabase(): MockDatabase {
  return {
    salesOrders: [],
    items: [],
    templates: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'WSLRW-ATH Standard Test Template v1.4',
        code: 'TT-WSLRW-ATH-1.4',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.4',
        isActive: true,
        executionMode: 'FLOW',
        flowConfig: { nodes: [], connections: [] },
        timeoutSeconds: 60,
        minPacketsRequired: 1,
        assertions: [],
        createdAt: new Date('2026-01-10T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      } as any,
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'WSLRW-ATH Legacy Test Template v1',
        code: 'TT-WSLRW-ATH-1',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1',
        isActive: true,
        executionMode: 'FLOW',
        flowConfig: { nodes: [], connections: [] },
        timeoutSeconds: 45,
        minPacketsRequired: 1,
        assertions: [],
        createdAt: new Date('2025-12-01T00:00:00Z'),
        updatedAt: new Date('2025-12-01T00:00:00Z'),
      } as any,
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'WSLRW-CLW Cleanroom Monitor Template',
        code: 'TT-WSLRW-CLW-1',
        sku: 'WSLRW-CLW',
        firmwareVersion: '1',
        isActive: true,
        executionMode: 'SCRIPT',
        flowConfig: { nodes: [], connections: [] },
        timeoutSeconds: 30,
        minPacketsRequired: 2,
        assertions: [],
        createdAt: new Date('2026-02-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      } as any,
    ],
    testSessions: [
      {
        id: 'session-so-100-item-01',
        sessionCode: 'TS-SO-CRUD-001',
        soCode: 'SO-CRUD-001',
        itemCode: 'ITEM-ATH-01',
        status: 'COMPLETED',
        totalDevices: 25,
        passedDevices: 24,
        failedDevices: 1,
        startTime: new Date('2026-03-01T10:00:00Z'),
        endTime: new Date('2026-03-01T10:30:00Z'),
      },
    ],
  };
}

function createMockRepository(db: MockDatabase) {
  return {
    findWithPagination: async (query: any) => {
      let filtered = [...db.salesOrders];

      if (query.search && query.search.trim() !== '') {
        const q = query.search.trim().toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.soCode.toLowerCase().includes(q) ||
            (o.customer && o.customer.toLowerCase().includes(q)),
        );
      }

      if (query.status && query.status.trim() !== '') {
        filtered = filtered.filter((o) => o.status === query.status.trim());
      }

      if (query.source && query.source.trim() !== '') {
        filtered = filtered.filter((o) => o.source === query.source.trim());
      }

      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
      const total = filtered.length;
      const skip = (page - 1) * limit;
      const paged = filtered.slice(skip, skip + limit);

      const data = paged.map((so) => {
        const orderItems = db.items.filter((i) => i.salesOrderId === so.id);
        const totalQuantity = orderItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
        const testedQuantity = orderItems.reduce((acc, i) => acc + (i.testedQuantity || 0), 0);
        const passedQuantity = orderItems.reduce((acc, i) => acc + (i.passedQuantity || 0), 0);
        const failedQuantity = orderItems.reduce((acc, i) => acc + (i.failedQuantity || 0), 0);
        const testProgress =
          totalQuantity > 0 ? Math.min(100, Math.round((testedQuantity / totalQuantity) * 100)) : 0;

        return {
          ...so,
          items: orderItems,
          itemsCount: orderItems.length,
          totalQuantity,
          testedQuantity,
          passedQuantity,
          failedQuantity,
          testProgress,
        };
      });

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    },

    findById: async (id: string) => {
      const order = db.salesOrders.find((o) => o.id === id || o.soCode === id);
      if (!order) return null;
      const orderItems = db.items.filter((i) => i.salesOrderId === order.id);
      return {
        ...order,
        items: orderItems.map((item) => ({
          ...item,
          template: db.templates.find((t) => t.id === item.templateId) || null,
        })),
      } as any;
    },

    findBySoCode: async (soCode: string) => {
      if (!soCode) return null;
      const order = db.salesOrders.find((o) => o.soCode.trim() === soCode.trim());
      if (!order) return null;
      const orderItems = db.items.filter((i) => i.salesOrderId === order.id);
      return {
        ...order,
        items: orderItems.map((item) => ({
          ...item,
          template: db.templates.find((t) => t.id === item.templateId) || null,
        })),
      } as any;
    },

    createSalesOrder: async (soData: Partial<SalesOrderEntity>, itemsData: Partial<SalesOrderItemEntity>[] = []) => {
      const soId = `so-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newSo: SalesOrderEntity = {
        id: soId,
        soCode: soData.soCode!,
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
        items: [],
      };

      const createdItems: SalesOrderItemEntity[] = itemsData.map((it, idx) => {
        const item: SalesOrderItemEntity = {
          id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          salesOrderId: soId,
          salesOrder: newSo,
          itemCode: it.itemCode!,
          sku: it.sku!,
          quantity: it.quantity || 1,
          firmwareVersion: it.firmwareVersion ? sanitizeFirmwareVersion(it.firmwareVersion) : '1',
          templateId: it.templateId,
          template: db.templates.find((t) => t.id === it.templateId),
          testedQuantity: it.testedQuantity || 0,
          passedQuantity: it.passedQuantity || 0,
          failedQuantity: it.failedQuantity || 0,
          status: it.status || SalesOrderItemStatus.PENDING,
          notes: it.notes,
          metadata: it.metadata || {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        db.items.push(item);
        return item;
      });

      newSo.items = createdItems;
      db.salesOrders.push(newSo);
      return newSo;
    },

    updateSalesOrder: async (id: string, soData: Partial<SalesOrderEntity>, itemsData?: Partial<SalesOrderItemEntity>[]) => {
      const existing = db.salesOrders.find((o) => o.id === id || o.soCode === id);
      if (!existing) {
        throw new NotFoundException(`Sales Order [${id}] not found`);
      }

      Object.assign(existing, soData, { updatedAt: new Date() });

      if (itemsData !== undefined) {
        const existingItems = db.items.filter((i) => i.salesOrderId === existing.id);
        const existingItemMap = new Map(existingItems.map((i) => [i.id, i]));
        const existingCodeMap = new Map(existingItems.map((i) => [i.itemCode, i]));
        const processedIds = new Set<string>();
        const updatedList: SalesOrderItemEntity[] = [];

        for (const itemDto of itemsData) {
          let target = (itemDto.id && existingItemMap.get(itemDto.id)) ||
                       (itemDto.itemCode && existingCodeMap.get(itemDto.itemCode));
          if (target) {
            Object.assign(target, itemDto, { updatedAt: new Date() });
            target.template = db.templates.find((t) => t.id === target.templateId);
            processedIds.add(target.id);
            updatedList.push(target);
          } else {
            const newItem: SalesOrderItemEntity = {
              id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              salesOrderId: existing.id,
              salesOrder: existing,
              itemCode: itemDto.itemCode!,
              sku: itemDto.sku!,
              quantity: itemDto.quantity || 1,
              firmwareVersion: itemDto.firmwareVersion ? sanitizeFirmwareVersion(itemDto.firmwareVersion) : '1',
              templateId: itemDto.templateId,
              template: db.templates.find((t) => t.id === itemDto.templateId),
              testedQuantity: itemDto.testedQuantity || 0,
              passedQuantity: itemDto.passedQuantity || 0,
              failedQuantity: itemDto.failedQuantity || 0,
              status: itemDto.status || SalesOrderItemStatus.PENDING,
              notes: itemDto.notes,
              metadata: itemDto.metadata || {},
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            db.items.push(newItem);
            processedIds.add(newItem.id);
            updatedList.push(newItem);
          }
        }

        // Delete omitted items (cascade sync)
        db.items = db.items.filter((i) => i.salesOrderId !== existing.id || processedIds.has(i.id));
        existing.items = updatedList;
      }

      return existing;
    },

    deleteSalesOrder: async (id: string) => {
      const idx = db.salesOrders.findIndex((o) => o.id === id || o.soCode === id);
      if (idx < 0) {
        throw new NotFoundException(`Sales Order [${id}] not found`);
      }
      const so = db.salesOrders[idx];

      // CASCADE DELETION SIMULATION:
      // When master sales_orders is deleted, all child sales_order_items referencing it must be deleted.
      db.salesOrders.splice(idx, 1);
      db.items = db.items.filter((i) => i.salesOrderId !== so.id);
      return true;
    },

    findItem: async (salesOrderId: string, itemCode: string) => {
      const item = db.items.find((i) => i.salesOrderId === salesOrderId && i.itemCode === itemCode);
      if (!item) return null;
      return {
        ...item,
        template: db.templates.find((t) => t.id === item.templateId) || null,
      } as any;
    },

    findTemplateForSku: async (sku: string, firmwareVersion?: string) => {
      if (!sku || sku.trim() === '') {
        return {
          matched: false,
          matchType: 'NONE' as const,
          template: null,
          message: 'Device SKU is required for template matching',
        };
      }

      const cleanSku = sku.trim().toLowerCase();
      const cleanFw = firmwareVersion ? sanitizeFirmwareVersion(firmwareVersion) : '1';

      // 1. Exact match (SKU + Firmware Version)
      const exact = db.templates.find(
        (t) => t.sku.toLowerCase() === cleanSku && t.firmwareVersion === cleanFw && t.isActive,
      );
      if (exact) {
        return {
          matched: true,
          matchType: 'EXACT' as const,
          template: exact,
          message: `Exact template match found: ${exact.name}`,
        };
      }

      // 2. SKU base fallback (latest active)
      const base = db.templates
        .filter((t) => t.sku.toLowerCase() === cleanSku && t.isActive)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      if (base) {
        return {
          matched: true,
          matchType: 'SKU_FALLBACK' as const,
          template: base,
          message: `SKU base match found: ${base.name}`,
        };
      }

      // 3. Fallback: unassigned
      return {
        matched: false,
        matchType: 'NONE' as const,
        template: null,
        message: `No active test template matched for SKU '${sku}'`,
      };
    },

    findTestSessionForItem: async (soCode: string, itemCode: string) => {
      const session = db.testSessions.find(
        (s) => s.soCode.trim() === soCode.trim() && s.itemCode.trim() === itemCode.trim(),
      );
      return session || null;
    },
  };
}

async function runAllTests() {
  console.log('======================================================================');
  console.log('AUTOMATED TEST SUITE: SALES ORDERS & ITEM CODE MANAGEMENT SUBSYSTEM');
  console.log('File: dvt/test/sales-orders-management.spec.ts');
  console.log('======================================================================\n');

  let passedScenarios = 0;
  let totalScenarios = 4;

  // ==========================================================================
  // SCENARIO 1: CRUD Sales Orders & Item Codes (1-to-N hierarchy, cascade deletion)
  // ==========================================================================
  console.log('----------------------------------------------------------------------');
  console.log('SCENARIO 1: CRUD Sales Orders & Item Codes (1-to-N hierarchy, cascade deletion)');
  console.log('----------------------------------------------------------------------');

  // 1.1 TypeORM Entity Metadata & DDL Consistency
  console.log('  [1.1] Verifying TypeORM Entity Metadata & Database Schema DDL...');
  const ds = new TestMetadataDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  // Validate SalesOrderEntity
  assert.ok(ds.hasMetadata(SalesOrderEntity), 'SalesOrderEntity must have TypeORM metadata');
  const soMeta = ds.getMetadata(SalesOrderEntity);
  assert.strictEqual(soMeta.tableName, 'sales_orders', 'Table name must be sales_orders');

  const expectedSoCols = ['id', 'soCode', 'customer', 'orderDate', 'status', 'source', 'odooId', 'notes', 'metadata', 'createdBy', 'createdAt', 'updatedAt'];
  for (const col of expectedSoCols) {
    assert.ok(soMeta.findColumnWithPropertyName(col), `SalesOrderEntity missing column: ${col}`);
  }

  // Verify indices
  const soIndexNames = soMeta.indices.map((i) => i.name);
  assert.ok(soIndexNames.includes('idx_sales_orders_so_code'), 'idx_sales_orders_so_code index must exist');
  assert.ok(soIndexNames.includes('idx_sales_orders_status'), 'idx_sales_orders_status index must exist');
  assert.ok(soIndexNames.includes('idx_sales_orders_source'), 'idx_sales_orders_source index must exist');

  // Validate SalesOrderItemEntity
  assert.ok(ds.hasMetadata(SalesOrderItemEntity), 'SalesOrderItemEntity must have TypeORM metadata');
  const itemMeta = ds.getMetadata(SalesOrderItemEntity);
  assert.strictEqual(itemMeta.tableName, 'sales_order_items', 'Table name must be sales_order_items');

  const expectedItemCols = ['id', 'salesOrderId', 'itemCode', 'sku', 'quantity', 'firmwareVersion', 'templateId', 'testedQuantity', 'passedQuantity', 'failedQuantity', 'status', 'notes', 'metadata', 'createdAt', 'updatedAt'];
  for (const col of expectedItemCols) {
    assert.ok(itemMeta.findColumnWithPropertyName(col), `SalesOrderItemEntity missing column: ${col}`);
  }

  // 1-to-N Relationship & Cascade Foreign Key constraints
  const soToItemsRel = soMeta.relations.find((r) => r.propertyName === 'items');
  assert.ok(soToItemsRel, 'SalesOrderEntity must define items relation');
  assert.strictEqual(soToItemsRel.isOneToMany, true, 'items relation must be OneToMany');

  const itemToSoRel = itemMeta.relations.find((r) => r.propertyName === 'salesOrder');
  assert.ok(itemToSoRel, 'SalesOrderItemEntity must define salesOrder relation');
  assert.strictEqual(itemToSoRel.isManyToOne, true, 'salesOrder relation must be ManyToOne');
  assert.strictEqual(itemToSoRel.onDelete, 'CASCADE', 'salesOrder foreign key must specify onDelete: CASCADE');

  const itemToTemplateRel = itemMeta.relations.find((r) => r.propertyName === 'template');
  assert.ok(itemToTemplateRel, 'SalesOrderItemEntity must define template relation');
  assert.strictEqual(itemToTemplateRel.onDelete, 'SET NULL', 'template foreign key must specify onDelete: SET NULL');

  // Unique constraint (salesOrderId, itemCode)
  const itemUniques = itemMeta.uniques.map((u) => u.name);
  assert.ok(itemUniques.includes('UQ_so_items_so_item_code'), 'UQ_so_items_so_item_code composite unique constraint must exist');

  // DDL File Verification
  const ddlPath = path.resolve(__dirname, '../../deploy/database/updates/05_create_sales_orders_table.sql');
  assert.ok(fs.existsSync(ddlPath), 'DDL file 05_create_sales_orders_table.sql must exist');
  const ddlSql = fs.readFileSync(ddlPath, 'utf8');
  assert.ok(ddlSql.includes('REFERENCES "sales_orders"("id") ON DELETE CASCADE'), 'DDL must have ON DELETE CASCADE on salesOrderId');
  assert.ok(ddlSql.includes('REFERENCES "test_templates"("id") ON DELETE SET NULL'), 'DDL must have ON DELETE SET NULL on templateId');
  assert.ok(ddlSql.includes('UQ_sales_orders_soCode'), 'DDL must have unique constraint on soCode');
  assert.ok(ddlSql.includes('UQ_so_items_so_item_code'), 'DDL must have composite unique on salesOrderId + itemCode');

  // DB Routing Config verification
  const routingPath = path.resolve(__dirname, '../config/db-routing.config.json');
  assert.ok(fs.existsSync(routingPath), 'db-routing.config.json must exist');
  const routing = JSON.parse(fs.readFileSync(routingPath, 'utf8'));
  assert.strictEqual(routing.table_routes?.['sales_orders'], 'core_db', 'sales_orders must route to core_db');
  assert.strictEqual(routing.table_routes?.['sales_order_items'], 'core_db', 'sales_order_items must route to core_db');
  console.log('    ✓ TypeORM entities, relations (1-N cascade), DDL script, and DB routing verified.');

  // 1.2 Service CRUD Operations: Create with 1-to-N items
  console.log('  [1.2] Testing SalesOrdersService Create Operation (1-to-N hierarchy)...');
  const db = createMockDatabase();
  const repo = createMockRepository(db);
  const service = new SalesOrdersService(repo as any);
  const controller = new SalesOrdersController(service);

  const newSo = await service.create(
    {
      soCode: 'SO-CRUD-001',
      customer: 'Daviteq Production Plant A',
      status: SalesOrderStatus.CONFIRMED,
      source: SalesOrderSource.MANUAL,
      notes: 'Initial production batch for factory deployment',
      items: [
        {
          itemCode: 'ITEM-ATH-01',
          sku: 'WSLRW-ATH',
          firmwareVersion: '1.4',
          quantity: 25,
          notes: 'Temperature sensors for cold storage',
        },
        {
          itemCode: 'ITEM-ATH-02',
          sku: 'WSLRW-ATH',
          firmwareVersion: '1.0',
          quantity: 15,
          notes: 'Standard warehouse units',
        },
        {
          itemCode: 'ITEM-CLW-01',
          sku: 'WSLRW-CLW',
          firmwareVersion: '1.0',
          quantity: 10,
          notes: 'Cleanroom humidity monitors',
        },
      ],
    },
    'qa_engineer',
  );

  assert.strictEqual(newSo.soCode, 'SO-CRUD-001');
  assert.strictEqual(newSo.customer, 'Daviteq Production Plant A');
  assert.strictEqual(newSo.status, SalesOrderStatus.CONFIRMED);
  assert.strictEqual(newSo.source, SalesOrderSource.MANUAL);
  assert.strictEqual(newSo.items.length, 3, 'SO must contain exactly 3 items');
  assert.strictEqual(newSo.items[0].templateId, '11111111-1111-1111-1111-111111111111');
  assert.strictEqual(newSo.items[1].templateId, '22222222-2222-2222-2222-222222222222');
  assert.strictEqual(newSo.items[2].templateId, '33333333-3333-3333-3333-333333333333');

  // Verify validation: Reject duplicate soCode
  await assert.rejects(
    async () => {
      await service.create({
        soCode: 'SO-CRUD-001',
        customer: 'Duplicate Test',
        items: [{ itemCode: 'ITEM-X', sku: 'WSLRW-ATH', quantity: 1 }],
      });
    },
    (err: any) => err instanceof ConflictException,
    'Service must reject duplicate soCode with ConflictException',
  );

  // Verify validation: Reject empty items
  await assert.rejects(
    async () => {
      await service.create({
        soCode: 'SO-NO-ITEMS',
        customer: 'Empty Items Test',
        items: [],
      });
    },
    (err: any) => err instanceof BadRequestException,
    'Service must reject order without items with BadRequestException',
  );
  console.log('    ✓ 1-to-N SO created with items, auto-template resolution, and validation guards.');

  // 1.3 Read & Query with Computed Statistics
  console.log('  [1.3] Testing Read & Pagination with Computed Progress Metrics...');
  const fetchedSo = await service.findOne(newSo.id);
  assert.strictEqual(fetchedSo.soCode, 'SO-CRUD-001');
  assert.strictEqual(fetchedSo.itemsCount, 3);
  assert.strictEqual(fetchedSo.totalQuantity, 50); // 25 + 15 + 10

  const pagedList = await service.findAll({
    search: 'Daviteq',
    page: 1,
    limit: 10,
  });
  assert.strictEqual(pagedList.total, 1);
  assert.strictEqual(pagedList.data[0].soCode, 'SO-CRUD-001');
  assert.strictEqual(pagedList.data[0].totalQuantity, 50);

  // Filter with no match
  const emptyFilter = await service.findAll({ search: 'NonExistentCustomer' });
  assert.strictEqual(emptyFilter.total, 0);
  console.log('    ✓ Query, search filtering, and computed quantity metrics verified.');

  // 1.4 Update Sales Order & Modify Items
  console.log('  [1.4] Testing Update Sales Order & Child Items Sync...');
  const updatedSo = await service.update(newSo.id, {
    customer: 'Daviteq Industrial Smart Factory (Updated)',
    notes: 'Priority expedite requested',
    items: [
      // Update quantity of first item
      {
        id: newSo.items[0].id,
        itemCode: 'ITEM-ATH-01',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.4',
        quantity: 30, // modified from 25 to 30
      },
      // Keep second item
      {
        id: newSo.items[1].id,
        itemCode: 'ITEM-ATH-02',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.0',
        quantity: 15,
      },
      // Add a new 4th item
      {
        itemCode: 'ITEM-NEW-04',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.4',
        quantity: 5,
      },
      // Notice: ITEM-CLW-01 (third item) is omitted -> will be deleted
    ],
  });

  assert.strictEqual(updatedSo.customer, 'Daviteq Industrial Smart Factory (Updated)');
  assert.strictEqual(updatedSo.items.length, 3, 'Items length should now be 3 (1 updated, 1 retained, 1 added, 1 removed)');
  const updatedAth01 = updatedSo.items.find((i) => i.itemCode === 'ITEM-ATH-01');
  assert.strictEqual(updatedAth01?.quantity, 30, 'Item quantity must be updated to 30');
  const removedClw = updatedSo.items.find((i) => i.itemCode === 'ITEM-CLW-01');
  assert.strictEqual(removedClw, undefined, 'Omitted item ITEM-CLW-01 must be removed');
  console.log('    ✓ Update correctly synchronizes modified, added, and deleted child items.');

  // 1.5 Cascade Deletion
  console.log('  [1.5] Testing Cascade Deletion on Sales Order removal...');
  const itemsBeforeDelete = db.items.filter((i) => i.salesOrderId === newSo.id);
  assert.strictEqual(itemsBeforeDelete.length, 3, 'Should have 3 child items before deletion');

  const deleteResult = await service.remove(newSo.id);
  assert.strictEqual(deleteResult.success, true);

  // Check parent is deleted
  const deletedSoLookup = db.salesOrders.find((o) => o.id === newSo.id);
  assert.strictEqual(deletedSoLookup, undefined, 'Parent Sales Order must be deleted from database');

  // Verify child items are CASCADE deleted
  const itemsAfterDelete = db.items.filter((i) => i.salesOrderId === newSo.id);
  assert.strictEqual(itemsAfterDelete.length, 0, 'All child items must be CASCADE deleted when parent SO is removed');

  // Deleting non-existent throws NotFoundException
  await assert.rejects(
    async () => {
      await service.remove('non-existent-uuid');
    },
    (err: any) => err instanceof NotFoundException,
    'Deleting non-existent SO must throw NotFoundException',
  );
  console.log('    ✓ Cascade deletion verified: removing SO purges all associated items.');

  passedScenarios++;
  console.log('  -> PASS: Scenario 1 fully satisfied.\n');

  // ==========================================================================
  // SCENARIO 2: Ingestion - Odoo JSON payload parsing & CSV bulk parser
  // ==========================================================================
  console.log('----------------------------------------------------------------------');
  console.log('SCENARIO 2: Ingestion - Odoo JSON payload & CSV bulk parser');
  console.log('----------------------------------------------------------------------');

  // 2.1 Odoo JSON Parser
  console.log('  [2.1] Testing Odoo JSON Payload Parsing (Standard webhook / Export)...');
  const odooSinglePayload = {
    id: 888,
    name: 'SO-ODOO-1001',
    partner_id: [12, 'VinFast Automated Logistics'],
    date_order: '2026-03-15 14:00:00',
    state: 'sale',
    order_line: [
      {
        id: 701,
        name: '[WSLRW-ATH] Ambient Temp & Humidity Sensor with Solar Panel',
        default_code: 'WSLRW-ATH',
        product_uom_qty: 40,
        firmware_version: '1.4',
        notes: 'Priority batch A',
      },
      {
        id: 702,
        name: 'Cleanroom Sensor Unit',
        product_id: [99, '[WSLRW-CLW] Cleanroom Monitor'],
        product_uom_qty: 10,
        notes: 'Cleanroom certification required',
      },
    ],
  };

  const odooImportRes = await service.importOdooJson(odooSinglePayload, 'odoo_webhook');
  assert.strictEqual(odooImportRes.success, true);
  assert.strictEqual(odooImportRes.count, 1);

  const importedOdooSo = odooImportRes.orders[0];
  assert.strictEqual(importedOdooSo.soCode, 'SO-ODOO-1001');
  assert.strictEqual(importedOdooSo.customer, 'VinFast Automated Logistics');
  assert.strictEqual(importedOdooSo.status, SalesOrderStatus.CONFIRMED);
  assert.strictEqual(importedOdooSo.source, SalesOrderSource.ODOO);
  assert.strictEqual(importedOdooSo.odooId, 888);
  assert.strictEqual(importedOdooSo.items.length, 2);

  // Line 1: default_code extraction
  assert.strictEqual(importedOdooSo.items[0].sku, 'WSLRW-ATH');
  assert.strictEqual(importedOdooSo.items[0].quantity, 40);
  assert.strictEqual(importedOdooSo.items[0].templateId, '11111111-1111-1111-1111-111111111111');

  // Line 2: bracket extraction from product_id tuple
  assert.strictEqual(importedOdooSo.items[1].sku, 'WSLRW-CLW');
  assert.strictEqual(importedOdooSo.items[1].quantity, 10);
  assert.strictEqual(importedOdooSo.items[1].templateId, '33333333-3333-3333-3333-333333333333');

  // State mapping test
  const stateDraftPayload = { id: 889, name: 'SO-ODOO-DRAFT', state: 'draft', order_line: [{ name: 'Item', default_code: 'WSLRW-ATH', product_uom_qty: 1 }] };
  const stateDonePayload = { id: 890, name: 'SO-ODOO-DONE', state: 'done', order_line: [{ name: 'Item', default_code: 'WSLRW-ATH', product_uom_qty: 1 }] };
  const stateCancelPayload = { id: 891, name: 'SO-ODOO-CANCEL', state: 'cancel', order_line: [{ name: 'Item', default_code: 'WSLRW-ATH', product_uom_qty: 1 }] };

  const resDraft = await service.importOdooJson(stateDraftPayload);
  assert.strictEqual(resDraft.orders[0].status, SalesOrderStatus.DRAFT);
  const resDone = await service.importOdooJson(stateDonePayload);
  assert.strictEqual(resDone.orders[0].status, SalesOrderStatus.COMPLETED);
  const resCancel = await service.importOdooJson(stateCancelPayload);
  assert.strictEqual(resCancel.orders[0].status, SalesOrderStatus.CANCELLED);

  // Batch format support: { data: [...] }
  const batchPayload = {
    data: [
      { id: 901, name: 'SO-BATCH-01', partner_id: 'Batch Client 1', order_line: [{ default_code: 'WSLRW-ATH', product_uom_qty: 5 }] },
      { id: 902, name: 'SO-BATCH-02', partner_id: 'Batch Client 2', order_line: [{ default_code: 'WSLRW-CLW', product_uom_qty: 8 }] },
    ],
  };
  const batchRes = await service.importOdooJson(batchPayload);
  assert.strictEqual(batchRes.count, 2);

  // Idempotency: Re-importing same Odoo order updates instead of throwing duplicate key
  const odooReimport = {
    ...odooSinglePayload,
    partner_id: [12, 'VinFast Automated Logistics (Updated Address)'],
    order_line: [
      {
        ...odooSinglePayload.order_line[0],
        product_uom_qty: 50, // quantity increased
      },
    ],
  };
  const reimportRes = await service.importOdooJson(odooReimport);
  assert.strictEqual(reimportRes.success, true);
  const reimportedSo = await service.findOne(importedOdooSo.id);
  assert.strictEqual(reimportedSo.customer, 'VinFast Automated Logistics (Updated Address)');
  assert.strictEqual(reimportedSo.items[0].quantity, 50);

  // Validation: empty or invalid Odoo payload throws BadRequestException
  await assert.rejects(
    async () => {
      await service.importOdooJson({});
    },
    (err: any) => err instanceof BadRequestException,
    'Empty Odoo payload must throw BadRequestException',
  );
  console.log('    ✓ Odoo JSON parsing (single, batch, state mapping, SKU extraction, idempotency) verified.');

  // 2.2 CSV Bulk Parser
  console.log('  [2.2] Testing CSV Bulk Parser (Escaped quotes, commas, multi-item grouping)...');
  const complexCsv = [
    'soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes',
    'SO-CSV-7001,"Daviteq Partner, Inc.",2026-03-20,ITEM-01,WSLRW-ATH,1.4,50,"Special batch ""Alpha-01"" with pre-flashed keys"',
    'SO-CSV-7001,"Daviteq Partner, Inc.",2026-03-20,ITEM-02,WSLRW-CLW,1.0,20,"Standard calibration, cleanroom"',
    'SO-CSV-7002,"Samsung Electronics, Vietnam",2026-03-22,ITEM-01,WSLRW-ATH,1.4,100,"SEVT Line 4"',
  ].join('\r\n'); // Test CRLF line endings

  const csvResult = await service.importCsv(
    { csvContent: complexCsv, overwriteExisting: true },
    'csv_uploader',
  );

  assert.strictEqual(csvResult.success, true);
  assert.strictEqual(csvResult.totalOrders, 2, 'CSV must yield 2 distinct Sales Orders');
  assert.strictEqual(csvResult.totalItems, 3, 'CSV must yield 3 total item lines');

  // Check Order 1: Multi-item grouping and escaped quotes handling
  const csvSo1 = csvResult.orders.find((o) => o.soCode === 'SO-CSV-7001');
  assert.ok(csvSo1, 'SO-CSV-7001 must exist');
  assert.strictEqual(csvSo1.customer, 'Daviteq Partner, Inc.', 'Customer with comma inside quotes must be parsed intact');
  assert.strictEqual(csvSo1.items.length, 2, 'SO-CSV-7001 must group 2 items');

  const csvItem1 = csvSo1.items.find((i) => i.itemCode === 'ITEM-01');
  assert.ok(csvItem1, 'ITEM-01 must exist');
  assert.strictEqual(csvItem1.quantity, 50);
  assert.strictEqual(
    csvItem1.notes,
    'Special batch "Alpha-01" with pre-flashed keys',
    'Escaped double quotes "" must be unescaped to single quote "',
  );

  const csvItem2 = csvSo1.items.find((i) => i.itemCode === 'ITEM-02');
  assert.ok(csvItem2, 'ITEM-02 must exist');
  assert.strictEqual(csvItem2.notes, 'Standard calibration, cleanroom', 'Notes with comma inside quotes must be parsed intact');

  // Check Order 2
  const csvSo2 = csvResult.orders.find((o) => o.soCode === 'SO-CSV-7002');
  assert.ok(csvSo2, 'SO-CSV-7002 must exist');
  assert.strictEqual(csvSo2.customer, 'Samsung Electronics, Vietnam');
  assert.strictEqual(csvSo2.items.length, 1);
  assert.strictEqual(csvSo2.items[0].quantity, 100);

  // CSV overwrite test
  const updateCsv = [
    'soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes',
    'SO-CSV-7002,"Samsung Electronics, Vietnam",2026-03-22,ITEM-01,WSLRW-ATH,1.4,120,"Updated quantity to 120"',
  ].join('\n');

  const overwriteRes = await service.importCsv(
    { csvContent: updateCsv, overwriteExisting: true },
    'csv_uploader',
  );
  assert.strictEqual(overwriteRes.success, true);
  const updatedCsvSo = await service.findOne('SO-CSV-7002');
  assert.strictEqual(updatedCsvSo?.items[0].quantity, 120, 'Quantity must be updated to 120 when overwriteExisting=true');

  // CSV Validation: Empty content throws BadRequestException
  await assert.rejects(
    async () => {
      await service.importCsv({ csvContent: '   \n   ' });
    },
    (err: any) => err instanceof BadRequestException,
    'Empty CSV content must throw BadRequestException',
  );

  // CSV Validation: Header only without data rows throws BadRequestException
  await assert.rejects(
    async () => {
      await service.importCsv({ csvContent: 'soCode,customer,orderDate,itemCode,sku,quantity' });
    },
    (err: any) => err instanceof BadRequestException,
    'CSV without data rows must throw BadRequestException',
  );
  console.log('    ✓ CSV bulk parser (escaped quotes, commas inside fields, CRLF, multi-item grouping, overwrite) verified.');

  passedScenarios++;
  console.log('  -> PASS: Scenario 2 fully satisfied.\n');

  // ==========================================================================
  // SCENARIO 3: Template Waterfall Mapping (SKU+FW -> SKU base -> unassigned)
  // ==========================================================================
  console.log('----------------------------------------------------------------------');
  console.log('SCENARIO 3: Template Waterfall Mapping (SKU+FW -> SKU base -> unassigned)');
  console.log('----------------------------------------------------------------------');

  // 3.1 Level 1: SKU + FW Exact Match
  console.log('  [3.1] Waterfall Level 1: Exact SKU + Firmware Version match...');
  const exactMatch1 = await service.resolveTestTemplate('WSLRW-ATH', '1.4');
  assert.strictEqual(exactMatch1.matched, true);
  assert.strictEqual(exactMatch1.matchType, 'EXACT');
  assert.strictEqual(exactMatch1.template?.id, '11111111-1111-1111-1111-111111111111');
  assert.strictEqual(exactMatch1.template?.code, 'TT-WSLRW-ATH-1.4');

  const exactMatch2 = await service.resolveTestTemplate('WSLRW-ATH', '1.0');
  assert.strictEqual(exactMatch2.matched, true);
  assert.strictEqual(exactMatch2.matchType, 'EXACT');
  assert.strictEqual(exactMatch2.template?.id, '22222222-2222-2222-2222-222222222222');
  console.log('    ✓ Level 1 (Exact match) resolved correctly.');

  // 3.2 Level 2: SKU Base Fallback
  console.log('  [3.2] Waterfall Level 2: SKU Base Match fallback (when FW is unknown)...');
  // FW 2.8 has no exact template, should fallback to latest active WSLRW-ATH (which is v1.4 created in 2026)
  const baseMatch = await service.resolveTestTemplate('WSLRW-ATH', '2.8');
  assert.strictEqual(baseMatch.matched, true);
  assert.strictEqual(baseMatch.matchType, 'SKU_FALLBACK');
  assert.strictEqual(baseMatch.template?.id, '11111111-1111-1111-1111-111111111111');

  // Case insensitive match
  const caseInsensitiveMatch = await service.resolveTestTemplate('wslrw-clw', '1.0');
  assert.strictEqual(caseInsensitiveMatch.matched, true);
  assert.strictEqual(caseInsensitiveMatch.template?.id, '33333333-3333-3333-3333-333333333333');
  console.log('    ✓ Level 2 (SKU base fallback) resolved correctly with case insensitivity.');

  // 3.3 Level 3: Unassigned / Fallback null
  console.log('  [3.3] Waterfall Level 3: Unassigned / None fallback (when SKU is unrecognized)...');
  const noneMatch = await service.resolveTestTemplate('WSLRW-UNRELEASED-MODEM', '1.0');
  assert.strictEqual(noneMatch.matched, false);
  assert.strictEqual(noneMatch.matchType, 'NONE');
  assert.strictEqual(noneMatch.template, null);

  // Creating an item with unassigned SKU does not fail, templateId remains undefined
  const unassignedSo = await service.create({
    soCode: 'SO-WATERFALL-NONE',
    customer: 'Custom Client',
    items: [
      {
        itemCode: 'ITEM-UNASSIGNED',
        sku: 'CUSTOM-PROTOTYPE',
        firmwareVersion: '0.1',
        quantity: 1,
      },
    ],
  });
  assert.strictEqual(unassignedSo.items[0].templateId, undefined);
  console.log('    ✓ Level 3 (Unassigned) verified: templateId left undefined without throwing error.');

  // 3.4 Explicit templateId override preservation
  console.log('  [3.4] Explicit templateId override preservation...');
  const explicitSo = await service.create({
    soCode: 'SO-EXPLICIT-TPL',
    customer: 'Override Client',
    items: [
      {
        itemCode: 'ITEM-EXPLICIT',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.4',
        templateId: '33333333-3333-3333-3333-333333333333', // explicitly assign CLW template
        quantity: 5,
      },
    ],
  });
  assert.strictEqual(
    explicitSo.items[0].templateId,
    '33333333-3333-3333-3333-333333333333',
    'Explicit templateId must be preserved and not overwritten by waterfall',
  );
  console.log('    ✓ Explicit templateId override preserved.');

  // 3.5 Controller Endpoint: resolveTestTemplate
  console.log('  [3.5] Controller endpoint resolveTemplate check...');
  const ctrlResolve = await controller.resolveTemplate('WSLRW-ATH', '1.4');
  assert.strictEqual(ctrlResolve.matched, true);
  assert.strictEqual(ctrlResolve.matchType, 'EXACT');

  // Item test status query
  await service.create({
    soCode: 'SO-TEST-METRICS-001',
    customer: 'Factory Floor QA',
    items: [
      {
        itemCode: 'ITEM-ATH-01',
        sku: 'WSLRW-ATH',
        firmwareVersion: '1.4',
        quantity: 25,
      },
    ],
  });
  db.testSessions.push({
    id: 'session-so-metrics-01',
    sessionCode: 'TS-SO-TEST-METRICS-001',
    soCode: 'SO-TEST-METRICS-001',
    itemCode: 'ITEM-ATH-01',
    status: 'COMPLETED',
    totalDevices: 25,
    passedDevices: 24,
    failedDevices: 1,
  });

  const testStatus = await controller.getItemTestStatus('SO-TEST-METRICS-001', 'ITEM-ATH-01');
  assert.strictEqual(testStatus.soCode, 'SO-TEST-METRICS-001');
  assert.strictEqual(testStatus.itemCode, 'ITEM-ATH-01');
  assert.strictEqual(testStatus.targetQuantity, 25);
  assert.strictEqual(testStatus.testedQuantity, 25);
  assert.strictEqual(testStatus.passedQuantity, 24);
  assert.strictEqual(testStatus.failedQuantity, 1);
  assert.strictEqual(testStatus.progressPercentage, 100);
  console.log('    ✓ Controller mapping and D-Module test status queries verified.');

  passedScenarios++;
  console.log('  -> PASS: Scenario 3 fully satisfied.\n');

  // ==========================================================================
  // SCENARIO 4: Integration with C-Module registry and Control Panel view
  // ==========================================================================
  console.log('----------------------------------------------------------------------');
  console.log('SCENARIO 4: Integration with C-Module registry & Control Panel view');
  console.log('----------------------------------------------------------------------');

  // 4.1 C-Module Registry Verification
  console.log('  [4.1] Verifying C-Module registry entry in C_MODULES_REGISTRY...');
  const soCModule = C_MODULES_REGISTRY.find((m) => m.id === 'c-sales-orders');
  assert.ok(soCModule, 'c-sales-orders must be registered in C_MODULES_REGISTRY');
  assert.strictEqual(soCModule.code, 'C_MOD_SALES_ORDERS');
  assert.strictEqual(soCModule.routeHash, '#sales-orders');
  assert.strictEqual(soCModule.category, 'Governance');
  assert.strictEqual(soCModule.requiredPermission, 'sales_orders:read');
  assert.strictEqual(soCModule.title, 'Sales Orders & Item Codes');
  console.log('    ✓ C-Module registry metadata conforms to architectural specification.');

  // 4.2 Control Panel View HTML Integration
  console.log('  [4.2] Verifying Control Panel view imports and tab embedding...');
  const cpViewPath = path.resolve(__dirname, '../src/views/control-panel.view.ts');
  assert.ok(fs.existsSync(cpViewPath), 'control-panel.view.ts must exist');
  const cpViewSource = fs.readFileSync(cpViewPath, 'utf8');

  // Verify import
  assert.ok(
    cpViewSource.includes('SALES_ORDERS_TEMPLATE') &&
    cpViewSource.includes('SALES_ORDERS_MODALS') &&
    cpViewSource.includes('SALES_ORDERS_SCRIPT'),
    'control-panel.view.ts must import SALES_ORDERS_TEMPLATE, SALES_ORDERS_MODALS, and SALES_ORDERS_SCRIPT',
  );

  // Verify sidebar tab button
  assert.ok(
    cpViewSource.includes("switchTab('sales-orders')"),
    'control-panel.view.ts must have navigation button with switchTab(\'sales-orders\')',
  );

  // Verify main container v-show
  assert.ok(
    cpViewSource.includes("activeTab === 'sales-orders'"),
    'control-panel.view.ts must contain main container with v-show="activeTab === \'sales-orders\'"',
  );

  // Verify modal injection
  assert.ok(
    cpViewSource.includes('${SALES_ORDERS_MODALS}'),
    'control-panel.view.ts must inject ${SALES_ORDERS_MODALS}',
  );

  // Verify script injection
  assert.ok(
    cpViewSource.includes('${SALES_ORDERS_SCRIPT}'),
    'control-panel.view.ts must inject ${SALES_ORDERS_SCRIPT}',
  );
  console.log('    ✓ Control Panel view integrates sales-orders template, navigation, modals, and scripts.');

  // 4.3 Control Panel Module File Structure & UI Features
  console.log('  [4.3] Verifying C-Module sales-orders.module.ts UI features...');
  assert.ok(SALES_ORDERS_TEMPLATE && SALES_ORDERS_TEMPLATE.length > 500, 'SALES_ORDERS_TEMPLATE must be non-empty');
  assert.ok(SALES_ORDERS_MODALS && SALES_ORDERS_MODALS.length > 500, 'SALES_ORDERS_MODALS must be non-empty');
  assert.ok(SALES_ORDERS_SCRIPT && SALES_ORDERS_SCRIPT.length > 500, 'SALES_ORDERS_SCRIPT must be non-empty');

  // Key UI elements in template
  assert.ok(SALES_ORDERS_TEMPLATE.includes('Sales Orders & Item Codes'), 'Template must have module title');
  assert.ok(SALES_ORDERS_TEMPLATE.includes('openCreateSoModal'), 'Template must include Create SO button handler');
  assert.ok(SALES_ORDERS_TEMPLATE.includes('openImportSoModal'), 'Template must include Import button handler');
  assert.ok(SALES_ORDERS_TEMPLATE.includes('soSearchQuery'), 'Template must include search input binding');
  assert.ok(SALES_ORDERS_TEMPLATE.includes('soStatusFilter'), 'Template must include status filter dropdown');

  // Key UI elements in modals
  assert.ok(SALES_ORDERS_MODALS.includes('showCreateSoModal'), 'Modals must include manual SO creation modal');
  assert.ok(SALES_ORDERS_MODALS.includes('addCreateSoItemRow'), 'Creation modal must have dynamic item row add button');
  assert.ok(SALES_ORDERS_MODALS.includes('removeCreateSoItemRow'), 'Creation modal must have dynamic item row remove button');
  assert.ok(SALES_ORDERS_MODALS.includes('showImportSoModal'), 'Modals must include Odoo/CSV import modal');
  assert.ok(SALES_ORDERS_MODALS.includes("importActiveTab === 'odoo-json'"), 'Import modal must have Odoo JSON tab');
  assert.ok(SALES_ORDERS_MODALS.includes("importActiveTab === 'csv'"), 'Import modal must have CSV tab');
  assert.ok(SALES_ORDERS_MODALS.includes("importActiveTab === 'odoo-api'"), 'Import modal must have Odoo API tab');

  // Key script methods
  assert.ok(SALES_ORDERS_SCRIPT.includes('fetchSalesOrders'), 'Script must define fetchSalesOrders');
  assert.ok(SALES_ORDERS_SCRIPT.includes('submitCreateSo'), 'Script must define submitCreateSo');
  assert.ok(SALES_ORDERS_SCRIPT.includes('submitEditSo'), 'Script must define submitEditSo');
  assert.ok(SALES_ORDERS_SCRIPT.includes('submitImportOdooJson'), 'Script must define submitImportOdooJson');
  assert.ok(SALES_ORDERS_SCRIPT.includes('submitImportCsv'), 'Script must define submitImportCsv');
  assert.ok(SALES_ORDERS_SCRIPT.includes('submitSyncOdooApi'), 'Script must define submitSyncOdooApi');
  assert.ok(SALES_ORDERS_SCRIPT.includes('confirmDeleteSo'), 'Script must define confirmDeleteSo');
  assert.ok(SALES_ORDERS_SCRIPT.includes('inspectItemTestStatus'), 'Script must define inspectItemTestStatus');
  console.log('    ✓ All UI controls, dynamic item rows, multi-tab import, and script handlers verified.');

  // 4.4 Vue 3 Template Compilation Verification
  console.log('  [4.4] Verifying Vue 3 template compilation (0 errors)...');
  const vuePath = '/tmp/vue.global.js';
  if (fs.existsSync(vuePath)) {
    let vueCode = fs.readFileSync(vuePath, 'utf8');
    vueCode = vueCode.replace(
      'function decodeHtmlBrowser(raw, asAttr = false) {',
      'function decodeHtmlBrowser(raw, asAttr = false) { return raw.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\\\"").replace(/&#39;/g, "\\x27");',
    );
    const vueCtx = vm.createContext({ console });
    vm.runInContext(vueCode, vueCtx);

    const compileErrors: any[] = [];
    vueCtx.Vue.compile(SALES_ORDERS_TEMPLATE, {
      onError: (err: any) => compileErrors.push(err),
    });
    vueCtx.Vue.compile(SALES_ORDERS_MODALS, {
      onError: (err: any) => compileErrors.push(err),
    });

    assert.strictEqual(
      compileErrors.length,
      0,
      `Vue compilation failed with errors: ${JSON.stringify(compileErrors)}`,
    );
    console.log('    ✓ Vue.compile passed for SALES_ORDERS_TEMPLATE & SALES_ORDERS_MODALS with 0 errors.');
  } else {
    console.log('    (Skipping runtime Vue compile: /tmp/vue.global.js not present)');
  }

  // 4.5 English Standardization Check
  console.log('  [4.5] Checking 100% English UI standardization...');
  const vietnameseKeywords = ['Đơn hàng', 'Sản phẩm', 'Xóa đơn', 'Lưu thay đổi', 'Tạo mới', 'Nhập từ'];
  for (const kw of vietnameseKeywords) {
    assert.strictEqual(
      SALES_ORDERS_TEMPLATE.includes(kw),
      false,
      `SALES_ORDERS_TEMPLATE must not contain Vietnamese text '${kw}'`,
    );
    assert.strictEqual(
      SALES_ORDERS_MODALS.includes(kw),
      false,
      `SALES_ORDERS_MODALS must not contain Vietnamese text '${kw}'`,
    );
  }
  console.log('    ✓ 100% English UI standardization verified across all templates and modals.');

  passedScenarios++;
  console.log('  -> PASS: Scenario 4 fully satisfied.\n');

  // ==========================================================================
  // FINAL SUMMARY
  // ==========================================================================
  console.log('======================================================================');
  console.log(`ALL SCENARIOS PASSED: ${passedScenarios}/${totalScenarios} SUCCESSFUL!`);
  console.log('  1. CRUD Sales Orders & Item Codes (1-to-N hierarchy, cascade deletion) -> PASS');
  console.log('  2. Ingestion: Odoo JSON payload parsing, CSV bulk parser (escaped quotes, commas) -> PASS');
  console.log('  3. Template waterfall mapping (SKU+FW -> SKU base -> unassigned) -> PASS');
  console.log('  4. Integration with C-Module registry and Control Panel view -> PASS');
  console.log('======================================================================');
}

runAllTests().catch((err) => {
  console.error('❌ AUTOMATED TEST SUITE FAILED:', err);
  process.exit(1);
});
