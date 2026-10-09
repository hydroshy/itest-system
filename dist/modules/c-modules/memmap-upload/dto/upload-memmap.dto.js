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
exports.UploadMemmapDto = exports.MemmapRegItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class MemmapRegItemDto {
}
exports.MemmapRegItemDto = MemmapRegItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Row order number in CSV', example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MemmapRegItemDto.prototype, "no", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Modbus Decimal Register', example: 0 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MemmapRegItemDto.prototype, "modbus_reg_dec", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Modbus Hex Register', example: '0' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "modbus_reg_hex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Function Code Read', example: '3', default: '3' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "fn_read", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Function Code Write', example: 'None', default: 'None' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "fn_write", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of registers occupied', example: 1, default: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MemmapRegItemDto.prototype, "num_regs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parameter description / tag name', example: 'FW_CODE' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Permitted range or values', example: '1-247' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "range_val", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Default value for end-users', example: 'SATH' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "end_user_default", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Data format', example: 'string' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Downlink type 5 support flag', example: 'No' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "downlink_type_5", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Flag in RD1 Template', example: false, default: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MemmapRegItemDto.prototype, "in_rd1_template", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Detailed comments or multiline notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MemmapRegItemDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Flag in Engineering Template', example: false, default: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MemmapRegItemDto.prototype, "in_engineering_template", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Flag in End-user Template', example: false, default: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MemmapRegItemDto.prototype, "in_end_user_template", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Flag in Full Template', example: true, default: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MemmapRegItemDto.prototype, "in_full_template", void 0);
class UploadMemmapDto {
}
exports.UploadMemmapDto = UploadMemmapDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Hardware SKU (e.g. WSLRW-ATH)',
        example: 'WSLRW-ATH',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UploadMemmapDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Full Firmware Version identifier string (e.g. 3F0825, 6Fmmdd)',
        example: '3F0825',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadMemmapDto.prototype, "long_fw", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Strict integer Short Firmware Version without prefix or decimals (e.g. 6)',
        example: 6,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UploadMemmapDto.prototype, "short_fw", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Original CSV filename',
        example: 'WSLRW-ATH-6.csv',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UploadMemmapDto.prototype, "file_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of 16-field Modbus register items',
        type: [MemmapRegItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MemmapRegItemDto),
    __metadata("design:type", Array)
], UploadMemmapDto.prototype, "registers", void 0);
//# sourceMappingURL=upload-memmap.dto.js.map