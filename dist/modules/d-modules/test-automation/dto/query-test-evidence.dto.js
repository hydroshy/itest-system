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
exports.QueryTestEvidenceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class QueryTestEvidenceDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.QueryTestEvidenceDto = QueryTestEvidenceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Sales Order Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryTestEvidenceDto.prototype, "soCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Item Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryTestEvidenceDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by DevEUI' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryTestEvidenceDto.prototype, "devEUI", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Serial Number (Modbus Reg 259)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryTestEvidenceDto.prototype, "serialNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by SKU' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryTestEvidenceDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Test Verdict (PASSED, FAILED, TIMEOUT, ALL)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryTestEvidenceDto.prototype, "verdict", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Session UUID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryTestEvidenceDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Global text search across DevEUI, Serial, SO, Item Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryTestEvidenceDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number (default 1)', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QueryTestEvidenceDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page (default 20, max 100)', default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], QueryTestEvidenceDto.prototype, "limit", void 0);
//# sourceMappingURL=query-test-evidence.dto.js.map