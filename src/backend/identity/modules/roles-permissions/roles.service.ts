import { Injectable, NotFoundException, ForbiddenException, Logger, Optional, Inject, forwardRef } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../../database/dynamic-database.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { MenuService } from '../menu/menu.service';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  private roleUserAssignments: Map<string, Set<string>> = new Map();

  constructor(
    private readonly dbService: DynamicDatabaseService,
    @Optional()
    @Inject(forwardRef(() => MenuService))
    private readonly menuService?: MenuService,
  ) {}

  private getRoleRepo(): Repository<Role> {
    return this.dbService.getRepositoryForTable('roles', Role);
  }

  private getPermissionRepo(): Repository<Permission> {
    return this.dbService.getRepositoryForTable('permission', Permission);
  }

  async findAllRoles() {
    return this.getRoleRepo().find({ relations: ['permissions'], order: { createdAt: 'ASC' } });
  }

  async findOneRole(idOrCode: string): Promise<Role> {
    const roleRepo = this.getRoleRepo();
    let role = await roleRepo.findOne({
      where: [{ id: idOrCode }, { code: idOrCode }],
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException(`Role with ID or Code '${idOrCode}' not found`);
    }
    return role;
  }

  async findAllPermissions() {
    return this.getPermissionRepo().find({ order: { module: 'ASC', name: 'ASC' } });
  }

  async findAllMenuItems() {
    if (this.menuService) {
      return this.menuService.getAllMenuItems();
    }
    return [];
  }

  async createRole(code: string, name: string, description?: string, permissionIds?: string[]) {
    const roleRepo = this.getRoleRepo();
    const permRepo = this.getPermissionRepo();

    const normalizedCode = (code || '').trim();
    if (normalizedCode === 'SUPER_ADMIN' || normalizedCode === 'admin') {
      throw new ForbiddenException('Cannot create another admin system role');
    }

    let permissions: Permission[] = [];
    if (permissionIds && permissionIds.length > 0) {
      permissions = await permRepo.find({
        where: [{ id: In(permissionIds) }, { name: In(permissionIds) }],
      });
    }

    const newRole = roleRepo.create({
      code: normalizedCode,
      name,
      description,
      permissions,
    });

    return roleRepo.save(newRole);
  }

  async updateRole(id: string, name?: string, description?: string, permissionIds?: string[]) {
    const role = await this.findOneRole(id);
    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;

    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        role.permissions = await this.getPermissionRepo().find({
          where: [{ id: In(permissionIds) }, { name: In(permissionIds) }],
        });
      } else {
        role.permissions = [];
      }
    }

    return this.getRoleRepo().save(role);
  }

  async deleteRole(id: string) {
    const role = await this.findOneRole(id);

    if (role.code === 'SUPER_ADMIN' || role.code === 'admin') {
      throw new ForbiddenException('SUPER_ADMIN role is system-protected and cannot be deleted');
    }

    await this.getRoleRepo().remove(role);
    return { success: true, message: `Role ${role.name} (${role.code}) deleted successfully` };
  }

  // ==========================================
  // STEP 1: USER ASSIGNMENT
  // ==========================================
  async findUsersByRole(roleId: string) {
    const role = await this.findOneRole(roleId);
    let userIds: string[] = [];
    let users: any[] = [];

    const ds = this.dbService.getDataSourceForTable('user_role');
    if (ds && ds.isInitialized) {
      try {
        const rows = await ds.query(
          `SELECT u.id, u.username, u.email, u."fullName", u."isActive"
           FROM system_schema.users u
           JOIN system_schema.user_role ur ON ur.user_id = u.id
           WHERE ur.role_id = $1`,
          [role.id],
        );
        users = rows;
        userIds = rows.map((r: any) => r.id);
      } catch (err: any) {
        this.logger.warn(`Could not query users for role ${role.id}: ${err.message}`);
      }
    }

    if (userIds.length === 0 && this.roleUserAssignments.has(role.id)) {
      userIds = Array.from(this.roleUserAssignments.get(role.id)!);
    }

    return {
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      userIds,
      users,
      data: userIds,
    };
  }

  async assignUsersToRole(roleId: string, userIds: string[]) {
    const role = await this.findOneRole(roleId);
    const normalizedUserIds = Array.isArray(userIds) ? userIds.filter(Boolean) : [];

    const ds = this.dbService.getDataSourceForTable('user_role');
    if (ds && ds.isInitialized) {
      try {
        await ds.query('DELETE FROM system_schema.user_role WHERE role_id = $1', [role.id]);
        for (const uid of normalizedUserIds) {
          await ds.query(
            `INSERT INTO system_schema.user_role (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [uid, role.id],
          );
        }
      } catch (err: any) {
        this.logger.error(`Error saving user_role for role ${role.id}: ${err.message}`);
      }
    }

    this.roleUserAssignments.set(role.id, new Set(normalizedUserIds));

    return {
      success: true,
      roleId: role.id,
      roleCode: role.code,
      userIds: normalizedUserIds,
      totalAssigned: normalizedUserIds.length,
    };
  }

  // ==========================================
  // STEP 2: PLUGIN PERMISSIONS ASSIGNMENT
  // ==========================================
  async findPermissionsByRole(roleId: string) {
    const role = await this.findOneRole(roleId);
    const permissions = role.permissions || [];
    const permissionIds = permissions.map((p) => p.id);
    const permissionNames = permissions.map((p) => p.name);

    return {
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      permissionIds,
      permissionNames,
      permissions,
      data: permissionIds,
    };
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await this.findOneRole(roleId);
    const normalizedIds = Array.isArray(permissionIds) ? permissionIds.filter(Boolean) : [];
    const permRepo = this.getPermissionRepo();

    let matchedPermissions: Permission[] = [];
    if (normalizedIds.length > 0) {
      matchedPermissions = await permRepo.find({
        where: [{ id: In(normalizedIds) }, { name: In(normalizedIds) }],
      });

      const foundKeys = new Set([
        ...matchedPermissions.map((p) => p.id),
        ...matchedPermissions.map((p) => p.name),
      ]);

      for (const pId of normalizedIds) {
        if (!foundKeys.has(pId)) {
          try {
            const parts = pId.split(':');
            const module = parts[0] || 'system';
            const action = parts.slice(1).join(':') || 'read';
            const newPerm = permRepo.create({
              name: pId,
              description: `Dynamic permission for ${pId}`,
              module,
              action,
            });
            const saved = await permRepo.save(newPerm);
            matchedPermissions.push(saved);
            foundKeys.add(pId);
          } catch (err: any) {
            this.logger.warn(`Could not create permission ${pId}: ${err.message}`);
          }
        }
      }
    }

    role.permissions = matchedPermissions;
    await this.getRoleRepo().save(role);

    return {
      success: true,
      roleId: role.id,
      roleCode: role.code,
      permissionIds: role.permissions.map((p) => p.id),
      permissions: role.permissions,
      totalAssigned: role.permissions.length,
    };
  }

  // ==========================================
  // STEP 3: MENU VIEWS ASSIGNMENT
  // ==========================================
  async findMenusByRole(roleId: string) {
    const role = await this.findOneRole(roleId);
    let menuIds: string[] = [];

    if (this.menuService) {
      const assignments = await this.menuService.getRoleAssignments();
      const assigned = assignments[role.code] || assignments[role.id];
      if (assigned && Array.isArray(assigned)) {
        menuIds = assigned;
      }
    }

    const ds = this.dbService.getDataSourceForTable('role_menu_permissions');
    if (ds && ds.isInitialized) {
      try {
        const rows = await ds.query(
          `SELECT "menuItemId" as menu_id FROM system_schema.role_menu_permissions
           WHERE "roleId" = $1 OR "roleCode" = $2 OR role_id = $1
           UNION
           SELECT "menu_item_id" as menu_id FROM system_schema.role_menu_permissions
           WHERE "roleId" = $1 OR "roleCode" = $2 OR role_id = $1`,
          [role.id, role.code],
        );
        if (rows && rows.length > 0) {
          menuIds = Array.from(new Set(rows.map((r: any) => r.menu_id).filter(Boolean)));
        }
      } catch (err: any) {
        this.logger.warn(`Could not query role_menu_permissions: ${err.message}`);
      }
    }

    if (menuIds.length === 0 && (role.code === 'SUPER_ADMIN' || role.code === 'admin')) {
      if (this.menuService) {
        const allItems = await this.menuService.getAllMenuItems();
        menuIds = allItems.map((i) => i.id);
      }
    }

    return {
      roleId: role.id,
      roleCode: role.code,
      roleName: role.name,
      menuIds,
      menuKeys: menuIds,
      menuItemIds: menuIds,
      data: menuIds,
    };
  }

  async assignMenusToRole(roleId: string, menuIds: string[]) {
    const role = await this.findOneRole(roleId);
    const normalizedMenuIds = Array.isArray(menuIds) ? menuIds.filter(Boolean) : [];

    if (this.menuService) {
      try {
        await this.menuService.assignRoleMenu(role.code, normalizedMenuIds);
      } catch (err: any) {
        this.logger.warn(`MenuService.assignRoleMenu failed: ${err.message}`);
      }
    }

    const ds = this.dbService.getDataSourceForTable('role_menu_permissions');
    if (ds && ds.isInitialized) {
      try {
        await ds.query(
          `DELETE FROM system_schema.role_menu_permissions
           WHERE "roleId" = $1 OR "roleCode" = $2 OR role_id = $1`,
          [role.id, role.code],
        );

        for (const mId of normalizedMenuIds) {
          await ds.query(
            `INSERT INTO system_schema.role_menu_permissions ("roleId", "roleCode", "menuItemId", "role_id", "menu_item_id")
             VALUES ($1, $2, $3, $1, $3)
             ON CONFLICT DO NOTHING`,
            [role.id, role.code, mId],
          );
        }
      } catch (err: any) {
        this.logger.warn(`Error updating role_menu_permissions table: ${err.message}`);
      }
    }

    return {
      success: true,
      roleId: role.id,
      roleCode: role.code,
      menuIds: normalizedMenuIds,
      menuKeys: normalizedMenuIds,
      menuItemIds: normalizedMenuIds,
      totalAssigned: normalizedMenuIds.length,
    };
  }
}
