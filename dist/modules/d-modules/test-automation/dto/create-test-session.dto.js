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
exports.CreateTestSessionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateTestSessionDto {
}
exports.CreateTestSessionDto = CreateTestSessionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Unique test session code (e.g. TS-20260922-001). Auto-generated if omitted.',
        example: 'TS-20260922-001',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestSessionDto.prototype, "sessionCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sales Order Code (e.g. SO-2026-8899)',
        example: 'SO-2026-8899',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestSessionDto.prototype, "soCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Item Code within the Sales Order (e.g. WSLRW-TH-01)',
        example: 'WSLRW-TH-01',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestSessionDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Test Template UUID (auto-detected from Item Code / SKU if omitted)',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestSessionDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of 16-hex-character DevEUIs to test. Can be passed as an array of strings or newline/comma-separated text.',
        example: ['0011223344556601', '0011223344556602'],
    }),
    __metadata("design:type", Object)
], CreateTestSessionDto.prototype, "devEUIs", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Session notes or factory batch/lot identifier',
        example: 'Batch 50 units for Factory Inspection ISO audit',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestSessionDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Immediately start the test session upon creation',
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateTestSessionDto.prototype, "autoStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Custom metadata payload',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateTestSessionDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Explicit device SKU for manual SO creation',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestSessionDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Explicit device firmware version for manual SO creation',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestSessionDto.prototype, "firmwareVersion", void 0);
//# sourceMappingURL=create-test-session.dto.js.map