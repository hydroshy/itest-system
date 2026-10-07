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
exports.CreateTestEvidenceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateTestEvidenceDto {
}
exports.CreateTestEvidenceDto = CreateTestEvidenceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Session UUID' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Device Run UUID' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "deviceRunId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Session Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "sessionCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sales Order Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "soCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Item Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '16-hex DevEUI' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "devEUI", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hardware Serial Number (Modbus Reg 259)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "serialNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'SKU' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Firmware Version' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hardware Version' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "hardwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Raw hex uplink payload' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "payloadHex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'All decoded sensor fields' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTestEvidenceDto.prototype, "decodedFields", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Assertion verification results' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateTestEvidenceDto.prototype, "assertionResults", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Verdict (PASSED, FAILED, TIMEOUT, WARNING)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "verdict", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Failure reason if not passed' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "failureReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LoRaWAN fPort' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestEvidenceDto.prototype, "fPort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Frame Counter' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestEvidenceDto.prototype, "fCnt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'RSSI' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestEvidenceDto.prototype, "rssi", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'SNR' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestEvidenceDto.prototype, "snr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Battery Voltage' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTestEvidenceDto.prototype, "batteryVoltage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Operator Username' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestEvidenceDto.prototype, "operatorUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateTestEvidenceDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-test-evidence.dto.js.map