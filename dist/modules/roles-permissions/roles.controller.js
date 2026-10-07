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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_service_1 = require("./roles.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const role_dto_1 = require("./dto/role.dto");
let RolesController = class RolesController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    async findAllRoles() {
        return this.rolesService.findAllRoles();
    }
    async findAllPermissions() {
        return this.rolesService.findAllPermissions();
    }
    async findOneRole(id) {
        return this.rolesService.findOneRole(id);
    }
    async createRole(body) {
        return this.rolesService.createRole(body.code, body.name, body.description || '', body.permissionIds || []);
    }
    async updateRole(id, body) {
        return this.rolesService.updateRole(id, body.name, body.description, body.permissionIds);
    }
    async deleteRole(id) {
        return this.rolesService.deleteRole(id);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN, user_entity_1.UserType.SUB_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all system roles with assigned permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN, user_entity_1.UserType.SUB_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all available system permissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findAllPermissions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN, user_entity_1.UserType.SUB_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get single role details by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findOneRole", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create new role (Super Admin only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update role and permissions (Super Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete role (Super Admin only - SUPER_ADMIN is immutable)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "deleteRole", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)('Roles & Permissions (RBAC)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('roles'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map