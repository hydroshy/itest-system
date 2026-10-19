import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { In } from 'typeorm';
import { DynamicDatabaseService } from '../../../database/dynamic-database.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly dbService: DynamicDatabaseService) {}

  private getRoleRepo() {
    return this.dbService.getRepositoryForTable('roles', Role);
  }

  private getPermissionRepo() {
    return this.dbService.getRepositoryForTable('permission', Permission);
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

  async createRole(code: string, name: string, description?: string, permissionIds?: string[]) {
    const roleRepo = this.getRoleRepo();
    const permRepo = this.getPermissionRepo();

    const normalizedCode = (code || '').trim();
    if (normalizedCode === 'SUPER_ADMIN' || normalizedCode === 'admin') {
      throw new ForbiddenException('Cannot create another admin system role');
    }

    const permissions = permissionIds && permissionIds.length > 0 ? await permRepo.findBy({ id: In(permissionIds) }) : [];
    const role = roleRepo.create({ code: normalizedCode, name, description, permissions });
    return roleRepo.save(role);
  }

  async updateRole(id: string, name?: string, description?: string, permissionIds?: string[]) {
    const roleRepo = this.getRoleRepo();
    const permRepo = this.getPermissionRepo();
    const role = await this.findOneRole(id);

    if (name) role.name = name;
    if (description !== undefined) role.description = description;

    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        role.permissions = await permRepo.findBy({ id: In(permissionIds) });
      } else {
        role.permissions = [];
      }
    }

    return roleRepo.save(role);
  }

  async deleteRole(id: string) {
    const roleRepo = this.getRoleRepo();
    const role = await this.findOneRole(id);

    if (role.code === 'SUPER_ADMIN' || role.code === 'admin') {
      throw new ForbiddenException('The system admin role is an essential role and cannot be deleted.');
    }

    await roleRepo.remove(role);
    return { success: true, message: `Role ${role.name} (${role.code}) deleted successfully` };
  }
}
