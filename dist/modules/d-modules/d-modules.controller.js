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
exports.DModulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const d_modules_service_1 = require("./d-modules.service");
let DModulesController = class DModulesController {
    constructor(dModulesService) {
        this.dModulesService = dModulesService;
    }
    getSerialProfiles() {
        return this.dModulesService.getModbusProfiles();
    }
    getSerialRegisters(sku, firmwareVersion) {
        return this.dModulesService.getModbusRegisters(sku, firmwareVersion);
    }
    getAccessibleModules(user) {
        return this.dModulesService.getAccessibleModules(user);
    }
    getAllModules() {
        return this.dModulesService.getAllModules();
    }
    getAllRoleLayouts() {
        return this.dModulesService.getAllRoleLayouts();
    }
    getRoleLayout(roleCode) {
        return this.dModulesService.getRoleLayout(roleCode);
    }
    saveRoleLayout(roleCode, dto) {
        try {
            return this.dModulesService.saveRoleLayout(roleCode, dto);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to save role layout', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    resetRoleLayout(roleCode) {
        return this.dModulesService.resetRoleLayout(roleCode);
    }
    createModule(dto) {
        try {
            return this.dModulesService.createModule(dto);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to create module', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    updateModule(id, dto) {
        try {
            return this.dModulesService.updateModule(id, dto);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to update module', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    deleteModule(id) {
        try {
            return this.dModulesService.deleteModule(id);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to delete module', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    resetDefaults() {
        return this.dModulesService.resetToDefaults();
    }
};
exports.DModulesController = DModulesController;
__decorate([
    (0, common_1.Get)('serial-memmap/profiles'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Modbus memory map profiles for serial diagnostic' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "getSerialProfiles", null);
__decorate([
    (0, common_1.Get)('serial-memmap/registers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Modbus registers by SKU and firmware version' }),
    __param(0, (0, common_1.Query)('sku')),
    __param(1, (0, common_1.Query)('firmwareVersion')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "getSerialRegisters", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get accessible dashboard modules for the logged in user (sorted by role layout)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "getAccessibleModules", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all configured dashboard modules' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "getAllModules", null);
__decorate([
    (0, common_1.Get)(['layouts', 'roles/layouts']),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all role layout configurations' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "getAllRoleLayouts", null);
__decorate([
    (0, common_1.Get)(['roles/:roleCode/layout', 'layouts/:roleCode']),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get layout configuration for a specific role' }),
    __param(0, (0, common_1.Param)('roleCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "getRoleLayout", null);
__decorate([
    (0, common_1.Put)(['roles/:roleCode/layout', 'layouts/:roleCode']),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Save layout configuration (drag-and-drop order & disabled list) for a role' }),
    __param(0, (0, common_1.Param)('roleCode')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "saveRoleLayout", null);
__decorate([
    (0, common_1.Post)(['roles/:roleCode/reset', 'layouts/:roleCode/reset']),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Reset layout configuration for a role to defaults' }),
    __param(0, (0, common_1.Param)('roleCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "resetRoleLayout", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Create a new dashboard module' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "createModule", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update an existing dashboard module' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "updateModule", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Delete a dashboard module' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "deleteModule", null);
__decorate([
    (0, common_1.Post)('reset-defaults'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Reset all modules and role layouts to standard default registry' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DModulesController.prototype, "resetDefaults", null);
exports.DModulesController = DModulesController = __decorate([
    (0, swagger_1.ApiTags)('Dashboard module Manager & Role Layout Designer'),
    (0, common_1.Controller)(['api/d-modules', 'api/features', 'api/module-manager', 'api/dashboard-module-manager']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [d_modules_service_1.DModulesService])
], DModulesController);
//# sourceMappingURL=d-modules.controller.js.map