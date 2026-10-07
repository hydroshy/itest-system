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
exports.OdooImportDto = exports.OdooOrderLineDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class OdooOrderLineDto {
}
exports.OdooOrderLineDto = OdooOrderLineDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Odoo order line ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], OdooOrderLineDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Line description or item code' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooOrderLineDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product ID or [id, name]' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], OdooOrderLineDto.prototype, "product_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product SKU (default_code)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooOrderLineDto.prototype, "default_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product quantity', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OdooOrderLineDto.prototype, "product_uom_qty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Explicit itemCode override' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooOrderLineDto.prototype, "item_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target firmware version' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooOrderLineDto.prototype, "firmware_version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooOrderLineDto.prototype, "notes", void 0);
class OdooImportDto {
}
exports.OdooImportDto = OdooImportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Odoo sale.order ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], OdooImportDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sales Order Name (mapped to soCode)', example: 'SO0042' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooImportDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Customer: [id, name] or string', example: [14, 'Daviteq Customer'] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], OdooImportDto.prototype, "partner_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Order date', example: '2026-09-20 14:00:00' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OdooImportDto.prototype, "date_order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Order state in Odoo (draft, sale, done, cancel)', example: 'sale' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooImportDto.prototype, "state", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [OdooOrderLineDto], description: 'Order lines' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OdooOrderLineDto),
    __metadata("design:type", Array)
], OdooImportDto.prototype, "order_line", void 0);
//# sourceMappingURL=odoo-import.dto.js.map