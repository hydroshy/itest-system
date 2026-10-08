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
exports.UpdateModbusPresetDto = exports.CreateModbusPresetDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateModbusPresetDto {
}
exports.CreateModbusPresetDto = CreateModbusPresetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Template Display Name', example: 'Daviteq LKS Gas Sensor - RD1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateModbusPresetDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template description or notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModbusPresetDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target profile type', example: 'RD1', default: 'Custom' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModbusPresetDto.prototype, "profileType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Author or creator username' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModbusPresetDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sales Order ID or Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModbusPresetDto.prototype, "so", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Item Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModbusPresetDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hardware SKU' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModbusPresetDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Firmware Version' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateModbusPresetDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Short Firmware Version' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateModbusPresetDto.prototype, "shortFw", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Array of Modbus register mappings' }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateModbusPresetDto.prototype, "registers", void 0);
class UpdateModbusPresetDto {
}
exports.UpdateModbusPresetDto = UpdateModbusPresetDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template Display Name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateModbusPresetDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template description or notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateModbusPresetDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target profile type' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateModbusPresetDto.prototype, "profileType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Array of Modbus register mappings' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateModbusPresetDto.prototype, "registers", void 0);
//# sourceMappingURL=modbus-preset.dto.js.map