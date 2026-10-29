import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { UserType } from '../users/entities/user.entity';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller(['permissions', 'api/permissions', 'api/v1/permissions'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @ApiOperation({ summary: 'List all available system and plugin permissions' })
  async findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }
}
