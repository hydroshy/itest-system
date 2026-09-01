import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User, UserType } from '../../modules/users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(UserType | string)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles or permissions specified, permit access
    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user }: { user: User } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User session not found');
    }

    // ADMIN userType gets bypass
    if (user.userType === UserType.ADMIN) {
      return true;
    }

    // 1. Check Roles requirement if present
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRoleType = requiredRoles.includes(user.userType);
      const hasAssignedRole = user.roles?.some((r) => requiredRoles.includes(r.code));
      if (!hasRoleType && !hasAssignedRole) {
        throw new ForbiddenException(`User lacks required role: ${requiredRoles.join(', ')}`);
      }
    }

    // 2. Check Permissions requirement if present
    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = new Set<string>();

      // Collect permissions from assigned roles
      user.roles?.forEach((role) => {
        role.permissions?.forEach((p) => userPermissions.add(p.name));
      });

      // Collect direct permissions
      user.directPermissions?.forEach((p) => userPermissions.add(p.name));

      const hasAllPermissions = requiredPermissions.every((perm) => userPermissions.has(perm));
      if (!hasAllPermissions) {
        throw new ForbiddenException(`Missing permission(s): ${requiredPermissions.join(', ')}`);
      }
    }

    return true;
  }
}
