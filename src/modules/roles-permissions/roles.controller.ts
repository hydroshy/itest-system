import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '../users/entities/user.entity';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  async findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Post()
  @Roles(UserType.ADMIN)
  async createRole(@Body() body: { code: string; name: string; description: string; permissionIds: string[] }) {
    return this.rolesService.createRole(body.code, body.name, body.description, body.permissionIds);
  }
}
