import { Injectable, NotFoundException, ForbiddenException, OnModuleInit, Logger } from '@nestjs/common';
import { In } from 'typeorm';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly dbService: DynamicDatabaseService) {}

  private getRoleRepo() {
    return this.dbService.getRepositoryForTable('roles', Role);
  }

  private getPermissionRepo() {
    return this.dbService.getRepositoryForTable('permission', Permission);
  }

  async onModuleInit() {
    // Seed default permissions and roles if empty
    try {
      await this.seedDefaults();
    } catch (e: any) {
      this.logger.warn(`Could not seed default roles/permissions: ${e.message}`);
    }
  }

  public async seedDefaults() {
    const permRepo = this.getPermissionRepo();
    const roleRepo = this.getRoleRepo();

    const permCount = await permRepo.count();
    if (permCount === 0) {
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
      await permRepo.save(permRepo.create(defaultPerms));
      this.logger.log(`✅ Initialized ${defaultPerms.length} default system permissions into [permission] table.`);
    }

    const roleCount = await roleRepo.count();
    if (roleCount === 0) {
      const allPerms = await permRepo.find();
      const subAdminPerms = allPerms.filter((p) => !p.name.includes('users:permissions:update'));

      const defaultRoles = [
        {
          code: 'SUPER_ADMIN',
          name: 'Super Administrator',
          description: 'Full unhindered system access',
          permissions: allPerms,
        },
        {
          code: 'SUB_ADMIN',
          name: 'Sub-Administrator',
          description: 'Delegated administrative privileges',
          permissions: subAdminPerms,
        },
        {
          code: 'LORAWAN_OPERATOR',
          name: 'LoRaWAN Operator',
          description: 'Manage applications, devices, and gateways',
          permissions: allPerms.filter((p) => p.module === 'lorawan'),
        },
      ];
      await roleRepo.save(roleRepo.create(defaultRoles));
      this.logger.log(`✅ Initialized default roles (SUPER_ADMIN, SUB_ADMIN, LORAWAN_OPERATOR) into [roles] table.`);
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
