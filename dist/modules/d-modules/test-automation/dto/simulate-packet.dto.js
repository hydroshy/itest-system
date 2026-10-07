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
exports.SimulatePacketDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SimulatePacketDto {
}
exports.SimulatePacketDto = SimulatePacketDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'DevEUI of the device under test (16 hex chars)',
        example: '0011223344556601',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SimulatePacketDto.prototype, "devEUI", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'LoRaWAN fPort number',
        default: 1,
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SimulatePacketDto.prototype, "fPort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Hex-encoded payload from device uplink',
        example: '010100f50201025803010e10',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SimulatePacketDto.prototype, "payloadHex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'RSSI signal strength in dBm',
        default: -75,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SimulatePacketDto.prototype, "rssi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'SNR signal to noise ratio in dB',
        default: 9.5,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SimulatePacketDto.prototype, "snr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Gateway ID / MAC address',
        default: 'GW-BENCH-01',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SimulatePacketDto.prototype, "gatewayId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Frame counter fCnt',
        default: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SimulatePacketDto.prototype, "fCnt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Hardware Serial Number (Modbus Reg 259)',
        example: 'WSLRW-ATH-260901',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SimulatePacketDto.prototype, "serialNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter packet ingestion by Sales Order code',
        example: 'SO-2025-001',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SimulatePacketDto.prototype, "soCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter packet ingestion by Item Code',
        example: 'WSLRW-ATH-01',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SimulatePacketDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Direct target test session UUID',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SimulatePacketDto.prototype, "sessionId", void 0);
//# sourceMappingURL=simulate-packet.dto.js.map