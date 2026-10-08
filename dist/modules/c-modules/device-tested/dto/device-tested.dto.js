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
exports.QueryDeviceTestedDto = exports.ImportCsvDto = exports.UpdateAppKeyDto = exports.CreateDeviceTestedDto = exports.VerifyDeviceTestedDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class VerifyDeviceTestedDto {
}
exports.VerifyDeviceTestedDto = VerifyDeviceTestedDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Serial Number to verify', example: 'LRRS26000599' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "serial_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device Key / DevEUI (Hex 16 chars)', example: '373137315832700E' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "device_key", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Item Code to verify against', example: 'WSLRW-IEC485-04-DC-RT' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "item_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Firmware Version to verify against', example: '3F0819' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "fw_ver", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hardware Version to verify against', example: '1H' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "hw_ver", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Selected Sales Order to verify against', example: 'SO/2026/01462' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], VerifyDeviceTestedDto.prototype, "so", void 0);
class CreateDeviceTestedDto {
}
exports.CreateDeviceTestedDto = CreateDeviceTestedDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sales Order Code', example: 'SO/2026/01462' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "so", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sales Order Number', example: 'SO/2026/01462' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "so_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Item Code', example: 'WSLRW-IEC485-04-DC-RT' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "item_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Serial Number', example: 'LRRS26000599' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "serial_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device EUI (Hex 16 chars)', example: '373137315832700E' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "dev_eui", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device Key (DevEUI)', example: '373137315832700E' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "device_key", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Product SKU', example: 'WSLRW-IEC485' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Firmware Version', example: '3F0819' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "firmware_version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Firmware Version (Standard)', example: '3F0819' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "fw_ver", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hardware Version', example: '1H' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "hw_ver", void 0);
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
    (0, swagger_1.ApiPropertyOptional)({ description: 'QA Testing Result', default: 'PASS' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "result", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'QA Automated Check Status', default: 'PASS' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "auto_check", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'QA Test ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "test_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Label Check Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "label_check_code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Start Time' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "start_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Duration Time' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "duration_time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Finish Epoch Timestamp' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateDeviceTestedDto.prototype, "time_finish", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Testing Station ID', default: 'STATION-01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "station_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Testing Station' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "test_station", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Operator username', default: 'admin' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "operator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Person' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "test_person", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Result ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "test_result_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LoRaWAN AppKey if configured' }),
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
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Note' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDeviceTestedDto.prototype, "test_note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata JSON' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateDeviceTestedDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Raw 63 CSV fields JSON' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateDeviceTestedDto.prototype, "csv_raw_data", void 0);
class UpdateAppKeyDto {
}
exports.UpdateAppKeyDto = UpdateAppKeyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '128-bit LoRaWAN AppKey (32 Hex characters)', example: '2B7E151628AED2A6ABF7158809CF4F3C' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateAppKeyDto.prototype, "app_key", void 0);
class ImportCsvDto {
}
exports.ImportCsvDto = ImportCsvDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Raw CSV text' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ImportCsvDto.prototype, "csv_content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parsed CSV row array' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ImportCsvDto.prototype, "records", void 0);
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
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by SO Number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "so_number", void 0);
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
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Device Key' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "device_key", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Status / Result' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by Auto Check status' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueryDeviceTestedDto.prototype, "auto_check", void 0);
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