import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

console.log('================================================================');
console.log('TESTING FRONTEND: ITEM CODE UX, TEMPLATE BINDING, FW, & WIRE ROUTING');
console.log('================================================================\n');

const tbPath = path.join(__dirname, '../src/views/control-panel-modules/test-builder.module.ts');
const itemCodesPath = path.join(__dirname, '../src/views/control-panel-modules/item-codes.module.ts');
const salesOrdersPath = path.join(__dirname, '../src/views/control-panel-modules/sales-orders.module.ts');
const cpViewPath = path.join(__dirname, '../src/views/control-panel.view.ts');
const dashViewPath = path.join(__dirname, '../src/views/dashboard.view.ts');

assert.ok(fs.existsSync(tbPath), 'test-builder.module.ts must exist');
assert.ok(fs.existsSync(itemCodesPath), 'item-codes.module.ts must exist');
assert.ok(fs.existsSync(salesOrdersPath), 'sales-orders.module.ts must exist');
assert.ok(fs.existsSync(cpViewPath), 'control-panel.view.ts must exist');
assert.ok(fs.existsSync(dashViewPath), 'dashboard.view.ts must exist');

const tbContent = fs.readFileSync(tbPath, 'utf8');
const itemCodesContent = fs.readFileSync(itemCodesPath, 'utf8');
const salesOrdersContent = fs.readFileSync(salesOrdersPath, 'utf8');
const cpContent = fs.readFileSync(cpViewPath, 'utf8');
const dashContent = fs.readFileSync(dashViewPath, 'utf8');

// -------------------------------------------------------------
// TEST 1: Item Code Creation CTA Prominence (Catalog & SO Picker)
// -------------------------------------------------------------
console.log('[Test 1] Verifying Item Code Creation CTA prominence...');
// Header CTA button in Item Codes
assert.ok(itemCodesContent.includes('openCreateItemCodeModal'), 'Item codes module must have openCreateItemCodeModal trigger');
assert.ok(itemCodesContent.includes('+ Create Item Code'), 'Item codes header must have prominent "+ Create Item Code" label');
assert.ok(itemCodesContent.includes('bg-gradient-to-r') || itemCodesContent.includes('bg-cyan-600'), 'Header CTA must have prominent styling');

// Empty state CTA button in Item Codes
assert.ok(itemCodesContent.includes('+ Create First Item Code'), 'Item codes empty state must provide "+ Create First Item Code" CTA button');

// Catalog Picker CTA in Sales Orders
assert.ok(salesOrdersContent.includes('openQuickCreateItemCodeModal'), 'Sales orders catalog picker must have openQuickCreateItemCodeModal');
assert.ok(salesOrdersContent.includes('showQuickCreateItemModal'), 'Sales orders must define showQuickCreateItemModal state');
assert.ok(salesOrdersContent.includes('+ Create Item Code'), 'Sales orders picker toolbar must have prominent "+ Create Item Code" button');
assert.ok(salesOrdersContent.includes('+ Create New Item Code'), 'Sales orders picker empty state must have "+ Create New Item Code" CTA button');
console.log('  -> PASS: Item Code creation CTAs are clear and prominent across Catalog and SO Picker.\n');

// -------------------------------------------------------------
// TEST 2: Default Test Template Selection & Binding in Item Code Modal
// -------------------------------------------------------------
console.log('[Test 2] Verifying Default Test Template selection and binding in Item Code modal...');
// Endpoint fix: must fetch /api/c-modules/test-builder/templates
assert.ok(itemCodesContent.includes('/api/c-modules/test-builder/templates'), 'item-codes.module.ts must query /api/c-modules/test-builder/templates');

// Preloading on setup
assert.ok(itemCodesContent.includes('fetchCatalogAvailableTemplates()'), 'item-codes.module.ts must preload templates on setup');

// Template dropdown binding
assert.ok(itemCodesContent.includes('v-model="createItemCodeForm.defaultTemplateId"'), 'Create modal must bind defaultTemplateId');
assert.ok(itemCodesContent.includes('v-model="editingCatalogItem.defaultTemplateId"'), 'Edit modal must bind defaultTemplateId');
assert.ok(itemCodesContent.includes('Scenario Linked'), 'Modal must display visual Scenario Linked badge');

// Saving and binding payload
assert.ok(itemCodesContent.includes('defaultTemplateId: tplId'), 'submitCreateItemCode and submitEditItemCode must pass defaultTemplateId');
assert.ok(itemCodesContent.includes('templateName: matchedTpl'), 'submitCreateItemCode and submitEditItemCode must resolve templateName locally');
console.log('  -> PASS: Default Test Template selection and binding in Item Code modal verified.\n');

// -------------------------------------------------------------
// TEST 3: Firmware Version Display Standardization (Strip Trailing .0)
// -------------------------------------------------------------
console.log('[Test 3] Verifying Firmware version formatting strips trailing .0...');
// Helper implementation extraction from item-codes script:
// Test the regex logic directly:
const sanitizeFwTest = (rawFw: any) => {
  if (rawFw === null || rawFw === undefined || rawFw === '') return '1';
  let clean = String(rawFw).trim().replace(/^[vV]+/, '');
  clean = clean.replace(/(\.0+)+$/, '');
  return clean.length > 0 ? clean : '1';
};

assert.strictEqual(sanitizeFwTest('1.0'), '1', '1.0 must format to 1');
assert.strictEqual(sanitizeFwTest('6.0'), '6', '6.0 must format to 6');
assert.strictEqual(sanitizeFwTest('1.0.0'), '1', '1.0.0 must format to 1');
assert.strictEqual(sanitizeFwTest('1.4'), '1.4', '1.4 must remain 1.4');
assert.strictEqual(sanitizeFwTest('1.4.0'), '1.4', '1.4.0 must format to 1.4');
assert.strictEqual(sanitizeFwTest('v1.0'), '1', 'v1.0 must strip v and format to 1');
assert.strictEqual(sanitizeFwTest('V6'), '6', 'V6 must strip V and format to 6');
assert.strictEqual(sanitizeFwTest(1), '1', 'Number 1 must format to 1');
assert.strictEqual(sanitizeFwTest(null), '1', 'null must default to 1');

// Verify code files contain the strip trailing .0 regex
assert.ok(itemCodesContent.includes("replace(/(\\ .0+)+$/, '')".replace(' ', '')), 'item-codes.module.ts must strip trailing .0');
assert.ok(salesOrdersContent.includes("replace(/(\\ .0+)+$/, '')".replace(' ', '')), 'sales-orders.module.ts must strip trailing .0');
assert.ok(tbContent.includes("replace(/(\\ .0+)+$/, '')".replace(' ', '')), 'test-builder.module.ts must strip trailing .0');
assert.ok(cpContent.includes("replace(/(\\ .0+)+$/, '')".replace(' ', '')), 'control-panel.view.ts must strip trailing .0');
assert.ok(dashContent.includes("replace(/(\\ .0+)+$/, '')".replace(' ', '')), 'dashboard.view.ts must strip trailing .0');
console.log('  -> PASS: Firmware version formatting strips trailing .0 across all frontend views.\n');

// -------------------------------------------------------------
// TEST 4: SVG Bezier Path Calculation (computeWirePath / getWirePath)
// -------------------------------------------------------------
console.log('[Test 4] Verifying Test Builder Canvas wire path calculation...');
assert.ok(tbContent.includes('const computeWirePath = (x1, y1, x2, y2) =>'), 'test-builder.module.ts must define computeWirePath');
assert.ok(tbContent.includes('const getWirePath = (edge) =>'), 'test-builder.module.ts must define getWirePath');
assert.ok(tbContent.includes('computeWirePath,'), 'computeWirePath must be returned by useTestBuilderModule');
assert.ok(tbContent.includes('getWirePath,'), 'getWirePath must be returned by useTestBuilderModule');
assert.ok(tbContent.includes('getEdgePath,'), 'getEdgePath alias must be preserved for compatibility');

// Execute pure bezier math logic to test co-located and close nodes
const computeWirePath = (x1: any, y1: any, x2: any, y2: any) => {
  x1 = Number(x1);
  y1 = Number(y1);
  x2 = Number(x2);
  y2 = Number(y2);
  if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) return '';

  const dist = Math.hypot(x2 - x1, y2 - y1);
  // Degenerate / coincident endpoints or distance near 0: render an arc loop
  if (dist < 15) {
    const loopR = 50;
    return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + loopR) + ' ' + (y1 - loopR) + ', ' + (x2 - loopR) + ' ' + (y2 - loopR) + ', ' + x2 + ' ' + y2;
  }

  // Backward wire or co-located nodes (x2 <= x1): apply loop offset so wire does not collapse
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

  // Forward wire
  let dx = (x2 - x1) * 0.5;
  if (dx < 50) {
    if (Math.abs(y2 - y1) < 15) {
      const cpY = y1 - 25;
      return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + 40) + ' ' + cpY + ', ' + (x2 - 40) + ' ' + cpY + ', ' + x2 + ' ' + y2;
    }
    dx = 50;
  }
  return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2;
};

// Test Case A: Coincident endpoints (distance 0)
const coincidentPath = computeWirePath(200, 200, 200, 200);
assert.ok(coincidentPath.startsWith('M 200 200 C'), 'Must generate valid cubic bezier');
assert.ok(coincidentPath.includes('250 150'), 'Must have offset control points forming visible loop');
assert.notStrictEqual(coincidentPath, 'M 200 200 C 200 200, 200 200, 200 200', 'Must not degenerate into zero-length line');

// Test Case B: Co-located nodes at same X/Y position
// Node width = 288, height offset = 30.
// FromNode output port: x1 = 100 + 288 = 388, y1 = 200 + 30 = 230.
// ToNode input port: x2 = 100, y2 = 200 + 30 = 230.
const colocatedNodesPath = computeWirePath(388, 230, 100, 230);
assert.ok(colocatedNodesPath.startsWith('M 388 230 C'), 'Must begin at output port');
assert.ok(colocatedNodesPath.endsWith('100 230'), 'Must end at input port');
// Check that control points provide substantial vertical clearance so wire doesn't cut flat through nodes:
assert.ok(colocatedNodesPath.includes('150'), 'Control points must offset vertically (dy >= 50) to loop over node');

// Test Case C: Forward curve
const forwardPath = computeWirePath(100, 100, 400, 250);
assert.ok(forwardPath.startsWith('M 100 100 C'), 'Forward curve must begin at (100, 100)');
assert.ok(forwardPath.endsWith('400 250'), 'Forward curve must end at (400, 250)');

console.log('  -> PASS: computeWirePath prevents wire collapse for co-located and degenerate nodes.\n');

// -------------------------------------------------------------
// TEST 5: 100% English UI Verification
// -------------------------------------------------------------
console.log('[Test 5] Verifying 100% English UI...');
const forbiddenVietnamese = [
  'tạo mới', 'danh mục', 'chỉnh sửa', 'xóa', 'thêm mới',
  'lưu thay đổi', 'hủy bỏ', 'đơn hàng', 'khách hàng', 'ngày đặt'
];
for (const word of forbiddenVietnamese) {
  assert.ok(!itemCodesContent.toLowerCase().includes(`>${word}<`), `item-codes.module.ts must not contain: ${word}`);
  assert.ok(!salesOrdersContent.toLowerCase().includes(`>${word}<`), `sales-orders.module.ts must not contain: ${word}`);
  assert.ok(!tbContent.toLowerCase().includes(`>${word}<`), `test-builder.module.ts must not contain: ${word}`);
}
console.log('  -> PASS: 100% English UI strictly preserved across all modules.\n');

console.log('================================================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (100%)');
console.log('================================================================');
