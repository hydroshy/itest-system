import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '../users/entities/user.entity';

@ApiTags('Roles & Permissions (RBAC)')
@ApiBearerAuth()
@Controller('roles')
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

  @Get(':id')
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'Get single role details by ID' })
  async findOneRole(@Param('id') id: string) {
    return this.rolesService.findOneRole(id);
  }

  @Post()
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Create new role (Super Admin only)' })
  async createRole(@Body() body: { code: string; name: string; description: string; permissionIds: string[] }) {
    return this.rolesService.createRole(body.code, body.name, body.description, body.permissionIds);
  }

  @Put(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Update role and permissions (Super Admin only)' })
  async updateRole(
    @Param('id') id: string,
    @Body() body: { name: string; description: string; permissionIds?: string[] },
  ) {
    return this.rolesService.updateRole(id, body.name, body.description, body.permissionIds);
  }

  @Delete(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Delete role (Super Admin only - SUPER_ADMIN is immutable)' })
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.deleteRole(id);
  }
}
