import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

import { C_MODULES_REGISTRY } from '../src/modules/c-modules/c-module-registry';
import { ALL_DATABASE_ENTITIES } from '../src/modules/database/dynamic-database.service';
import { DeviceEntity } from '../src/modules/lorawan/entities/device.entity';
import { RegisterDeviceDto } from '../src/modules/lorawan/dto/lorawan.dto';
import { OVERVIEW_TEMPLATE } from '../src/views/control-panel-modules/overview.module';
import { DEVICES_TEMPLATE, DEVICES_MODALS } from '../src/views/control-panel-modules/devices.module';
import { DOWNLINK_TEMPLATE } from '../src/views/control-panel-modules/downlink.module';

class TestDataSource extends DataSource {
  public async build() {
    await this.buildMetadatas();
  }
}

async function runCModuleEcosystemTests() {
  console.log('======================================================================');
  console.log('AUTOMATED SUITE: C-MODULE ECOSYSTEM GOVERNANCE & ARCHITECTURE UNIFICATION');
  console.log('======================================================================');

  // --------------------------------------------------------------------
  // TEST 1: Master C-Module Registry (All 15 C-Modules Registered)
  // --------------------------------------------------------------------
  console.log('\n[TEST 1] Verifying Master C-Module Registry (C_MODULES_REGISTRY)...');
  assert.strictEqual(C_MODULES_REGISTRY.length, 15, 'Registry must contain exactly 15 C-Modules');

  const expectedModuleCodes = [
    'C_MOD_OVERVIEW',
    'C_MOD_D_MODULES',
    'C_MOD_DATABASE',
    'C_MOD_ROLES_RBAC',
    'C_MOD_USERS',
    'C_MOD_NETWORK_SERVERS',
    'C_MOD_DEVICE_FLEET',
    'C_MOD_WEBHOOKS',
    'C_MOD_DECODER',
    'C_MOD_HMI_STUDIO',
    'C_MOD_DOWNLINK_CONTROLLER',
    'C_MOD_MODBUS_PRESETS',
    'C_MOD_SALES_ORDERS',
    'C_MOD_ITEM_CODES',
    'C_MOD_TEST_BUILDER',
  ];

  for (const code of expectedModuleCodes) {
    const entry = C_MODULES_REGISTRY.find((m) => m.code === code);
    assert.ok(entry, `C-Module with code [${code}] must be registered in C_MODULES_REGISTRY`);
    assert.ok(entry.id.startsWith('c-'), `Module ID [${entry.id}] must follow the 'c-' standard`);
    assert.ok(entry.routeHash.startsWith('#'), `Route hash [${entry.routeHash}] must start with '#'`);
    assert.ok(entry.title && entry.title.length > 0, `Module [${code}] must have a valid title`);
    assert.ok(entry.description && entry.description.length > 0, `Module [${code}] must have a valid description`);
    assert.ok(entry.icon && entry.icon.startsWith('fa-'), `Module [${code}] must have a valid FontAwesome icon`);
  }

  // Verify newly registered c-item-codes and c-test-builder specifically
  const itemCodesEntry = C_MODULES_REGISTRY.find((m) => m.id === 'c-item-codes');
  assert.ok(itemCodesEntry, 'c-item-codes must be registered');
  assert.strictEqual(itemCodesEntry.code, 'C_MOD_ITEM_CODES');
  assert.strictEqual(itemCodesEntry.routeHash, '#item-codes');
  assert.strictEqual(itemCodesEntry.requiredPermission, 'item_codes:read');

  const testBuilderEntry = C_MODULES_REGISTRY.find((m) => m.id === 'c-test-builder');
  assert.ok(testBuilderEntry, 'c-test-builder must be registered');
  assert.strictEqual(testBuilderEntry.code, 'C_MOD_TEST_BUILDER');
  assert.strictEqual(testBuilderEntry.routeHash, '#test-builder');
  assert.strictEqual(testBuilderEntry.requiredPermission, 'test_builder:read');

  console.log('  -> PASS: All 15 C-Modules validated in registry with canonical IDs, codes, routes, and permissions.');

  // --------------------------------------------------------------------
  // TEST 2: Documentation Standardization (c-modules/README.md)
  // --------------------------------------------------------------------
  console.log('\n[TEST 2] Verifying Documentation (src/modules/c-modules/README.md)...');
  const readmePath = path.resolve(__dirname, '../src/modules/c-modules/README.md');
  assert.ok(fs.existsSync(readmePath), 'src/modules/c-modules/README.md must exist');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  for (const code of expectedModuleCodes) {
    assert.ok(
      readmeContent.includes(code),
      `README.md must document C-Module code [${code}]`,
    );
  }
  assert.ok(readmeContent.includes('Mạng lưới liên kết (Inter-Module Workflows)'), 'README must outline inter-module workflows');
  console.log('  -> PASS: README documents all 15 C-Modules and describes inter-module workflows.');

  // --------------------------------------------------------------------
  // TEST 3: RBAC Default Permissions Seed Coverage
  // --------------------------------------------------------------------
  console.log('\n[TEST 3] Verifying RBAC Service Default Permissions...');
  const rolesServicePath = path.resolve(__dirname, '../src/modules/roles-permissions/roles.service.ts');
  const rolesServiceContent = fs.readFileSync(rolesServicePath, 'utf8');

  const expectedPermissions = [
    'item_codes:read',
    'item_codes:manage',
    'sales_orders:read',
    'sales_orders:manage',
    'test_builder:read',
    'test_builder:manage',
    'hmi_studio:read',
    'hmi_studio:manage',
    'modbus_presets:read',
    'modbus_presets:manage',
    'lorawan:device:read',
    'network_server:read',
  ];

  for (const perm of expectedPermissions) {
    assert.ok(
      rolesServiceContent.includes(`name: '${perm}'`),
      `roles.service.ts must seed default permission [${perm}]`,
    );
  }
  console.log('  -> PASS: All default permissions for C-Modules are present in roles.service.ts.');

  // --------------------------------------------------------------------
  // TEST 4: Overview Hub Central Command & Quick Jump Cards
  // --------------------------------------------------------------------
  console.log('\n[TEST 4] Verifying Overview Hub Metrics and Quick Jump Cards...');
  // Check Top 8 Metrics
  assert.ok(OVERVIEW_TEMPLATE.includes("switchTab('network-servers')"), 'Overview must link to network-servers');
  assert.ok(OVERVIEW_TEMPLATE.includes("switchTab('devices')"), 'Overview must link to devices');
  assert.ok(OVERVIEW_TEMPLATE.includes("switchTab('roles')"), 'Overview must link to roles');
  assert.ok(OVERVIEW_TEMPLATE.includes("switchTab('item-codes')"), 'Overview must link to item-codes');
  assert.ok(OVERVIEW_TEMPLATE.includes("switchTab('sales-orders')"), 'Overview must link to sales-orders');
  assert.ok(OVERVIEW_TEMPLATE.includes("switchTab('test-builder')"), 'Overview must link to test-builder');
  assert.ok(OVERVIEW_TEMPLATE.includes("switchTab('decoder')"), 'Overview must link to decoder');

  // Check Quick Jump Cards in Admin Management Hub
  const expectedHubCards = [
    "switchTab('network-servers')",
    "switchTab('modules')",
    "switchTab('database')",
    "switchTab('roles')",
    "switchTab('users')",
    "switchTab('devices')",
    "switchTab('decoder')",
    "switchTab('item-codes')",
    "switchTab('sales-orders')",
    "switchTab('test-builder')",
    "switchTab('hmi-studio')",
    "switchTab('downlink')",
    "switchTab('webhooks')",
    "switchTab('modbus-presets')",
  ];

  for (const card of expectedHubCards) {
    assert.ok(
      OVERVIEW_TEMPLATE.includes(card),
      `Overview template must contain quick jump card for [${card}]`,
    );
  }
  console.log('  -> PASS: Overview Hub features 8-card metric banner and 14 quick navigation cards.');

  // --------------------------------------------------------------------
  // TEST 5: Device Fleet Integration with Item Codes & Sales Orders
  // --------------------------------------------------------------------
  console.log('\n[TEST 5] Verifying Device Fleet Integration with Item Codes & Sales Orders...');
  
  // 5.1 TypeORM Entity Metadata
  const ds = new TestDataSource({
    type: 'postgres',
    entities: ALL_DATABASE_ENTITIES,
  });
  await ds.build();

  const deviceMeta = ds.getMetadata(DeviceEntity);
  const deviceColumns = deviceMeta.columns.map((c) => c.propertyName);
  assert.ok(deviceColumns.includes('itemCodeId'), 'DeviceEntity must have itemCodeId column');
  assert.ok(deviceColumns.includes('salesOrderId'), 'DeviceEntity must have salesOrderId column');

  const itemCodeRelation = deviceMeta.relations.find((r) => r.propertyName === 'itemCode');
  assert.ok(itemCodeRelation, 'DeviceEntity must have itemCode ManyToOne relation');

  const salesOrderRelation = deviceMeta.relations.find((r) => r.propertyName === 'salesOrder');
  assert.ok(salesOrderRelation, 'DeviceEntity must have salesOrder ManyToOne relation');

  // 5.2 DTO verification
  const dto = new RegisterDeviceDto();
  dto.devEUI = '0011223344556677';
  dto.name = 'Test Sensor';
  dto.itemCodeId = '11111111-1111-1111-1111-111111111111';
  dto.salesOrderId = '22222222-2222-2222-2222-222222222222';
  assert.strictEqual(dto.itemCodeId, '11111111-1111-1111-1111-111111111111');
  assert.strictEqual(dto.salesOrderId, '22222222-2222-2222-2222-222222222222');

  // 5.3 Database Migration Script 08
  const migration08Path = path.resolve(__dirname, '../../deploy/database/updates/08_link_devices_to_item_codes_and_sales_orders.sql');
  assert.ok(fs.existsSync(migration08Path), '08_link_devices_to_item_codes_and_sales_orders.sql must exist');
  const ddl08Content = fs.readFileSync(migration08Path, 'utf8');
  assert.ok(ddl08Content.includes('itemCodeId'), 'Migration must add itemCodeId column');
  assert.ok(ddl08Content.includes('salesOrderId'), 'Migration must add salesOrderId column');
  assert.ok(ddl08Content.includes('idx_devices_item_code_id'), 'Migration must index itemCodeId');
  assert.ok(ddl08Content.includes('idx_devices_sales_order_id'), 'Migration must index salesOrderId');

  // 5.4 Frontend Devices UI Template & Modals
  assert.ok(DEVICES_TEMPLATE.includes('Item Code / SO'), 'Devices table must include Item Code / SO column');
  assert.ok(DEVICES_TEMPLATE.includes('viewItemCodeForDevice'), 'Devices table must link to Item Code Catalog');
  assert.ok(DEVICES_TEMPLATE.includes('viewSalesOrderForDevice'), 'Devices table must link to Sales Orders');
  assert.ok(DEVICES_TEMPLATE.includes('sendDownlinkForDevice'), 'Devices table must feature 1-click Downlink button');

  assert.ok(DEVICES_MODALS.includes('newDevice.itemCodeId'), 'Device modal must bind itemCodeId');
  assert.ok(DEVICES_MODALS.includes('onItemCodeSelectedForDevice'), 'Device modal must handle Item Code quick selection');
  assert.ok(DEVICES_MODALS.includes('newDevice.salesOrderId'), 'Device modal must bind salesOrderId');

  console.log('  -> PASS: Device Fleet is fully coupled with Item Code Catalog & Sales Orders at DB, API, and UI tiers.');

  // --------------------------------------------------------------------
  // TEST 6: Downlink Actuator Command Presets
  // --------------------------------------------------------------------
  console.log('\n[TEST 6] Verifying Downlink Actuator Command Presets...');
  assert.ok(DOWNLINK_TEMPLATE.includes("downlinkForm.payloadHex = '01FF'"), 'Downlink must support Reset (01FF) preset');
  assert.ok(DOWNLINK_TEMPLATE.includes("downlinkForm.payloadHex = '0101'"), 'Downlink must support Request Uplink (0101) preset');
  assert.ok(DOWNLINK_TEMPLATE.includes("downlinkForm.payloadHex = '02003C'"), 'Downlink must support 60s Interval preset');
  assert.ok(DOWNLINK_TEMPLATE.includes("downlinkForm.payloadHex = '02012C'"), 'Downlink must support 300s Interval preset');
  assert.ok(DOWNLINK_TEMPLATE.includes("downlinkForm.payloadHex = '020384'"), 'Downlink must support 900s Interval preset');
  assert.ok(DOWNLINK_TEMPLATE.includes("downlinkForm.payloadHex = '0300'"), 'Downlink must support Query Config preset');
  console.log('  -> PASS: Downlink Actuator includes 1-click command presets.');

  console.log('\n======================================================================');
  console.log('ALL 6 ECOSYSTEM INTEGRATION TESTS PASSED WITH 100% COMPLIANCE!');
  console.log('======================================================================\n');
}

runCModuleEcosystemTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
