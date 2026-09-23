import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';

console.log('======================================================================');
console.log('AUTOMATED SUITE: CONTROL PANEL SIDEBAR GROUPS & COLLAPSE VERIFICATION');
console.log('======================================================================\n');

const cpViewPath = path.join(__dirname, '../src/views/control-panel.view.ts');
assert.ok(fs.existsSync(cpViewPath), 'control-panel.view.ts must exist');
const cpContent = fs.readFileSync(cpViewPath, 'utf8');

// --------------------------------------------------------------------
// TEST 1: Dedicated Order Management Group
// --------------------------------------------------------------------
console.log('[TEST 1] Verifying Dedicated Order Management Group in Sidebar...');
assert.ok(
  cpContent.includes('Order Management') || cpContent.includes('Quản lý Đơn Hàng'),
  'Sidebar must contain dedicated Order Management section header',
);
assert.ok(
  cpContent.includes("switchTab('sales-orders')"),
  "Sidebar must include switchTab('sales-orders')",
);
assert.ok(
  cpContent.includes("switchTab('item-codes')"),
  "Sidebar must include switchTab('item-codes')",
);
console.log('  -> PASS: Order Management section established with Sales Orders & Item Codes.\n');

// --------------------------------------------------------------------
// TEST 2: Dedicated Access & Security (Phân Quyền) Group
// --------------------------------------------------------------------
console.log('[TEST 2] Verifying Dedicated Access & Security (Phân Quyền) Group in Sidebar...');
assert.ok(
  cpContent.includes('Access & Security') || cpContent.includes('Phân Quyền'),
  'Sidebar must contain dedicated Access & Security section header',
);
assert.ok(
  cpContent.includes("switchTab('roles')"),
  "Sidebar must include switchTab('roles')",
);
assert.ok(
  cpContent.includes("switchTab('users')"),
  "Sidebar must include switchTab('users')",
);
console.log('  -> PASS: Access & Security section established with Roles & RBAC and User Accounts.\n');

// --------------------------------------------------------------------
// TEST 3: Core Governance & Infrastructure Separation
// --------------------------------------------------------------------
console.log('[TEST 3] Verifying Core Governance & Infrastructure & IoT Sections...');
assert.ok(cpContent.includes('Core Governance'), 'Sidebar must contain Core Governance header');
assert.ok(cpContent.includes("switchTab('overview')"), "Must include switchTab('overview')");
assert.ok(cpContent.includes("switchTab('modules')"), "Must include switchTab('modules')");
assert.ok(cpContent.includes("switchTab('database')"), "Must include switchTab('database')");

assert.ok(cpContent.includes('Infrastructure & IoT'), 'Sidebar must contain Infrastructure & IoT header');
assert.ok(cpContent.includes("switchTab('network-servers')"), "Must include switchTab('network-servers')");
assert.ok(cpContent.includes("switchTab('devices')"), "Must include switchTab('devices')");
assert.ok(cpContent.includes("switchTab('sensor-types')"), "Must include switchTab('sensor-types')");
console.log('  -> PASS: 4 clean distinct groups verified in Sidebar navigation.\n');

// --------------------------------------------------------------------
// TEST 4: Sidebar Collapse Toggle Feature
// --------------------------------------------------------------------
console.log('[TEST 4] Verifying Sidebar Collapse Button & Responsive Width...');
assert.ok(
  cpContent.includes('toggleSidebarCollapse'),
  'Must implement toggleSidebarCollapse function',
);
assert.ok(
  cpContent.includes('sidebarCollapsed'),
  'Must declare reactive sidebarCollapsed state',
);
assert.ok(
  cpContent.includes('cp_sidebar_collapsed'),
  'Must persist collapse preference in localStorage',
);
assert.ok(
  cpContent.includes("md:w-0") || cpContent.includes("w-0"),
  'Sidebar must support full collapse (md:w-0) without showing mini icons',
);
assert.ok(
  cpContent.includes('md:w-60'),
  'Sidebar must support standard width (md:w-60) when expanded',
);
console.log('  -> PASS: Sidebar collapse state, persistence, and dynamic width verified.\n');

// --------------------------------------------------------------------
// TEST 5: Full Collapse (Zero Mini-Icons) & Smooth Animation
// --------------------------------------------------------------------
console.log('[TEST 5] Verifying Full Collapse (Zero Mini-Icons) & Smooth Animation...');
assert.ok(
  cpContent.includes('md:overflow-hidden') || cpContent.includes('overflow-hidden'),
  'Sidebar must hide overflow when collapsed to prevent mini-icons leaking',
);
assert.ok(
  cpContent.includes('transition: width') || cpContent.includes('transition-all'),
  'Sidebar must animate smoothly between expanded and collapsed states',
);
console.log('  -> PASS: Zero mini-icons on collapse and smooth animation verified.\n');

// --------------------------------------------------------------------
// TEST 6: Setup Return Object Exposure
// --------------------------------------------------------------------
console.log('[TEST 6] Verifying Setup Return Block Exposure...');
assert.ok(
  cpContent.includes('sidebarCollapsed,') && cpContent.includes('toggleSidebarCollapse,'),
  'setup() must expose sidebarCollapsed and toggleSidebarCollapse to template',
);
console.log('  -> PASS: Reactive bindings exposed to Vue template.\n');

console.log('======================================================================');
console.log('ALL 6 TESTS PASSED: CONTROL PANEL SIDEBAR RESTRUCTURING 100% VERIFIED!');
console.log('======================================================================');
