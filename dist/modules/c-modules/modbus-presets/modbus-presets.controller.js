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
exports.ModbusPresetsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
const modbus_presets_service_1 = require("./modbus-presets.service");
const modbus_preset_dto_1 = require("./dto/modbus-preset.dto");
let ModbusPresetsController = class ModbusPresetsController {
    constructor(presetsService) {
        this.presetsService = presetsService;
    }
    async findAll() {
        return this.presetsService.findAll();
    }
    async findOne(id) {
        return this.presetsService.findOne(id);
    }
    async create(dto, user) {
        try {
            const username = user?.username || user?.fullName || 'admin';
            return await this.presetsService.create(dto, username);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to create preset', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async update(id, dto, user) {
        try {
            const username = user?.username || user?.fullName || 'admin';
            return await this.presetsService.update(id, dto, username);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to update preset', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async delete(id) {
        try {
            return await this.presetsService.delete(id);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to delete preset', common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.ModbusPresetsController = ModbusPresetsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all Modbus presets & templates' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModbusPresetsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific Modbus preset by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModbusPresetsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new Modbus preset / template' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [modbus_preset_dto_1.CreateModbusPresetDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ModbusPresetsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing Modbus preset' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, modbus_preset_dto_1.UpdateModbusPresetDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], ModbusPresetsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a Modbus preset' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModbusPresetsController.prototype, "delete", null);
exports.ModbusPresetsController = ModbusPresetsController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: Modbus Presets & Templates Manager'),
    (0, common_1.Controller)(['api/modbus-presets', 'api/c-modules/modbus-presets']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [modbus_presets_service_1.ModbusPresetsService])
], ModbusPresetsController);
//# sourceMappingURL=modbus-presets.controller.js.map