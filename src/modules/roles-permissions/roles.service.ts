import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { In } from 'typeorm';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private readonly dbService: DynamicDatabaseService) {}

  private getRoleRepo() {
    return this.dbService.getRepositoryForTable('roles', Role);
  }

  private getPermissionRepo() {
    return this.dbService.getRepositoryForTable('permissions', Permission);
  }

  async onModuleInit() {
    // Seed default permissions and roles if empty
    try {
      await this.seedDefaults();
    } catch (e) {
      // Ignore if database connections are not created yet during test
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
    }
  }

  async findAllRoles() {
    return this.getRoleRepo().find({ relations: ['permissions'] });
  }

  async findAllPermissions() {
    return this.getPermissionRepo().find();
  }

  async createRole(code: string, name: string, description: string, permissionIds: string[]) {
    const roleRepo = this.getRoleRepo();
    const permRepo = this.getPermissionRepo();

    const permissions = permissionIds && permissionIds.length > 0 ? await permRepo.findBy({ id: In(permissionIds) }) : [];
    const role = roleRepo.create({ code, name, description, permissions });
    return roleRepo.save(role);
  }
}
