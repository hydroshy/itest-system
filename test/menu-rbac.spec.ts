/**
 * Menu & Granular RBAC Verification Test
 */
import 'reflect-metadata';
import * as assert from 'assert';
import { MenuService, SYSTEM_MENU_ITEMS } from '../src/backend/identity/modules/menu/menu.service';
import { MenuController } from '../src/backend/identity/modules/menu/menu.controller';

class MockDatabaseService {
  public queryLog: any[] = [];
  getDataSourceForTable(table: string) {
    return {
      isInitialized: false,
      query: async (q: string, params?: any[]) => {
        this.queryLog.push({ q, params });
        return [];
      },
    };
  }
}

async function runTests() {
  console.log('=== STARTING MENU & GRANULAR RBAC VERIFICATION ===\n');

  const mockDb = new MockDatabaseService();
  const menuService = new MenuService(mockDb as any);
  const menuController = new MenuController(menuService);

  // [TEST 1] Service Initialization & System Defaults
  console.log('[TEST 1] Verifying System Menu Items & Granular Features...');
  const items = await menuService.getAllMenuItems();
  assert.ok(Array.isArray(items), 'Items should be an array');
  assert.ok(items.length >= 9, 'Should have at least 9 registered menu cards');

  const itemIds = items.map((i) => i.id);
  assert.ok(itemIds.includes('dashboard'), 'Should contain dashboard');
  assert.ok(itemIds.includes('final-config:tool'), 'Should contain final-config:tool');
  assert.ok(itemIds.includes('final-config:manager'), 'Should contain final-config:manager');
  assert.ok(itemIds.includes('final-config:create'), 'Should contain final-config:create');
  assert.ok(itemIds.includes('device-traceability:so'), 'Should contain device-traceability:so');
  assert.ok(itemIds.includes('device-traceability:devices'), 'Should contain device-traceability:devices');
  assert.ok(itemIds.includes('device-traceability:final-config'), 'Should contain device-traceability:final-config');
  assert.ok(itemIds.includes('memmap-payload:manager'), 'Should contain memmap-payload:manager');
  assert.ok(itemIds.includes('lorawan-chirpstack:integration'), 'Should contain lorawan-chirpstack:integration');
  console.log('✓ All 9 core & plugin granular feature cards properly registered.\n');

  // [TEST 2] Role Assignment Matrix & Fallbacks
  console.log('[TEST 2] Verifying Role Assignments & Permissions Filtering...');
  const roleAssignments = await menuService.getRoleAssignments();
  assert.ok(roleAssignments['SUPER_ADMIN'].length >= 9, 'SUPER_ADMIN should have full access');
  assert.ok(roleAssignments['END_USER'].includes('final-config:tool'), 'END_USER should have final-config:tool');
  assert.ok(!roleAssignments['END_USER'].includes('final-config:manager'), 'END_USER should NOT have final-config:manager');

  const endUserCards = await menuService.getCardsForRoles(['END_USER']);
  const endUserCardIds = endUserCards.map((c) => c.id);
  assert.ok(endUserCardIds.includes('dashboard'), 'END_USER should see dashboard');
  assert.ok(endUserCardIds.includes('final-config:tool'), 'END_USER should see final-config:tool');
  assert.ok(!endUserCardIds.includes('final-config:manager'), 'END_USER should not see manager');
  assert.ok(!endUserCardIds.includes('final-config:create'), 'END_USER should not see create');
  console.log('✓ Granular permissions correctly restrict cards per role.\n');

  // [TEST 3] Dynamic Role Permission Assignment (POST /api/menu/admin/assign)
  console.log('[TEST 3] Testing Dynamic Role Assignment Mutation...');
  const assignResult = await menuService.assignRoleMenu('OPERATOR', [
    'dashboard',
    'final-config:tool',
    'device-traceability:so',
  ]);
  assert.strictEqual(assignResult, true, 'Assignment should succeed');

  const operatorCards = await menuService.getCardsForRoles(['OPERATOR']);
  const operatorCardIds = operatorCards.map((c) => c.id);
  assert.deepStrictEqual(
    operatorCardIds,
    ['dashboard', 'final-config:tool', 'device-traceability:so'],
    'OPERATOR cards must strictly match assigned set'
  );
  console.log('✓ Dynamic role menu assignment successfully updated and reflected.\n');

  // [TEST 4] Controller REST API Endpoints Contract
  console.log('[TEST 4] Verifying Controller Endpoints & Data Contracts...');

  // Endpoint 1: GET /api/menu/my-cards
  const myCardsRes = await menuController.getMyCards({
    user: {
      userType: 'END_USER',
      roles: ['END_USER'],
    },
  });
  assert.strictEqual(myCardsRes.success, true);
  assert.ok(Array.isArray(myCardsRes.data));
  assert.ok(myCardsRes.data.some((c: any) => c.id === 'final-config:tool'));
  console.log('✓ GET /api/menu/my-cards returns compliant payload.');

  // Endpoint 2: GET /api/menu/admin/items
  const allItemsRes = await menuController.getAllItems();
  assert.strictEqual(allItemsRes.success, true);
  assert.ok(allItemsRes.data.length >= 9);
  console.log('✓ GET /api/menu/admin/items returns all granular items.');

  // Endpoint 3: GET /api/menu/admin/role-assignments
  const roleAssignsRes = await menuController.getRoleAssignments();
  assert.strictEqual(roleAssignsRes.success, true);
  assert.ok(roleAssignsRes.data['SUPER_ADMIN']);
  console.log('✓ GET /api/menu/admin/role-assignments returns assignment matrix.');

  // Endpoint 4: POST /api/menu/admin/assign
  const postAssignRes = await menuController.assignRoleMenu({
    roleCode: 'CUSTOM_QC',
    menuItemIds: ['dashboard', 'device-traceability:devices'],
  });
  assert.strictEqual(postAssignRes.success, true);
  const qcCards = await menuService.getCardsForRoles(['CUSTOM_QC']);
  assert.deepStrictEqual(qcCards.map((c) => c.id), ['dashboard', 'device-traceability:devices']);
  console.log('✓ POST /api/menu/admin/assign successfully assigns new role privileges.');

  console.log('\n=== ALL MENU & GRANULAR RBAC TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
