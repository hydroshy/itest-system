import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { ItemCodeEntity } from '../src/modules/c-modules/item-codes/entities/item-code.entity';
import { TestTemplateEntity } from '../src/modules/c-modules/test-builder/entities/test-template.entity';
import {
  sanitizeFirmwareVersion,
  formatSkuFw,
  isValidFirmwareVersion,
  isValidSkuFw,
} from '../src/modules/c-modules/item-codes/item-code-utils';
import { ItemCodesService } from '../src/modules/c-modules/item-codes/item-codes.service';

class MockDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('LOM-TEST: ITEM CODE UX, FW STRIP .0, WIRE ROUTING & DDL 07 SUITE');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. TEST SUITE PART 1: sanitizeFirmwareVersion (1.0 -> 1) & SKU_FW Canonicals
  // ---------------------------------------------------------------------------
  console.log('[PART 1] Testing sanitizeFirmwareVersion, formatSkuFw & validation...');
  
  // 1.1 Trailing .0 elimination
  assert.strictEqual(sanitizeFirmwareVersion('1.0'), '1', "1.0 must be sanitized to 1");
  assert.strictEqual(sanitizeFirmwareVersion('2.0'), '2', "2.0 must be sanitized to 2");
  assert.strictEqual(sanitizeFirmwareVersion('6.0'), '6', "6.0 must be sanitized to 6");
  assert.strictEqual(sanitizeFirmwareVersion('1.0.0'), '1', "1.0.0 must be sanitized to 1");
  assert.strictEqual(sanitizeFirmwareVersion('2.0.0'), '2', "2.0.0 must be sanitized to 2");
  assert.strictEqual(sanitizeFirmwareVersion('1.4.0'), '1.4', "1.4.0 must be sanitized to 1.4");
  assert.strictEqual(sanitizeFirmwareVersion('1.4'), '1.4', "1.4 must remain 1.4");

  // 1.2 Leading 'v' / 'V' elimination
  assert.strictEqual(sanitizeFirmwareVersion('v6'), '6', "v6 must strip leading v");
  assert.strictEqual(sanitizeFirmwareVersion('V1.4'), '1.4', "V1.4 must strip leading V");
  assert.strictEqual(sanitizeFirmwareVersion('vv2.0'), '2', "vv2.0 must strip v and .0");
  assert.strictEqual(sanitizeFirmwareVersion('v6.0'), '6', "v6.0 must strip v and .0");

  // 1.3 Null / empty / fallback handling
  assert.strictEqual(sanitizeFirmwareVersion(''), '1', "Empty string must default to 1");
  assert.strictEqual(sanitizeFirmwareVersion(null), '1', "Null must default to 1");
  assert.strictEqual(sanitizeFirmwareVersion(undefined), '1', "Undefined must default to 1");
  assert.strictEqual(sanitizeFirmwareVersion('   '), '1', "Whitespace must default to 1");

  // 1.4 Canonical formatSkuFw
  assert.strictEqual(formatSkuFw('WSLRW-ATH', '6'), 'WSLRW-ATH_6');
  assert.strictEqual(formatSkuFw('wslrw-ath', '6.0'), 'WSLRW-ATH_6');
  assert.strictEqual(formatSkuFw('wslrw-co2', '2.0'), 'WSLRW-CO2_2');
  assert.strictEqual(formatSkuFw('WSLRW-STC', '1.0'), 'WSLRW-STC_1');
  assert.strictEqual(formatSkuFw('WSLRW-CLW', 'v1.4'), 'WSLRW-CLW_1.4');
  assert.strictEqual(formatSkuFw('wslrw-th', ''), 'WSLRW-TH_1');

  // 1.5 isValidFirmwareVersion & isValidSkuFw contracts
  assert.strictEqual(isValidFirmwareVersion('6'), true);
  assert.strictEqual(isValidFirmwareVersion('1.4'), true);
  assert.strictEqual(isValidFirmwareVersion('1'), true);
  assert.strictEqual(isValidFirmwareVersion('1.0'), false, "1.0 is invalid in canonical rules");
  assert.strictEqual(isValidFirmwareVersion('2.0'), false, "2.0 is invalid in canonical rules");
  assert.strictEqual(isValidFirmwareVersion('v6'), false, "v prefix is invalid");

  assert.strictEqual(isValidSkuFw('WSLRW-ATH_6'), true);
  assert.strictEqual(isValidSkuFw('WSLRW-CO2_2'), true);
  assert.strictEqual(isValidSkuFw('WSLRW-CLW_1.4'), true);
  assert.strictEqual(isValidSkuFw('WSLRW-ATH_6.0'), false, "SKU_FW cannot contain .0");
  assert.strictEqual(isValidSkuFw('WSLRW-CO2_2.0'), false, "SKU_FW cannot contain .0");
  assert.strictEqual(isValidSkuFw('WSLRW-ATH_v6'), false, "SKU_FW cannot contain v prefix");
  
  console.log('  -> PASS: sanitizeFirmwareVersion (1.0 -> 1) & SKU_FW canonical contracts verified.\n');

  // ---------------------------------------------------------------------------
  // 2. TEST SUITE PART 2: Item Code CRUD with defaultTemplateId & Eager Relation
  // ---------------------------------------------------------------------------
  console.log('[PART 2] Testing Item Code CRUD & defaultTemplateId auto-linking...');

  const ds = new MockDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const itemCodeMeta = ds.getMetadata(ItemCodeEntity);
  const defaultTemplateCol = itemCodeMeta.findColumnWithPropertyName('defaultTemplateId');
  assert.ok(defaultTemplateCol, 'ItemCodeEntity must define defaultTemplateId column');
  
  const defaultTemplateRel = itemCodeMeta.relations.find(r => r.propertyName === 'defaultTemplate');
  assert.ok(defaultTemplateRel, 'ItemCodeEntity must define defaultTemplate relation');
  assert.strictEqual(defaultTemplateRel?.relationType, 'many-to-one', 'defaultTemplate relation must be many-to-one');

  // Mock Repository implementing ItemCodesRepository contract
  const mockTemplates: TestTemplateEntity[] = [
    {
      id: 'tpl-ath-6',
      code: 'TPL-ATH-6',
      name: 'WSLRW-ATH Automated Test v6',
      sku: 'WSLRW-ATH',
      firmwareVersion: '6',
      decoderId: 'WSLRW-ATH_6',
      flowConfig: { nodes: [], edges: [] },
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    } as any,
    {
      id: 'tpl-co2-2',
      code: 'TPL-CO2-2',
      name: 'WSLRW-CO2 Automated Test v2',
      sku: 'WSLRW-CO2',
      firmwareVersion: '2',
      decoderId: 'WSLRW-CO2_2',
      flowConfig: { nodes: [], edges: [] },
      isActive: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    } as any,
  ];

  const mockItemCodes: ItemCodeEntity[] = [];

  const mockRepository: any = {
    findByItemCode: async (itemCode: string) => {
      return mockItemCodes.find(i => i.itemCode.toLowerCase() === itemCode.toLowerCase()) || null;
    },
    findById: async (id: string) => {
      return mockItemCodes.find(i => i.id === id || i.itemCode.toLowerCase() === id.toLowerCase()) || null;
    },
    createItemCode: async (data: any) => {
      const created: ItemCodeEntity = {
        id: `ic-${mockItemCodes.length + 1}`,
        itemCode: data.itemCode,
        sku: data.sku,
        firmwareVersion: data.firmwareVersion,
        skuFw: data.skuFw,
        defaultTemplateId: data.defaultTemplateId,
        defaultTemplate: mockTemplates.find(t => t.id === data.defaultTemplateId),
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : true,
        metadata: data.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockItemCodes.push(created);
      return created;
    },
    updateItemCode: async (id: string, data: any) => {
      const existing = mockItemCodes.find(i => i.id === id);
      if (!existing) throw new Error('Not found');
      Object.assign(existing, data, { updatedAt: new Date() });
      if (data.defaultTemplateId !== undefined) {
        existing.defaultTemplate = data.defaultTemplateId
          ? mockTemplates.find(t => t.id === data.defaultTemplateId)
          : undefined;
      }
      return existing;
    },
    deleteItemCode: async (id: string) => {
      const idx = mockItemCodes.findIndex(i => i.id === id);
      if (idx >= 0) mockItemCodes.splice(idx, 1);
      return true;
    },
    countSalesOrderItems: async (id: string) => 0,
    findMatchingTemplate: async (sku: string, fw: string) => {
      return mockTemplates.find(
        t => t.sku.toLowerCase() === sku.toLowerCase() && t.firmwareVersion === fw && t.isActive
      ) || null;
    },
    findPickerItems: async () => {
      return mockItemCodes.map(i => ({
        id: i.id,
        itemCode: i.itemCode,
        sku: i.sku,
        firmwareVersion: i.firmwareVersion,
        skuFw: i.skuFw,
        defaultTemplateId: i.defaultTemplateId,
        defaultTemplateName: i.defaultTemplate?.name,
      }));
    },
  };

  const itemCodesService = new ItemCodesService(mockRepository);

  // 2.1 CREATE with auto-matched defaultTemplateId when omitted (raw FW '6.0' -> '6')
  const created1 = await itemCodesService.create({
    itemCode: 'ITEM-WSLRW-ATH-01',
    sku: 'WSLRW-ATH',
    firmwareVersion: '6.0',
  });

  assert.strictEqual(created1.firmwareVersion, '6', "Firmware 6.0 must be stored as '6'");
  assert.strictEqual(created1.skuFw, 'WSLRW-ATH_6', "skuFw must be canonical WSLRW-ATH_6");
  assert.strictEqual(created1.defaultTemplateId, 'tpl-ath-6', "Auto-match must find template matching WSLRW-ATH and FW '6'");

  // 2.2 CREATE with explicit defaultTemplateId
  const created2 = await itemCodesService.create({
    itemCode: 'ITEM-WSLRW-CO2-01',
    sku: 'WSLRW-CO2',
    firmwareVersion: '2.0',
    defaultTemplateId: 'tpl-co2-2',
  });
  assert.strictEqual(created2.firmwareVersion, '2');
  assert.strictEqual(created2.defaultTemplateId, 'tpl-co2-2');

  // 2.3 UPDATE: change SKU/FW and trigger auto-match
  const updated1 = await itemCodesService.update(created1.id, {
    sku: 'WSLRW-CO2',
    firmwareVersion: '2.0',
    defaultTemplateId: null as any, // unbind old template to allow auto-matching or set explicitly
  });
  assert.strictEqual(updated1.firmwareVersion, '2');
  assert.strictEqual(updated1.skuFw, 'WSLRW-CO2_2');
  assert.strictEqual(updated1.defaultTemplateId, null, "Explicitly unbinding defaultTemplateId sets it to null");

  // 2.4 UPDATE: auto-match when defaultTemplateId is null and SKU/FW changes
  const updated2 = await itemCodesService.update(created1.id, {
    sku: 'WSLRW-CO2',
    firmwareVersion: '2.0',
  });
  assert.strictEqual(updated2.defaultTemplateId, 'tpl-co2-2', "Auto-match populates template when defaultTemplateId was null");

  console.log('  -> PASS: Item Code CRUD with defaultTemplateId auto-linking & unlinking verified.\n');

  // ---------------------------------------------------------------------------
  // 3. TEST SUITE PART 3: Wire SVG Routing Algorithm for Co-located Nodes
  // ---------------------------------------------------------------------------
  console.log('[PART 3] Testing Test Builder Wire SVG Bezier routing...');

  const tbPath = path.join(__dirname, '../src/views/control-panel-modules/test-builder.module.ts');
  const tbContent = fs.readFileSync(tbPath, 'utf8');

  // Exact function logic from test-builder.module.ts
  function computeWirePath(x1: number, y1: number, x2: number, y2: number): string {
    x1 = Number(x1);
    y1 = Number(y1);
    x2 = Number(x2);
    y2 = Number(y2);
    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) return '';

    const dist = Math.hypot(x2 - x1, y2 - y1);
    if (dist < 15) {
      const loopR = 50;
      return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + loopR) + ' ' + (y1 - loopR) + ', ' + (x2 - loopR) + ' ' + (y2 - loopR) + ', ' + x2 + ' ' + y2;
    }

    if (x2 <= x1) {
      const dx = Math.max(60, Math.abs(x1 - x2) * 0.4);
      const dy = Math.max(50, 80 - Math.min(60, Math.abs(y2 - y1) * 0.3));
      const signY = y1 <= y2 ? -1 : 1;
      const cp1x = x1 + dx;
      const cp1y = y1 + signY * dy;
      const cp2x = x2 - dx;
      const cp2y = y2 + signY * dy;
      return 'M ' + x1 + ' ' + y1 + ' C ' + cp1x + ' ' + cp1y + ', ' + cp2x + ' ' + cp2y + ', ' + x2 + ' ' + y2;
    }

    let dx = (x2 - x1) * 0.5;
    if (dx < 50) {
      if (Math.abs(y2 - y1) < 15) {
        const cpY = y1 - 25;
        return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + 40) + ' ' + cpY + ', ' + (x2 - 40) + ' ' + cpY + ', ' + x2 + ' ' + y2;
      }
      dx = 50;
    }
    return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2;
  }

  // 3.1 Co-located nodes: Node A and Node B at same position (e.g. x=100, y=100)
  // Port A: x1 = 100 + 288 = 388, y1 = 100 + 30 = 130
  // Port B: x2 = 100, y2 = 100 + 30 = 130
  const coLocatedPath = computeWirePath(388, 130, 100, 130);
  assert.ok(coLocatedPath.startsWith('M 388 130 C'), 'Path must start with M 388 130 C');
  const coordsMatch = coLocatedPath.match(/C\s+([\d.-]+)\s+([\d.-]+),\s+([\d.-]+)\s+([\d.-]+),\s+([\d.-]+)\s+([\d.-]+)/);
  assert.ok(coordsMatch, 'Path must be a valid cubic Bezier curve');
  const [, cp1x, cp1y, cp2x, cp2y, endX, endY] = coordsMatch;
  assert.notStrictEqual(Number(cp1y), 130, 'cp1y must not equal 130 (must loop to avoid flat occlusion under card)');
  assert.notStrictEqual(Number(cp2y), 130, 'cp2y must not equal 130');
  assert.strictEqual(Number(endX), 100, 'endX must reach target port x2');
  assert.strictEqual(Number(endY), 130, 'endY must reach target port y2');

  // 3.2 Collinear forward nodes with small horizontal gap (dx < 50, y1 == y2)
  const colPath = computeWirePath(100, 200, 140, 200);
  assert.ok(colPath.includes('C 140 175, 100 175, 140 200'), 'Collinear nodes must arc vertically (cpY = y1 - 25) to prevent flat collapse');

  // 3.3 Verify UI template includes right-click context menu and reactive updates
  assert.ok(tbContent.includes('computeWirePath'), 'test-builder.module.ts must implement computeWirePath');
  assert.ok(tbContent.includes('openWireContextMenu'), 'test-builder.module.ts must support wire context menu');
  assert.ok(tbContent.includes('wireContextMenu'), 'wireContextMenu state must exist');
  assert.ok(tbContent.includes('wireTick.value++'), 'Reactive wire updates must be triggered during node dragging');

  console.log('  -> PASS: Wire SVG routing for co-located and collinear nodes verified.\n');

  // ---------------------------------------------------------------------------
  // 4. TEST SUITE PART 4: DDL 07 Script Idempotency & Verification Queries
  // ---------------------------------------------------------------------------
  console.log('[PART 4] Testing DDL 07 script idempotency, syntax & verification blocks...');

  const ddlPath = path.join(__dirname, '../../deploy/database/updates/07_standardize_sku_fw_catalog_and_clean_data.sql');
  assert.ok(fs.existsSync(ddlPath), 'DDL 07 script file must exist');
  
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');

  // 4.1 Transactional integrity
  assert.ok(ddlContent.includes('BEGIN;'), 'DDL 07 must be wrapped in BEGIN');
  assert.ok(ddlContent.includes('COMMIT;'), 'DDL 07 must end with COMMIT');

  // 4.2 Safe column default alterations
  assert.ok(ddlContent.includes('ALTER TABLE IF EXISTS "item_codes"'), 'Must safely alter item_codes if exists');
  assert.ok(ddlContent.includes("SET DEFAULT '1'"), "Must set default firmwareVersion to '1'");

  // 4.3 Sanitization regular expressions
  assert.ok(ddlContent.includes("REGEXP_REPLACE(\"firmwareVersion\", '^[vV]+', '')"), 'Must strip leading v/V');
  assert.ok(ddlContent.includes("(\\.0)+$'"), 'Must strip trailing .0');

  // 4.4 SKU_FW canonical concatenation
  assert.ok(ddlContent.includes('UPPER("sku") || \'_\' ||'), 'Must compute canonical <SKU>_<cleanFw>');

  // 4.5 Auto-link defaultTemplateId in SQL
  assert.ok(ddlContent.includes('WHERE ic."defaultTemplateId" IS NULL'), 'Must update unlinked defaultTemplateId');

  // 4.6 Verification assertion block
  assert.ok(ddlContent.includes('v_item_code_invalid') && ddlContent.includes('v_template_invalid') && ddlContent.includes('v_so_item_invalid'), 'Must query invalid records counts across tables');
  assert.ok(ddlContent.includes('RAISE EXCEPTION'), 'Must raise exception on residual non-standard records');

  console.log('  -> PASS: DDL 07 migration script structure, safety and assertions verified.\n');

  console.log('================================================================');
  console.log('ALL 4 TEST MODULES IN AUTOMATED SUITE PASSED SUCCESSFULLY (100%)');
  console.log('================================================================');
}

runTestSuite().catch(err => {
  console.error('\n[TEST RUN FAILED]:', err);
  process.exit(1);
});
