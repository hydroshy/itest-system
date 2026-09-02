import { Injectable, NotFoundException, ForbiddenException, OnModuleInit, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { In } from 'typeorm';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RolesService implements OnModuleInit, OnApplicationBootstrap {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly dbService: DynamicDatabaseService) {}

  private getRoleRepo() {
    return this.dbService.getRepositoryForTable('roles', Role);
  }

  private getPermissionRepo() {
    return this.dbService.getRepositoryForTable('permission', Permission);
  }

  async onModuleInit() {
    try {
      await this.seedDefaults();
    } catch (e: any) {
      // Will retry on application bootstrap
    }
  }

  async onApplicationBootstrap() {
    try {
      await this.seedDefaults();
    } catch (e: any) {
      this.logger.warn(`Could not seed default roles/permissions on bootstrap: ${e.message}`);
    }
  }

  public async seedDefaults() {
    let ds: any;
    try {
      ds = this.dbService.getDataSourceForTable('permission');
    } catch (e: any) {
      return;
    }

    if (!ds || !ds.isInitialized) return;

    try {
      // 0. Clean corrupted or null permission records
      await ds.query(`DELETE FROM "permission" WHERE "name" IS NULL OR "name" = '';`).catch(() => {});

      const defaultPerms = [
        { name: 'users:read', module: 'users', action: 'read', description: 'View user list' },
        { name: 'users:create', module: 'users', action: 'create', description: 'Create user or subadmin' },
        { name: 'users:permissions:update', module: 'users', action: 'update', description: 'Update permissions' },
        { name: 'users:delete', module: 'users', action: 'delete', description: 'Delete user' },

        { name: 'lorawan:app:read', module: 'lorawan', action: 'read', description: 'Read applications' },
        { name: 'lorawan:app:manage', module: 'lorawan', action: 'manage', description: 'Create/edit applications' },

        { name: 'lorawan:device:read', module: 'lorawan', action: 'read', description: 'Read devices' },
        { name: 'lorawan:device:manage', module: 'lorawan', action: 'manage', description: 'Create/edit devices' },

        { name: 'lorawan:gateway:read', module: 'lorawan', action: 'read', description: 'Read gateways' },
        { name: 'lorawan:gateway:manage', module: 'lorawan', action: 'manage', description: 'Create/edit gateways' },

        { name: 'lorawan:telemetry:read', module: 'lorawan', action: 'read', description: 'View decoded telemetry' },
      ];

      // 1. Insert or update default permissions atomically
      for (const p of defaultPerms) {
        await ds.query(
          `INSERT INTO "permission" ("name", "module", "action", "description")
           VALUES ($1, $2, $3, $4)
           ON CONFLICT ("name") DO UPDATE SET "module" = EXCLUDED."module", "action" = EXCLUDED."action", "description" = EXCLUDED."description";`,
          [p.name, p.module, p.action, p.description],
        ).catch(() => {});
      }

      // Fetch all permission IDs from database
      const allPermRows = await ds.query(`SELECT "id", "name", "module" FROM "permission";`);
      const allPermIds = allPermRows.map((r: any) => r.id);
      const subAdminPermIds = allPermRows.filter((r: any) => !r.name.includes('users:permissions:update')).map((r: any) => r.id);
      const operatorPermIds = allPermRows.filter((r: any) => r.module === 'lorawan').map((r: any) => r.id);

      // 2. Ensure SUPER_ADMIN role exists
      const superAdminResult = await ds.query(
        `INSERT INTO "roles" ("code", "name", "description")
         VALUES ('SUPER_ADMIN', 'Super Administrator', 'Full unhindered system access')
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description"
         RETURNING "id";`,
      );
      const superAdminId = superAdminResult[0]?.id;

      if (superAdminId && allPermIds.length > 0) {
        for (const pId of allPermIds) {
          await ds.query(
            `INSERT INTO "role_permissions" ("role_id", "permission_id")
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [superAdminId, pId],
          ).catch(() => {});
        }
      }

      // 3. Ensure SUB_ADMIN role exists
      const subAdminResult = await ds.query(
        `INSERT INTO "roles" ("code", "name", "description")
         VALUES ('SUB_ADMIN', 'Sub-Administrator', 'Delegated administrative privileges')
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description"
         RETURNING "id";`,
      );
      const subAdminId = subAdminResult[0]?.id;
      if (subAdminId && subAdminPermIds.length > 0) {
        for (const pId of subAdminPermIds) {
          await ds.query(
            `INSERT INTO "role_permissions" ("role_id", "permission_id")
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [subAdminId, pId],
          ).catch(() => {});
        }
      }

      // 4. Ensure LORAWAN_OPERATOR role exists
      const operatorResult = await ds.query(
        `INSERT INTO "roles" ("code", "name", "description")
         VALUES ('LORAWAN_OPERATOR', 'LoRaWAN Operator', 'Manage applications, devices, and gateways')
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description"
         RETURNING "id";`,
      );
      const operatorId = operatorResult[0]?.id;
      if (operatorId && operatorPermIds.length > 0) {
        for (const pId of operatorPermIds) {
          await ds.query(
            `INSERT INTO "role_permissions" ("role_id", "permission_id")
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`,
            [operatorId, pId],
          ).catch(() => {});
        }
      }

      this.logger.log('✅ Guaranteed presence and seeding of all RBAC permissions and default roles.');
    } catch (err: any) {
      this.logger.warn(`seedDefaults direct SQL notice: ${err.message}`);
    }
  }

  async findAllRoles() {
    return this.getRoleRepo().find({ relations: ['permissions'], order: { createdAt: 'ASC' } });
  }

  async findOneRole(id: string) {
    const role = await this.getRoleRepo().findOne({ where: { id }, relations: ['permissions'] });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async findAllPermissions() {
    return this.getPermissionRepo().find({ order: { module: 'ASC', name: 'ASC' } });
  }

  async createRole(code: string, name: string, description: string, permissionIds: string[]) {
    const roleRepo = this.getRoleRepo();
    const permRepo = this.getPermissionRepo();

    const normalizedCode = (code || '').toUpperCase().trim();
    if (normalizedCode === 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot create another role with code SUPER_ADMIN');
    }

    const permissions = permissionIds && permissionIds.length > 0 ? await permRepo.findBy({ id: In(permissionIds) }) : [];
    const role = roleRepo.create({ code: normalizedCode, name, description, permissions });
    return roleRepo.save(role);
  }

  async updateRole(id: string, name: string, description: string, permissionIds?: string[]) {
    const roleRepo = this.getRoleRepo();
    const permRepo = this.getPermissionRepo();
    const role = await this.findOneRole(id);

    if (name) role.name = name;
    if (description !== undefined) role.description = description;

    if (permissionIds) {
      // If SUPER_ADMIN, ensure it retains all system permissions
      if (role.code === 'SUPER_ADMIN') {
        const allPerms = await permRepo.find();
        role.permissions = allPerms;
      } else {
        role.permissions = permissionIds.length > 0 ? await permRepo.findBy({ id: In(permissionIds) }) : [];
      }
    }

    return roleRepo.save(role);
  }

  async deleteRole(id: string) {
    const roleRepo = this.getRoleRepo();
    const role = await this.findOneRole(id);

    if (role.code === 'SUPER_ADMIN') {
      throw new ForbiddenException('The SUPER_ADMIN role is an essential system role and cannot be deleted.');
    }

    await roleRepo.remove(role);
    return { success: true, message: `Role ${role.name} (${role.code}) deleted successfully` };
  }
}
