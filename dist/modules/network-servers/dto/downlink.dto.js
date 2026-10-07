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
exports.FlushQueueDto = exports.SendDownlinkDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SendDownlinkDto {
}
exports.SendDownlinkDto = SendDownlinkDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'DevEUI of target LoRaWAN device (16 hex chars)', example: '0102030405060708' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendDownlinkDto.prototype, "devEUI", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LoRaWAN fPort (1-223)', default: 1, example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(223),
    __metadata("design:type", Number)
], SendDownlinkDto.prototype, "fPort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Downlink Hex payload', example: '0102A3FF' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendDownlinkDto.prototype, "payloadHex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether to require confirmed ACK', default: false, example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SendDownlinkDto.prototype, "confirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Flush existing downlink queue on Network Server before enqueueing', default: false, example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SendDownlinkDto.prototype, "flushQueue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target Network Server ID (optional override)', example: 'a1b2c3d4-0000-0000-0000-000000000000' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendDownlinkDto.prototype, "networkServerId", void 0);
class FlushQueueDto {
}
exports.FlushQueueDto = FlushQueueDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'DevEUI of target LoRaWAN device', example: '0102030405060708' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlushQueueDto.prototype, "devEUI", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Network Server ID', example: 'a1b2c3d4-0000-0000-0000-000000000000' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FlushQueueDto.prototype, "networkServerId", void 0);
//# sourceMappingURL=downlink.dto.js.map