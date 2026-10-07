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
exports.QuerySensorTypeDto = exports.UpdateSensorTypeDto = exports.CreateSensorTypeDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateSensorTypeDto {
}
exports.CreateSensorTypeDto = CreateSensorTypeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Modbus Sensor Type decimal code (1-255)', example: 71 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(255),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateSensorTypeDto.prototype, "sensorTypeCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hardware SKU code', example: 'WSLRW-LKS' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSensorTypeDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Human readable name', example: 'Wireless LoRaWAN Leak Sensor' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSensorTypeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Detailed description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSensorTypeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default LoRaWAN region', default: 'EU868' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSensorTypeDto.prototype, "defaultRegion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default LoRaWAN class', default: 'A' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSensorTypeDto.prototype, "defaultClass", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Active status', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateSensorTypeDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateSensorTypeDto.prototype, "metadata", void 0);
class UpdateSensorTypeDto {
}
exports.UpdateSensorTypeDto = UpdateSensorTypeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Modbus Sensor Type decimal code (1-255)' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(255),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateSensorTypeDto.prototype, "sensorTypeCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hardware SKU code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSensorTypeDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Human readable name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSensorTypeDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Detailed description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSensorTypeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default LoRaWAN region' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSensorTypeDto.prototype, "defaultRegion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default LoRaWAN class' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSensorTypeDto.prototype, "defaultClass", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Active status' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateSensorTypeDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateSensorTypeDto.prototype, "metadata", void 0);
class QuerySensorTypeDto {
}
exports.QuerySensorTypeDto = QuerySensorTypeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search term by sensorTypeCode, SKU, or name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QuerySensorTypeDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by active status' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], QuerySensorTypeDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuerySensorTypeDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page limit', default: 50 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], QuerySensorTypeDto.prototype, "limit", void 0);
//# sourceMappingURL=sensor-type.dto.js.map