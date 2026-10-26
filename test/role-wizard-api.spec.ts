/**
 * Role Wizard API Verification Test
 * Step 1: Users, Step 2: Plugin Permissions, Step 3: Menu Views
 */
import 'reflect-metadata';
import * as assert from 'assert';
import { RolesService } from '../src/backend/identity/modules/roles-permissions/roles.service';
import { RolesController } from '../src/backend/identity/modules/roles-permissions/roles.controller';
import { MenuService } from '../src/backend/identity/modules/menu/menu.service';

class MockRoleRepo {
  private roles: any[] = [
    {
      id: 'r1111111-1111-1111-1111-111111111111',
      code: 'TEST_OPERATOR',
      name: 'Test Operator',
      description: 'Role for testing wizard',
      permissions: [],
      createdAt: new Date(),
    },
    {
      id: 'r2222222-2222-2222-2222-222222222222',
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'System Administrator',
      permissions: [],
      createdAt: new Date(),
    },
  ];

  async find(options?: any) {
    return [...this.roles];
  }

  async findOne(options?: any) {
    const where = options?.where;
    if (Array.isArray(where)) {
      for (const cond of where) {
        const found = this.roles.find((r) => (cond.id && r.id === cond.id) || (cond.code && r.code === cond.code));
        if (found) return found;
      }
      return null;
    }
    const cond = where || {};
    return this.roles.find((r) => (cond.id && r.id === cond.id) || (cond.code && r.code === cond.code)) || null;
  }

  create(data: any) {
    return { ...data, id: `r-${Date.now()}` };
  }

  async save(role: any) {
    const idx = this.roles.findIndex((r) => r.id === role.id || r.code === role.code);
    if (idx >= 0) {
      this.roles[idx] = role;
    } else {
      this.roles.push(role);
    }
    return role;
  }
}

class MockPermissionRepo {
  private permissions: any[] = [
    { id: 'p1', name: 'system:menu:manage', module: 'system', action: 'manage' },
    { id: 'p2', name: 'menu:dashboard:view', module: 'menu', action: 'read' },
  ];

  async find(options?: any) {
    const where = options?.where;
    if (Array.isArray(where)) {
      const ids: string[] = [];
      const names: string[] = [];
      for (const w of where) {
        if (w.id && w.id._value) ids.push(...w.id._value);
        if (w.name && w.name._value) names.push(...w.name._value);
      }
      return this.permissions.filter((p) => ids.includes(p.id) || names.includes(p.name));
    }
    return [...this.permissions];
  }

  create(data: any) {
    return { ...data, id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` };
  }

  async save(perm: any) {
    this.permissions.push(perm);
    return perm;
  }
}

class MockDatabaseService {
  public roleRepo = new MockRoleRepo();
  public permRepo = new MockPermissionRepo();
  public queries: any[] = [];

  getRepositoryForTable(table: string, entity: any) {
    if (table === 'roles') return this.roleRepo;
    if (table === 'permission') return this.permRepo;
    return null;
  }

  getDataSourceForTable(table: string) {
    return {
      isInitialized: true,
      query: async (sql: string, params?: any[]) => {
        this.queries.push({ sql, params });
        if (sql.includes('SELECT u.id, u.username')) {
          return [
            { id: 'u1', username: 'john_doe', email: 'john@itest.io', fullName: 'John Doe', isActive: true },
          ];
        }
        if (sql.includes('SELECT "menuItemId" as menu_id')) {
          return [{ menu_id: 'dashboard' }, { menu_id: 'final-config:tool' }];
        }
        return [];
      },
    };
  }
}

async function runWizardTests() {
  console.log('=== STARTING ROLE WIZARD (3 STEPS) BACKEND API VERIFICATION ===\n');

  const mockDb = new MockDatabaseService();
  const menuService = new MenuService(mockDb as any);
  const rolesService = new RolesService(mockDb as any, menuService);
  const controller = new RolesController(rolesService);

  const testRoleId = 'r1111111-1111-1111-1111-111111111111';

  // [TEST 1] Step 1: Users Assignment
  console.log('[TEST 1] Testing Step 1: User Assignment (GET & PUT /roles/:id/users)...');
  const initialUsers = await controller.findUsersByRole(testRoleId);
  assert.strictEqual(initialUsers.roleId, testRoleId, 'Role ID must match');
  assert.ok(Array.isArray(initialUsers.userIds), 'userIds must be an array');
  assert.ok(Array.isArray(initialUsers.data), 'data must be an array alias');

  const assignUsersRes = await controller.assignUsersToRole(testRoleId, {
    userIds: ['u1', 'u2', 'u3'],
  });
  assert.strictEqual(assignUsersRes.success, true, 'assignUsersToRole should succeed');
  assert.strictEqual(assignUsersRes.totalAssigned, 3, 'Should assign 3 users');
  assert.deepStrictEqual(assignUsersRes.userIds, ['u1', 'u2', 'u3'], 'userIds list must match');
  console.log('✓ Step 1: User assignment completed and verified.');

  // [TEST 2] Step 2: Plugin Permissions Assignment
  console.log('[TEST 2] Testing Step 2: Permissions Assignment (GET & PUT /roles/:id/permissions)...');
  const allPermissions = await controller.findAllPermissions();
  assert.ok(Array.isArray(allPermissions), 'All permissions should be an array');
  assert.ok(allPermissions.length >= 2, 'Should have initial permissions');

  const assignPermRes = await controller.assignPermissionsToRole(testRoleId, {
    permissionIds: ['p1', 'memmap:profile:manage', 'lorawan:device:create'],
  });
  assert.strictEqual(assignPermRes.success, true, 'assignPermissionsToRole should succeed');
  assert.strictEqual(assignPermRes.totalAssigned, 3, 'Should assign 3 permissions (including dynamic creations)');

  const rolePerms = await controller.findPermissionsByRole(testRoleId);
  assert.strictEqual(rolePerms.roleId, testRoleId, 'Role ID must match');
  assert.strictEqual(rolePerms.permissionIds.length, 3, 'Should have 3 permission IDs');
  console.log('✓ Step 2: Plugin permissions assignment and dynamic catalog mapping verified.');

  // [TEST 3] Step 3: Menu Views Visibility
  console.log('[TEST 3] Testing Step 3: Menu Views Visibility (GET & PUT /roles/:id/menus)...');
  const allMenus = await controller.findAllMenuItems();
  assert.ok(Array.isArray(allMenus), 'All menu items must be an array');
  assert.ok(allMenus.length >= 9, 'Should have registered menu items');

  const assignMenusRes = await controller.assignMenusToRole(testRoleId, {
    menuKeys: ['dashboard', 'final-config:tool', 'memmap-payload:profiles'],
  });
  assert.strictEqual(assignMenusRes.success, true, 'assignMenusToRole should succeed');
  assert.strictEqual(assignMenusRes.totalAssigned, 3, 'Should assign 3 menu views');
  assert.ok(Array.isArray(assignMenusRes.menuKeys), 'menuKeys must be array');
  assert.ok(Array.isArray(assignMenusRes.menuItemIds), 'menuItemIds must be array');

  const roleMenus = await controller.findMenusByRole(testRoleId);
  assert.strictEqual(roleMenus.roleId, testRoleId, 'Role ID must match');
  assert.ok(Array.isArray(roleMenus.menuIds), 'menuIds must be array');
  console.log('✓ Step 3: Menu views visibility contract and sync verified.');

  // [TEST 4] Fallbacks & General Role Endpoints
  console.log('[TEST 4] Testing Fallbacks and General Role Endpoints...');
  const allRoles = await controller.findAllRoles();
  assert.ok(Array.isArray(allRoles), 'All roles should be an array');

  const singleRole = await controller.findOneRole(testRoleId);
  assert.strictEqual(singleRole.id, testRoleId, 'Single role ID matches');

  const patchUpdate = await controller.updateRole(testRoleId, {
    name: 'Updated Test Operator',
    description: 'Updated description',
  });
  assert.strictEqual(patchUpdate.name, 'Updated Test Operator', 'Role name updated');
  console.log('✓ Fallback PATCH /roles/:id and lookup endpoints verified.');

  console.log('\n=== ALL ROLE WIZARD (3 STEPS) BACKEND API TESTS PASSED! ===');
}

runWizardTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
