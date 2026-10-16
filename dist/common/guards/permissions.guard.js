"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const roles_decorator_1 = require("../decorators/roles.decorator");
const user_entity_1 = require("../../backend/identity/modules/users/entities/user.entity");
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles && !requiredPermissions) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            throw new common_1.ForbiddenException('User session not found');
        }
        const isSuperAdmin = user.userType === user_entity_1.UserType.ADMIN ||
            String(user.userType).toUpperCase() === 'ADMIN' ||
            String(user.userType).toUpperCase() === 'SUPER_ADMIN' ||
            user.username === 'admin' ||
            user.roles?.some((r) => r.code?.toUpperCase() === 'SUPER_ADMIN');
        if (isSuperAdmin) {
            return true;
        }
        if (requiredRoles && requiredRoles.length > 0) {
            const hasRoleType = requiredRoles.includes(user.userType) || requiredRoles.includes(String(user.userType).toUpperCase());
            const hasAssignedRole = user.roles?.some((r) => requiredRoles.includes(r.code) || requiredRoles.includes(r.code?.toUpperCase()));
            if (!hasRoleType && !hasAssignedRole) {
                throw new common_1.ForbiddenException(`User lacks required role: ${requiredRoles.join(', ')}`);
            }
        }
        if (requiredPermissions && requiredPermissions.length > 0) {
            const userPermissions = new Set();
            user.roles?.forEach((role) => {
                role.permissions?.forEach((p) => userPermissions.add(p.name));
            });
            const hasPermission = (perm) => {
                if (userPermissions.has(perm))
                    return true;
                if (perm.startsWith('lorawan:device:') && userPermissions.has('lorawan:device:manage'))
                    return true;
                if (perm.startsWith('users:') && userPermissions.has('users:manage'))
                    return true;
                if (perm.startsWith('roles:') && userPermissions.has('roles:manage'))
                    return true;
                return false;
            };
            const hasAllPermissions = requiredPermissions.every((perm) => hasPermission(perm));
            if (!hasAllPermissions) {
                throw new common_1.ForbiddenException(`Missing permission(s): ${requiredPermissions.join(', ')}`);
            }
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map