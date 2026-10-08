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
exports.QueryDeviceTestedDto = exports.CreateDeviceTestedDto = exports.VerifyDeviceTestedDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class VerifyDeviceTestedDto {
}
exports.VerifyDeviceTestedDto = VerifyDeviceTestedDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Serial Number to verify', example: 'SN2026040001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "serial_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Item Code to verify against', example: 'WSLRW-ATH-01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "item_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Selected Sales Order to verify against', example: 'SO-2026-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "so", void 0);
class CreateDeviceTestedDto {
}
exports.CreateDeviceTestedDto = CreateDeviceTestedDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Sales Order Code', example: 'SO-2026-001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "so", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Item Code', example: 'WSLRW-ATH-01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "item_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Serial Number', example: 'SN2026040001' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "serial_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Device EUI (Hex 16 chars)', example: 'A84041000182ABCD' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "dev_eui", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product SKU', example: 'WSLRW-ATH' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Firmware Version', example: '1.0.4' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "firmware_version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Short FW version (e.g. 1)', default: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateDeviceTestedDto.prototype, "short_fw", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sensor Type Code', default: 0 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateDeviceTestedDto.prototype, "sensor_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'QA Testing Status', enum: ['PASS', 'PASSED', 'FAIL', 'FAILED', 'PENDING'], default: 'PASS' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Testing Station ID', default: 'STATION-01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "station_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Operator username', default: 'admin' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "operator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LoRaWAN AppKey if tested' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "app_key", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Testing Timestamp' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateDeviceTestedDto.prototype, "tested_at", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata JSON' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateDeviceTestedDto.prototype, "metadata", void 0);
class QueryDeviceTestedDto {
}
exports.QueryDeviceTestedDto = QueryDeviceTestedDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by SO' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "so", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Item Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "item_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Serial Number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "serial_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Status' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Keyword search' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryDeviceTestedDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 50 }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueryDeviceTestedDto.prototype, "limit", void 0);
//# sourceMappingURL=device-tested.dto.js.map