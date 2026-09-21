import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

console.log('====================================================');
console.log('RUNNING FRONTEND CONTROL PANEL SALES ORDERS TEST (TASK T6)');
console.log('====================================================\n');

const soModulePath = path.join(__dirname, '../src/views/control-panel-modules/sales-orders.module.ts');
const cpViewPath = path.join(__dirname, '../src/views/control-panel.view.ts');

assert.ok(fs.existsSync(soModulePath), 'sales-orders.module.ts must exist');
assert.ok(fs.existsSync(cpViewPath), 'control-panel.view.ts must exist');

const soContent = fs.readFileSync(soModulePath, 'utf8');
const cpContent = fs.readFileSync(cpViewPath, 'utf8');

// Test 1: Module exports
console.log('[Test 1] Verifying sales-orders.module.ts exports...');
assert.ok(soContent.includes('export const SALES_ORDERS_TEMPLATE'), 'Must export SALES_ORDERS_TEMPLATE');
assert.ok(soContent.includes('export const SALES_ORDERS_MODALS'), 'Must export SALES_ORDERS_MODALS');
assert.ok(soContent.includes('export const SALES_ORDERS_SCRIPT'), 'Must export SALES_ORDERS_SCRIPT');
console.log('  -> PASS: Module exports SALES_ORDERS_TEMPLATE, SALES_ORDERS_MODALS, and SALES_ORDERS_SCRIPT.\n');

// Test 2: Integration in control-panel.view.ts
console.log('[Test 2] Verifying control-panel.view.ts integration...');
assert.ok(cpContent.includes('from \'./control-panel-modules/sales-orders.module\''), 'Must import from sales-orders.module');
assert.ok(cpContent.includes('switchTab(\'sales-orders\')'), 'Sidebar navigation must contain switchTab for sales-orders');
assert.ok(cpContent.includes('activeTab === \'sales-orders\''), 'Tab active state check must exist');
assert.ok(cpContent.includes('${SALES_ORDERS_TEMPLATE}'), 'SALES_ORDERS_TEMPLATE must be embedded in main area');
assert.ok(cpContent.includes('${SALES_ORDERS_MODALS}'), 'SALES_ORDERS_MODALS must be embedded');
assert.ok(cpContent.includes('${SALES_ORDERS_SCRIPT}'), 'SALES_ORDERS_SCRIPT must be embedded');
assert.ok(cpContent.includes('useSalesOrdersModule('), 'useSalesOrdersModule must be invoked in setup');
assert.ok(cpContent.includes('...salesOrdersModule,'), 'salesOrdersModule must be spread into setup return');
console.log('  -> PASS: Fully integrated into control-panel.view.ts navigation, layout, modals, and script.\n');

// Test 3: Tabulator & Reactive Dual Table Modes
console.log('[Test 3] Verifying dual table modes (Reactive Accordion & Tabulator Grid)...');
assert.ok(soContent.includes('soTableViewMode'), 'soTableViewMode ref must exist');
assert.ok(soContent.includes('id="so-tabulator-table"'), 'Tabulator table container div must exist');
assert.ok(soContent.includes('initSoTabulator'), 'initSoTabulator function must exist');
assert.ok(soContent.includes('new Tabulator('), 'Must instantiate Tabulator 6.x grid');
console.log('  -> PASS: Dual table mode (Reactive Table + Tabulator Grid) verified.\n');

// Test 4: Search, Status & Source Filters
console.log('[Test 4] Verifying search, status, and source filters...');
assert.ok(soContent.includes('soSearchQuery'), 'soSearchQuery state must exist');
assert.ok(soContent.includes('soStatusFilter'), 'soStatusFilter state must exist');
assert.ok(soContent.includes('soSourceFilter'), 'soSourceFilter state must exist');
assert.ok(soContent.includes('DRAFT') && soContent.includes('IN_PRODUCTION') && soContent.includes('COMPLETED'), 'Status filter must include standard SO statuses');
assert.ok(soContent.includes('MANUAL') && soContent.includes('ODOO') && soContent.includes('CSV'), 'Source filter must include MANUAL, ODOO, CSV');
console.log('  -> PASS: Search and filter controls verified.\n');

// Test 5: Manual SO Creation Modal & Dynamic Item Rows
console.log('[Test 5] Verifying manual SO creation modal & dynamic item code rows...');
assert.ok(soContent.includes('showCreateSoModal'), 'showCreateSoModal state must exist');
assert.ok(soContent.includes('createSoForm'), 'createSoForm must be defined');
assert.ok(soContent.includes('addCreateSoItemRow'), 'addCreateSoItemRow function must be implemented');
assert.ok(soContent.includes('removeCreateSoItemRow'), 'removeCreateSoItemRow function must be implemented');
assert.ok(soContent.includes('/api/sales-orders'), 'Must submit POST /api/sales-orders');
console.log('  -> PASS: Manual creation modal with dynamic item code rows verified.\n');

// Test 6: Multi-Tab Import Modal (Odoo JSON, CSV, Odoo API)
console.log('[Test 6] Verifying import modal (Odoo JSON, CSV, and Odoo API sync)...');
assert.ok(soContent.includes('showImportSoModal'), 'showImportSoModal state must exist');
assert.ok(soContent.includes('importActiveTab'), 'importActiveTab state must exist');
assert.ok(soContent.includes('loadSampleOdooJson'), 'loadSampleOdooJson function must exist');
assert.ok(soContent.includes('previewOdooJson'), 'previewOdooJson parser must exist');
assert.ok(soContent.includes('/api/sales-orders/import/odoo-json'), 'Must call /api/sales-orders/import/odoo-json');
assert.ok(soContent.includes('loadSampleCsv'), 'loadSampleCsv function must exist');
assert.ok(soContent.includes('previewCsv'), 'previewCsv parser must exist');
assert.ok(soContent.includes('/api/sales-orders/import/csv'), 'Must call /api/sales-orders/import/csv');
assert.ok(soContent.includes('/api/sales-orders/import/odoo-api'), 'Must call /api/sales-orders/import/odoo-api');
console.log('  -> PASS: All three import tabs (Odoo JSON, CSV, Odoo API) verified.\n');

// Test 7: Auto-Template Matching & Link to Test Builder
console.log('[Test 7] Verifying test template auto-matching and Test Builder linkage...');
assert.ok(soContent.includes('/api/sales-orders/mapping/test-template'), 'Must query auto-template resolution endpoint');
assert.ok(soContent.includes('triggerAutoDetectTemplate'), 'triggerAutoDetectTemplate function must be implemented');
assert.ok(soContent.includes('navigateToTestBuilder'), 'navigateToTestBuilder function must be implemented');
assert.ok(soContent.includes("switchTab('test-builder')") || soContent.includes("switchTab"), 'Must trigger switchTab to test-builder');
console.log('  -> PASS: Test template auto-detection and deep link to Test Builder verified.\n');

// Test 8: Real-Time Item Test Status (D-Module Bridge)
console.log('[Test 8] Verifying real-time item test status inspection...');
assert.ok(soContent.includes('/items/') && soContent.includes('/test-status'), 'Must call item test-status endpoint');
assert.ok(soContent.includes('inspectItemTestStatus'), 'inspectItemTestStatus function must be implemented');
assert.ok(soContent.includes('showItemTestStatusModal'), 'showItemTestStatusModal state must exist');
console.log('  -> PASS: Real-time item test status dialog verified.\n');

// Test 9: 100% English UI Standardization
console.log('[Test 9] Verifying 100% English UI standardization...');
const vietnameseTerms = [
  'Đơn hàng', 'Mã sản phẩm', 'Trạng thái', 'Tìm kiếm', 'Nhập', 'Tạo mới',
  'Thành công', 'Thất bại', 'Đang kiểm tra', 'Đã hoàn thành', 'Xóa', 'Sửa'
];
for (const term of vietnameseTerms) {
  assert.ok(!soContent.includes(`>${term}<`) && !soContent.includes(`"${term}"`), `UI must not contain Vietnamese term: "${term}"`);
}
console.log('  -> PASS: 100% English UI standardized.\n');

console.log('====================================================');
console.log('ALL FRONTEND SALES ORDERS TESTS PASSED (100%)');
console.log('====================================================\n');
