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
exports.MemmapManagerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const memmap_manager_service_1 = require("./memmap-manager.service");
let MemmapManagerController = class MemmapManagerController {
    constructor(memmapManagerService) {
        this.memmapManagerService = memmapManagerService;
    }
    async findAll() {
        const data = await this.memmapManagerService.findAll();
        return { success: true, data };
    }
    async getRegistersByPayloadId(id) {
        const data = await this.memmapManagerService.getRegistersByPayloadId(id);
        return { success: true, data };
    }
    async deletePayload(id) {
        return await this.memmapManagerService.deletePayload(id);
    }
};
exports.MemmapManagerController = MemmapManagerController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all stored Memory Map payloads' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MemmapManagerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/regs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get 16-field Modbus register definitions for a specific Memory Map' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'UUID of the memory map payload' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemmapManagerController.prototype, "getRegistersByPayloadId", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Permanently delete a Memory Map payload and cascade all its register rows' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'UUID of the memory map payload to delete' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemmapManagerController.prototype, "deletePayload", null);
exports.MemmapManagerController = MemmapManagerController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: Memory Map Manager'),
    (0, common_1.Controller)(['api/c-modules/memmap-manager', 'api/memmap-manager']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [memmap_manager_service_1.MemmapManagerService])
], MemmapManagerController);
//# sourceMappingURL=memmap-manager.controller.js.map