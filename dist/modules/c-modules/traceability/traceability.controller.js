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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const express_1 = require("express");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
const traceability_service_1 = require("./traceability.service");
let TraceabilityController = class TraceabilityController {
    constructor(traceabilityService) {
        this.traceabilityService = traceabilityService;
    }
    async findTestResults(query) {
        return await this.traceabilityService.findTestResults(query);
    }
    async getSoCatalog(query) {
        return await this.traceabilityService.getSoCatalog(query);
    }
    async getTestResultById(id) {
        return await this.traceabilityService.getTestResultById(id);
    }
    async getDeviceTestDetails(query) {
        const key = query.serialNumber ||
            query.serial_number ||
            query.deviceKey ||
            query.device_key ||
            query.testId ||
            query.test_id ||
            '';
        return await this.traceabilityService.getDeviceTestDetails(key, query);
    }
    async exportCsv(query, res) {
        const csvContent = await this.traceabilityService.exportCsv(query);
        const fileName = `test-results-${new Date().toISOString().substring(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.status(200).send(csvContent);
    }
    async recordTestResult(dto) {
        return await this.traceabilityService.recordTestResult(dto);
    }
    async seedRepresentativeBaselineData() {
        await this.traceabilityService.seedRepresentativeBaselineData();
        return { success: true, message: 'Representative baseline data seeded successfully.' };
    }
    decodeConfig(body) {
        return this.traceabilityService.decodeFinalConfig(body.configurationString, body.parametersNameString, body.parametersType, body.parametersLengthString);
    }
};
exports.TraceabilityController = TraceabilityController;
__decorate([
    (0, common_1.Get)(['results', 'test-results']),
    (0, permissions_decorator_1.RequirePermissions)('traceability:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Flow 0: Query test results with multi-criteria search (SO, SN, SKU, Item Code, Time)' }),
    (0, swagger_1.ApiQuery)({ name: 'soNumber', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'serialNumber', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sku', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'itemCode', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'deviceKey', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'result', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startTime', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endTime', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TraceabilityController.prototype, "findTestResults", null);
__decorate([
    (0, common_1.Get)(['so-catalog', 'so-list']),
    (0, permissions_decorator_1.RequirePermissions)('traceability:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Flow 0: Query aggregated SO-level catalog for Tested Devices Catalog' }),
    (0, swagger_1.ApiQuery)({ name: 'soNumber', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'serialNumber', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sku', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'itemCode', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TraceabilityController.prototype, "getSoCatalog", null);
__decorate([
    (0, common_1.Get)(['results/:id', 'test-results/:id']),
    (0, permissions_decorator_1.RequirePermissions)('traceability:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single test result record by ID or Serial Number' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TraceabilityController.prototype, "getTestResultById", null);
__decorate([
    (0, common_1.Get)('device-details'),
    (0, permissions_decorator_1.RequirePermissions)('traceability:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Flow 1: Query detailed device test telemetry, parameter statistics (Min/Max/Avg) and memory map' }),
    (0, swagger_1.ApiQuery)({ name: 'serialNumber', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'deviceKey', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'testId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startTime', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endTime', required: false }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TraceabilityController.prototype, "getDeviceTestDetails", null);
__decorate([
    (0, common_1.Get)(['export', 'export-csv']),
    (0, permissions_decorator_1.RequirePermissions)('traceability:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Export test results to CSV file' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], TraceabilityController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Post)(['results', 'test-results']),
    (0, permissions_decorator_1.RequirePermissions)('traceability:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Record or sync a new device test result' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TraceabilityController.prototype, "recordTestResult", null);
__decorate([
    (0, common_1.Post)(['seed', 'seed-sample']),
    (0, permissions_decorator_1.RequirePermissions)('traceability:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Seed representative baseline data if needed' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TraceabilityController.prototype, "seedRepresentativeBaselineData", null);
__decorate([
    (0, common_1.Post)('decode-config'),
    (0, permissions_decorator_1.RequirePermissions)('traceability:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Helper endpoint to decode Modbus/LoRa register configuration string into human-readable map' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TraceabilityController.prototype, "decodeConfig", null);
exports.TraceabilityController = TraceabilityController = __decorate([
    (0, swagger_1.ApiTags)('Traceability & Quality Inspection (T-Module)'),
    (0, common_1.Controller)(['api/traceability', 'api/c-modules/traceability', 'api/t-modules/traceability']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [traceability_service_1.TraceabilityService])
], TraceabilityController);
//# sourceMappingURL=traceability.controller.js.map