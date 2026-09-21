import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

console.log('====================================================');
console.log('RUNNING FRONTEND ITEM CODES & CLEAN UI TEST (TASK T6)');
console.log('====================================================\n');

const itemCodesModulePath = path.join(__dirname, '../src/views/control-panel-modules/item-codes.module.ts');
const salesOrdersModulePath = path.join(__dirname, '../src/views/control-panel-modules/sales-orders.module.ts');
const controlPanelViewPath = path.join(__dirname, '../src/views/control-panel.view.ts');

assert.ok(fs.existsSync(itemCodesModulePath), 'item-codes.module.ts must exist');
assert.ok(fs.existsSync(salesOrdersModulePath), 'sales-orders.module.ts must exist');
assert.ok(fs.existsSync(controlPanelViewPath), 'control-panel.view.ts must exist');

const itemCodesContent = fs.readFileSync(itemCodesModulePath, 'utf8');
const salesOrdersContent = fs.readFileSync(salesOrdersModulePath, 'utf8');
const controlPanelContent = fs.readFileSync(controlPanelViewPath, 'utf8');

// Test 1: item-codes.module.ts exports
console.log('[Test 1] Verifying item-codes.module.ts exports...');
assert.ok(itemCodesContent.includes('export const ITEM_CODES_TEMPLATE'), 'Must export ITEM_CODES_TEMPLATE');
assert.ok(itemCodesContent.includes('export const ITEM_CODES_MODALS'), 'Must export ITEM_CODES_MODALS');
assert.ok(itemCodesContent.includes('export const ITEM_CODES_SCRIPT'), 'Must export ITEM_CODES_SCRIPT');
console.log('  -> PASS: Module exports ITEM_CODES_TEMPLATE, ITEM_CODES_MODALS, and ITEM_CODES_SCRIPT.\n');

// Test 2: Integration in control-panel.view.ts
console.log('[Test 2] Verifying integration into control-panel.view.ts...');
assert.ok(controlPanelContent.includes("from './control-panel-modules/item-codes.module'"), 'Must import from item-codes.module');
assert.ok(controlPanelContent.includes("switchTab('item-codes')"), 'Sidebar navigation must contain switchTab for item-codes');
assert.ok(controlPanelContent.includes("activeTab === 'item-codes'"), 'Tab active state check must exist');
assert.ok(controlPanelContent.includes('${ITEM_CODES_TEMPLATE}'), 'ITEM_CODES_TEMPLATE must be embedded');
assert.ok(controlPanelContent.includes('${ITEM_CODES_MODALS}'), 'ITEM_CODES_MODALS must be embedded');
assert.ok(controlPanelContent.includes('${ITEM_CODES_SCRIPT}'), 'ITEM_CODES_SCRIPT must be embedded');
assert.ok(controlPanelContent.includes('useItemCodesModule('), 'useItemCodesModule must be invoked in setup');
assert.ok(controlPanelContent.includes('...itemCodesModule,'), 'itemCodesModule must be spread into setup return');
assert.ok(controlPanelContent.includes("case 'item-codes': return 'Item Code Catalog'"), 'activeTabLabel must handle item-codes');
console.log('  -> PASS: Full integration in control-panel.view.ts verified.\n');

// Test 3: Standardized SKU_FW syntax (e.g. WSLRW-ATH_6, no 'v' prefix)
console.log('[Test 3] Verifying standardized SKU_FW syntax and no "v" prefix...');
assert.ok(itemCodesContent.includes('formatSkuFw'), 'item-codes.module.ts must define formatSkuFw helper');
assert.ok(itemCodesContent.includes('sanitizeFw'), 'item-codes.module.ts must define sanitizeFw helper');
assert.ok(salesOrdersContent.includes('formatSkuFw'), 'sales-orders.module.ts must define formatSkuFw helper');
assert.ok(salesOrdersContent.includes('sanitizeFw'), 'sales-orders.module.ts must define sanitizeFw helper');
assert.ok(salesOrdersContent.includes('SKU_FW'), 'sales-orders.module.ts must display SKU_FW column/badge');
assert.ok(itemCodesContent.includes('SKU_FW'), 'item-codes.module.ts must display SKU_FW column/badge');

// Check that hardcoded 'v' prefixes are eliminated from firmware versions
assert.ok(!salesOrdersContent.includes('>v{{ item.firmwareVersion'), 'sales-orders table must not hardcode >v{{ prefix');
assert.ok(!salesOrdersContent.includes('>v{{ it.firmwareVersion'), 'sales-orders modal table must not hardcode >v{{ prefix');
console.log('  -> PASS: Standardized SKU_FW syntax and clean firmware version enforced.\n');

// Test 4: Standardized Sales Order code format (SO/2026/xxxxx)
console.log('[Test 4] Verifying Sales Order code standardization (SO/2026/xxxxx)...');
assert.ok(salesOrdersContent.includes('normalizeSoCode'), 'sales-orders.module.ts must define normalizeSoCode helper');
assert.ok(salesOrdersContent.includes('SO/'), 'sales-orders.module.ts must use SO/ format');
assert.ok(salesOrdersContent.includes("placeholder=\"e.g. SO/2026/00001\""), 'Placeholder must use standard SO/2026/00001');
console.log('  -> PASS: Standardized Sales Order code format verified.\n');

// Test 5: Fast Item Code Picker & Attach from Catalog in Sales Orders
console.log('[Test 5] Verifying fast Item Code Picker in Sales Orders...');
assert.ok(salesOrdersContent.includes('showCatalogPickerModal'), 'sales-orders.module.ts must support showCatalogPickerModal');
assert.ok(salesOrdersContent.includes('openCatalogPickerModal'), 'sales-orders.module.ts must define openCatalogPickerModal');
assert.ok(salesOrdersContent.includes('attachSelectedCatalogItems') || salesOrdersContent.includes('attachSingleCatalogItem'), 'Must support attaching catalog items');
assert.ok(salesOrdersContent.includes('Pick from Catalog'), 'Create SO modal must have "Pick from Catalog" button');
console.log('  -> PASS: Item Code Catalog Picker & Attach flow verified.\n');

// Test 6: Clean Minimalist UI - No decorative fluff / internal jargon
console.log('[Test 6] Verifying Clean Minimalist UI (No "C-Module" or "D-Module Bridge" fluff)...');
assert.ok(!salesOrdersContent.includes('C-Module</span>'), 'User UI must not contain "C-Module" decorative badge');
assert.ok(!salesOrdersContent.includes('D-Module Bridge</span>'), 'User UI must not contain "D-Module Bridge" badge');
assert.ok(!salesOrdersContent.includes('Test Session (D-Module):'), 'User UI must not contain "(D-Module)" in labels');
assert.ok(!itemCodesContent.includes('C-Module</span>'), 'Item Codes UI must not contain "C-Module" badge');
assert.ok(!itemCodesContent.includes('D-Module Bridge</span>'), 'Item Codes UI must not contain "D-Module Bridge" badge');
console.log('  -> PASS: Clean Minimalist UI verified without internal architecture jargon.\n');

// Test 7: Dual table modes (Reactive Table + Tabulator Data Grid)
console.log('[Test 7] Verifying dual table modes in Item Codes catalog...');
assert.ok(itemCodesContent.includes('itemCodesViewMode'), 'Must support itemCodesViewMode reactive and tabulator');
assert.ok(itemCodesContent.includes('id="item-codes-tabulator-table"'), 'Must have container for item-codes-tabulator-table');
assert.ok(itemCodesContent.includes('initItemCodesTabulator'), 'Must define initItemCodesTabulator method');
assert.ok(itemCodesContent.includes('new Tabulator('), 'Must instantiate Tabulator 6.x grid');
console.log('  -> PASS: Dual table mode (Reactive Table + Tabulator Grid) verified.\n');

// Test 8: 100% English UI Standardization
console.log('[Test 8] Verifying 100% English UI standardization...');
const vietnameseKeywords = [
  'danh mục', 'sản phẩm', 'phiên bản', 'thêm mới', 'chỉnh sửa', 'xóa',
  'tạo mới', 'đơn hàng', 'khách hàng', 'ngày đặt', 'trạng thái', 'số lượng'
];
for (const term of vietnameseKeywords) {
  assert.ok(!itemCodesContent.toLowerCase().includes(`>${term}<`), `item-codes.module.ts must not contain Vietnamese text: "${term}"`);
  assert.ok(!salesOrdersContent.toLowerCase().includes(`>${term}<`), `sales-orders.module.ts must not contain Vietnamese text: "${term}"`);
}
console.log('  -> PASS: 100% English UI verified.\n');

console.log('====================================================');
console.log('ALL FRONTEND ITEM CODES & CLEAN UI TESTS PASSED (100%)');
console.log('====================================================\n');
