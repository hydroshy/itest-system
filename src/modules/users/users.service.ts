import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { In } from 'typeorm';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { User, UserType } from './entities/user.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { Permission } from '../roles-permissions/entities/permission.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DynamicDatabaseService) {}

  private getUserRepo() {
    return this.dbService.getRepositoryForTable('users', User);
  }

  private getRoleRepo() {
    return this.dbService.getRepositoryForTable('roles', Role);
  }

  private getPermissionRepo() {
    return this.dbService.getRepositoryForTable('permission', Permission);
  }

  async createUser(dto: CreateUserDto, creator: User) {
    const repo = this.getUserRepo();

    // Check existing
    const existing = await repo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) {
      throw new ConflictException('Username or Email already exists');
    }

    // Sub-admins cannot create ADMIN users
    if (dto.userType === UserType.ADMIN && creator.userType !== UserType.ADMIN) {
      throw new ForbiddenException('Only Super Admin can create ADMIN users');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = repo.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
      userType: dto.userType || UserType.USER,
      createdById: creator.id,
      isActive: true,
    });

    if (dto.roleIds && dto.roleIds.length > 0) {
      user.roles = await this.getRoleRepo().findBy({ id: In(dto.roleIds) });
    }

    const saved = await repo.save(user);
    delete saved.passwordHash;
    return saved;
  }

  async findAllUsers() {
    const repo = this.getUserRepo();
    try {
      return await repo.find({
        relations: ['roles', 'roles.permissions'],
        order: { createdAt: 'DESC' },
      });
    } catch (e) {
      return await repo.find({
        order: { createdAt: 'DESC' },
      });
    }
  }

  async findOneUser(id: string) {
    const repo = this.getUserRepo();
    let user: User | null = null;
    try {
      user = await repo.findOne({
        where: { id },
        relations: ['roles', 'roles.permissions'],
      });
    } catch (e) {
      user = await repo.findOne({
        where: { id },
      });
    }
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateUserPermissions(id: string, dto: UpdateUserPermissionsDto) {
    const repo = this.getUserRepo();
    const user = await this.findOneUser(id);

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    if (dto.roleIds) {
      user.roles = await this.getRoleRepo().findBy({ id: In(dto.roleIds) });
    }

    const saved = await repo.save(user);
    delete saved.passwordHash;
    return saved;
  }

  async deleteUser(id: string) {
    const repo = this.getUserRepo();
    const user = await this.findOneUser(id);
    if (user.userType === UserType.ADMIN) {
      throw new ForbiddenException('Cannot delete primary Admin account');
    }
    await repo.remove(user);
    return { success: true, message: `User ${id} removed successfully` };
  }
}
