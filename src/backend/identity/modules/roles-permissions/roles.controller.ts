import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserType } from '../users/entities/user.entity';

import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignRoleUsersDto,
  AssignRolePermissionsDto,
  AssignRoleMenusDto,
} from './dto/role.dto';

@ApiTags('Roles & Permissions (RBAC)')
@ApiBearerAuth()
@Controller(['roles', 'api/roles', 'api/v1/roles'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'List all system roles with assigned permissions' })
  async findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'List all available system permissions' })
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(['menus', 'menu-items'])
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'List all available menu view cards' })
  async findAllMenuItems() {
    return this.rolesService.findAllMenuItems();
  }

  @Get(':id')
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'Get single role details by ID' })
  async findOneRole(@Param('id') id: string) {
    return this.rolesService.findOneRole(id);
  }

  @Post()
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Create new role (Super Admin only)' })
  async createRole(@Body() body: CreateRoleDto) {
    return this.rolesService.createRole(
      body.code,
      body.name,
      body.description || '',
      body.permissionIds || [],
    );
  }

  @Put(':id')
  @Patch(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Update role details / permissions fallback' })
  async updateRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.rolesService.updateRole(id, body.name, body.description, body.permissionIds);
  }

  @Delete(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Delete role (Super Admin only, cannot delete system roles)' })
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }

  // ==========================================
  // STEP 1: USERS ASSIGNMENT
  // ==========================================
  @Get(':id/users')
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'Get assigned users for role' })
  async findUsersByRole(@Param('id') id: string) {
    return this.rolesService.findUsersByRole(id);
  }

  @Put(':id/users')
  @Patch(':id/users')
  @Post([':id/users', ':id/assign-users'])
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Assign users to role' })
  async assignUsersToRole(@Param('id') id: string, @Body() body: AssignRoleUsersDto) {
    return this.rolesService.assignUsersToRole(id, body.userIds || []);
  }

  // ==========================================
  // STEP 2: PLUGIN PERMISSIONS ASSIGNMENT
  // ==========================================
  @Get(':id/permissions')
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'Get assigned permissions for role' })
  async findPermissionsByRole(@Param('id') id: string) {
    return this.rolesService.findPermissionsByRole(id);
  }

  @Put(':id/permissions')
  @Patch(':id/permissions')
  @Post(':id/permissions')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Assign permissions to role' })
  async assignPermissionsToRole(@Param('id') id: string, @Body() body: AssignRolePermissionsDto) {
    return this.rolesService.assignPermissionsToRole(id, body.permissionIds || []);
  }

  // ==========================================
  // STEP 3: MENU VIEWS VISIBILITY
  // ==========================================
  @Get(':id/menus')
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'Get assigned menu views for role' })
  async findMenusByRole(@Param('id') id: string) {
    return this.rolesService.findMenusByRole(id);
  }

  @Put(':id/menus')
  @Patch(':id/menus')
  @Post(':id/menus')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Assign menu views to role' })
  async assignMenusToRole(@Param('id') id: string, @Body() body: AssignRoleMenusDto) {
    const menuIds = body.menuKeys || body.menuItemIds || body.menuIds || [];
    return this.rolesService.assignMenusToRole(id, menuIds);
  }
}
