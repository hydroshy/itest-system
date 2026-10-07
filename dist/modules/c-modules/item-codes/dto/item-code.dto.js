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
exports.ItemCodePickerItemDto = exports.QueryItemCodeDto = exports.UpdateItemCodeDto = exports.CreateItemCodeDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateItemCodeDto {
    constructor() {
        this.firmwareVersion = '1';
        this.isActive = true;
    }
}
exports.CreateItemCodeDto = CreateItemCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique Item Code', example: 'ITEM-WSLRW-ATH-01' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateItemCodeDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Device SKU', example: 'WSLRW-ATH' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateItemCodeDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Firmware version without v prefix', example: '6', default: '1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateItemCodeDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default Test Template UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, val) => val !== '' && val !== null && val !== undefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateItemCodeDto.prototype, "defaultTemplateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Item description', example: 'Temperature & Humidity Sensor' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateItemCodeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Active in catalog', default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateItemCodeDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Extra metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateItemCodeDto.prototype, "metadata", void 0);
class UpdateItemCodeDto {
}
exports.UpdateItemCodeDto = UpdateItemCodeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unique Item Code' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateItemCodeDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device SKU' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateItemCodeDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Firmware version without v prefix' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateItemCodeDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default Test Template UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, val) => val !== '' && val !== null && val !== undefined),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateItemCodeDto.prototype, "defaultTemplateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Item description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateItemCodeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Active in catalog' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateItemCodeDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Extra metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateItemCodeDto.prototype, "metadata", void 0);
class QueryItemCodeDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.QueryItemCodeDto = QueryItemCodeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryItemCodeDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryItemCodeDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search keyword for itemCode, sku, skuFw, description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryItemCodeDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by exact SKU' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryItemCodeDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by active state' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], QueryItemCodeDto.prototype, "isActive", void 0);
class ItemCodePickerItemDto {
}
exports.ItemCodePickerItemDto = ItemCodePickerItemDto;
//# sourceMappingURL=item-code.dto.js.map