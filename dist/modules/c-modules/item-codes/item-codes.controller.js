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
exports.ItemCodesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const item_codes_service_1 = require("./item-codes.service");
const item_code_dto_1 = require("./dto/item-code.dto");
let ItemCodesController = class ItemCodesController {
    constructor(service) {
        this.service = service;
    }
    async findAll(query) {
        return await this.service.findAll(query);
    }
    async findPicker(search) {
        return await this.service.findPicker(search);
    }
    async findOne(id) {
        return await this.service.findOne(id);
    }
    async create(dto) {
        return await this.service.create(dto);
    }
    async update(id, dto) {
        return await this.service.update(id, dto);
    }
    async remove(id) {
        return await this.service.remove(id);
    }
};
exports.ItemCodesController = ItemCodesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List master item codes with pagination and search' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [item_code_dto_1.QueryItemCodeDto]),
    __metadata("design:returntype", Promise)
], ItemCodesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('picker'),
    (0, swagger_1.ApiOperation)({ summary: 'Fast lightweight list for UI pickers and autocomplete dropdowns' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ItemCodesController.prototype, "findPicker", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single item code by UUID or unique itemCode' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ItemCodesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new master item code with auto SKU_FW computation' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [item_code_dto_1.CreateItemCodeDto]),
    __metadata("design:returntype", Promise)
], ItemCodesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update master item code' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, item_code_dto_1.UpdateItemCodeDto]),
    __metadata("design:returntype", Promise)
], ItemCodesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete master item code (safeguarded against in-use items)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ItemCodesController.prototype, "remove", null);
exports.ItemCodesController = ItemCodesController = __decorate([
    (0, swagger_1.ApiTags)('Item Codes Catalog'),
    (0, common_1.Controller)(['api/item-codes', 'api/c-modules/item-codes']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [item_codes_service_1.ItemCodesService])
], ItemCodesController);
//# sourceMappingURL=item-codes.controller.js.map