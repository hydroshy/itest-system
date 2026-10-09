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
exports.CreateFinalConfigController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
const create_final_config_service_1 = require("./create-final-config.service");
let CreateFinalConfigController = class CreateFinalConfigController {
    constructor(finalConfigService) {
        this.finalConfigService = finalConfigService;
    }
    async saveFinalConfig(dto, user) {
        const author = user?.username || user?.fullName || 'admin';
        return await this.finalConfigService.saveFinalConfig(dto, author);
    }
    async listFinalConfigs() {
        const data = await this.finalConfigService.listFinalConfigs();
        return { success: true, data };
    }
    async getFinalConfig(so, itemCode) {
        const data = await this.finalConfigService.getFinalConfig(so, itemCode);
        return { success: true, data };
    }
};
exports.CreateFinalConfigController = CreateFinalConfigController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save or update Final Configuration preset linked by SO, Item Code, SKU, and Firmware' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], CreateFinalConfigController.prototype, "saveFinalConfig", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all Final Configuration presets' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CreateFinalConfigController.prototype, "listFinalConfigs", null);
__decorate([
    (0, common_1.Get)(':so/:itemCode'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Final Configuration preset and registers by SO and Item Code' }),
    (0, swagger_1.ApiParam)({ name: 'so', example: 'SO/2026/00001' }),
    (0, swagger_1.ApiParam)({ name: 'itemCode', example: 'WSLRW-ATH-01' }),
    __param(0, (0, common_1.Param)('so')),
    __param(1, (0, common_1.Param)('itemCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CreateFinalConfigController.prototype, "getFinalConfig", null);
exports.CreateFinalConfigController = CreateFinalConfigController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: Create Final Config'),
    (0, common_1.Controller)(['api/c-modules/create-final-config', 'api/create-final-config']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [create_final_config_service_1.CreateFinalConfigService])
], CreateFinalConfigController);
//# sourceMappingURL=create-final-config.controller.js.map