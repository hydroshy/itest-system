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
exports.TestDecoderDto = exports.UpdateDecoderDto = exports.CreateDecoderDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateDecoderDto {
}
exports.CreateDecoderDto = CreateDecoderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'WSLRW-V1A', description: 'Product SKU code' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDecoderDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 9, description: 'Firmware version number between 1 and 32' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(32),
    __metadata("design:type", Number)
], CreateDecoderDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'function decodeUplink(input) { return { data: { raw: input.bytes } }; }',
        description: 'JavaScript payload decoder function code with optional sub-functions',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDecoderDto.prototype, "decoderCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Decoder for WSLRW-V1A Ambient Temperature & Humidity sensor', description: 'Description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDecoderDto.prototype, "description", void 0);
class UpdateDecoderDto {
}
exports.UpdateDecoderDto = UpdateDecoderDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'function decodeUplink(input) { return { data: { temp: input.bytes[0] } }; }',
        description: 'JavaScript payload decoder function code',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDecoderDto.prototype, "decoderCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated description', description: 'Description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDecoderDto.prototype, "description", void 0);
class TestDecoderDto {
}
exports.TestDecoderDto = TestDecoderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'function decodeUplink(input) { return { data: { temp: input.bytes[0] } }; }',
        description: 'JavaScript decoder function code to test',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestDecoderDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09C441', description: 'Hex-encoded payload string' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TestDecoderDto.prototype, "hex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, description: 'LoRaWAN fPort', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], TestDecoderDto.prototype, "fPort", void 0);
//# sourceMappingURL=decoder.dto.js.map