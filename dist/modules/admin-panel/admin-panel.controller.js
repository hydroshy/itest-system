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
exports.AdminPanelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_panel_service_1 = require("./admin-panel.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let AdminPanelController = class AdminPanelController {
    constructor(adminPanelService) {
        this.adminPanelService = adminPanelService;
    }
    async getDashboard() {
        return await this.adminPanelService.getDashboardStats();
    }
    async reloadDbConfig() {
        return await this.adminPanelService.reloadDbConfig();
    }
};
exports.AdminPanelController = AdminPanelController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Thống kê Admin & trạng thái kết nối các DB pool' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPanelController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('reload-db-config'),
    (0, swagger_1.ApiOperation)({ summary: 'Reload cấu hình DB động không cần restart server' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPanelController.prototype, "reloadDbConfig", null);
exports.AdminPanelController = AdminPanelController = __decorate([
    (0, swagger_1.ApiTags)('Admin Panel'),
    (0, common_1.Controller)('admin-panel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_panel_service_1.AdminPanelService])
], AdminPanelController);
//# sourceMappingURL=admin-panel.controller.js.map