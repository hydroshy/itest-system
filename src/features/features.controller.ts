import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserType } from '../modules/users/entities/user.entity';
import { FEATURE_MODULES_REGISTRY } from './feature-registry';

@ApiTags('User Feature Modules')
@Controller('api/features')
export class FeaturesController {
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get accessible feature modules for the logged in user' })
  getAccessibleFeatures(@CurrentUser() user: User) {
    const isSuperAdmin =
      user.userType === UserType.ADMIN ||
      String(user.userType).toUpperCase() === 'ADMIN' ||
      user.username === 'admin' ||
      user.roles?.some((r) => r.code === 'SUPER_ADMIN');

    if (isSuperAdmin) {
      return FEATURE_MODULES_REGISTRY;
    }

    const userPermissions = new Set<string>();
    user.roles?.forEach((role) => {
      role.permissions?.forEach((p) => userPermissions.add(p.name));
    });

    return FEATURE_MODULES_REGISTRY.filter((feature) => {
      if (!feature.requiredPermission) return true;
      return userPermissions.has(feature.requiredPermission);
    });
  }
}
