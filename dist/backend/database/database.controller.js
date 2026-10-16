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
exports.DatabaseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dynamic_database_service_1 = require("./dynamic-database.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_entity_1 = require("../identity/modules/users/entities/user.entity");
let DatabaseController = class DatabaseController {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async getDatabaseHealth() {
        return this.dbService.getDatabaseHealth();
    }
    async getConnectionStatus() {
        return this.dbService.getConnectionStatus();
    }
    async reloadConfig() {
        await this.dbService.loadConfigAndInitializeDataSources();
        return {
            success: true,
            message: 'Database routing configuration reloaded successfully',
            status: this.dbService.getConnectionStatus(),
        };
    }
};
exports.DatabaseController = DatabaseController;
__decorate([
    (0, common_1.Get)('health'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get visual database health status & table metrics (Super Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getDatabaseHealth", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get raw connection pool status and table routing table' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getConnectionStatus", null);
__decorate([
    (0, common_1.Post)('reload'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserType.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Hot-reload routing configuration from db-routing.config.json' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "reloadConfig", null);
exports.DatabaseController = DatabaseController = __decorate([
    (0, swagger_1.ApiTags)('Database Health & Dynamic Routing (Super Admin Only)'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('database'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], DatabaseController);
//# sourceMappingURL=database.controller.js.map