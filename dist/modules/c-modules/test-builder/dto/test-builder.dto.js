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
exports.ExtractDecoderFieldsDto = exports.ExecuteFlowDto = exports.ValidateFlowDto = exports.DryRunTestDto = exports.UpdateTestTemplateDto = exports.CreateTestTemplateDto = exports.CreateAssertionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class CreateAssertionDto {
}
exports.CreateAssertionDto = CreateAssertionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Extracted payload field name (e.g. temperature, co2, battery)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAssertionDto.prototype, "fieldName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User-facing display label' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssertionDto.prototype, "fieldLabel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Matching operator', enum: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN_RANGE', 'BETWEEN', 'REGEX', 'IS_NOT_NULL', 'CONTAINS'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsIn)(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN_RANGE', 'BETWEEN', 'REGEX', 'IS_NOT_NULL', 'CONTAINS']),
    __metadata("design:type", String)
], CreateAssertionDto.prototype, "operator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expected value (scalar or { min, max })' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAssertionDto.prototype, "expectedValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Allowed tolerance' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAssertionDto.prototype, "tolerance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Engineering unit (e.g. °C, ppm, V)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssertionDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Severity level', enum: ['ERROR', 'WARNING'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ERROR', 'WARNING']),
    __metadata("design:type", String)
], CreateAssertionDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Order index' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAssertionDto.prototype, "orderIndex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Description of assertion rule' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssertionDto.prototype, "description", void 0);
class CreateTestTemplateDto {
}
exports.CreateTestTemplateDto = CreateTestTemplateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Test template name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique template code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestTemplateDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Detailed description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestTemplateDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target device SKU' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestTemplateDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Firmware version' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTestTemplateDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Execution mode', enum: ['FLOW', 'SCRIPT', 'HYBRID'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['FLOW', 'SCRIPT', 'HYBRID']),
    __metadata("design:type", String)
], CreateTestTemplateDto.prototype, "executionMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Visual Flow DAG configuration (Node-RED style)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTestTemplateDto.prototype, "flowConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'JavaScript verification script' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTestTemplateDto.prototype, "customScript", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Timeout in seconds' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestTemplateDto.prototype, "timeoutSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Minimum packets required to evaluate' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTestTemplateDto.prototype, "minPacketsRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Active status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTestTemplateDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateTestTemplateDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CreateAssertionDto], description: 'List of test assertions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateAssertionDto),
    __metadata("design:type", Array)
], CreateTestTemplateDto.prototype, "assertions", void 0);
class UpdateTestTemplateDto {
}
exports.UpdateTestTemplateDto = UpdateTestTemplateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['FLOW', 'SCRIPT', 'HYBRID']),
    __metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "executionMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateTestTemplateDto.prototype, "flowConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTestTemplateDto.prototype, "customScript", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTestTemplateDto.prototype, "timeoutSeconds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateTestTemplateDto.prototype, "minPacketsRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTestTemplateDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateTestTemplateDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CreateAssertionDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateAssertionDto),
    __metadata("design:type", Array)
], UpdateTestTemplateDto.prototype, "assertions", void 0);
class DryRunTestDto {
}
exports.DryRunTestDto = DryRunTestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template code or ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DryRunTestDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Execution mode', enum: ['FLOW', 'SCRIPT', 'HYBRID'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['FLOW', 'SCRIPT', 'HYBRID']),
    __metadata("design:type", String)
], DryRunTestDto.prototype, "executionMode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CreateAssertionDto], description: 'List of assertions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], DryRunTestDto.prototype, "assertions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'JavaScript verification script' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DryRunTestDto.prototype, "customScript", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mock telemetry packet' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DryRunTestDto.prototype, "mockPacket", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Visual Flow DAG configuration (nodes & edges/wires)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DryRunTestDto.prototype, "flowConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test execution context' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DryRunTestDto.prototype, "context", void 0);
class ValidateFlowDto {
}
exports.ValidateFlowDto = ValidateFlowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Visual Flow graph configuration to validate' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ValidateFlowDto.prototype, "flowConfig", void 0);
class ExecuteFlowDto {
}
exports.ExecuteFlowDto = ExecuteFlowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Visual Flow graph configuration to execute' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ExecuteFlowDto.prototype, "flowConfig", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mock telemetry packet' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ExecuteFlowDto.prototype, "mockPacket", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test execution context (buffer, goldenUnit, referenceDevices...)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ExecuteFlowDto.prototype, "context", void 0);
class ExtractDecoderFieldsDto {
}
exports.ExtractDecoderFieldsDto = ExtractDecoderFieldsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Raw JavaScript decoder code (decodeUplink or Decoder)' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExtractDecoderFieldsDto.prototype, "decoderCode", void 0);
//# sourceMappingURL=test-builder.dto.js.map