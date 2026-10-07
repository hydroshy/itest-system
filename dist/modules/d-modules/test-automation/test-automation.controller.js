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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAutomationController = void 0;
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
const test_automation_service_1 = require("./test-automation.service");
const create_test_session_dto_1 = require("./dto/create-test-session.dto");
const simulate_packet_dto_1 = require("./dto/simulate-packet.dto");
const query_test_session_dto_1 = require("./dto/query-test-session.dto");
const create_test_evidence_dto_1 = require("./dto/create-test-evidence.dto");
const query_test_evidence_dto_1 = require("./dto/query-test-evidence.dto");
let TestAutomationController = class TestAutomationController {
    constructor(service) {
        this.service = service;
    }
    async getSessions(query) {
        return await this.service.getSessions(query);
    }
    async createSession(dto, user) {
        const operatorId = user?.username || user?.email || 'qa-operator';
        return await this.service.createSession(dto, operatorId);
    }
    async getSessionById(id) {
        return await this.service.getSessionById(id);
    }
    async startSession(id) {
        return await this.service.startSession(id);
    }
    async abortSession(id, reason) {
        return await this.service.abortSession(id, reason);
    }
    async completeSession(id) {
        return await this.service.completeSession(id);
    }
    async getSessionSummary(id) {
        return await this.service.getSessionSummary(id);
    }
    async getDeviceLogs(deviceRunId) {
        return await this.service.getDeviceRunLogs(deviceRunId);
    }
    async retryDevice(deviceRunId) {
        return await this.service.retryDeviceRun(deviceRunId);
    }
    async getDeviceTrace(devEUI) {
        return await this.service.getDeviceTrace(devEUI);
    }
    async getBatchDeviceTrace(devEUIs) {
        return await this.service.getBatchDeviceTrace(devEUIs || []);
    }
    async simulatePacket(dto) {
        return await this.service.processPacket(dto);
    }
    async exportReport(id, format = 'csv', res) {
        const report = await this.service.exportSessionReport(id, format);
        if (format === 'json') {
            return res.json(report);
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
        return res.send(report.content);
    }
    async getEvidences(query) {
        return await this.service.getEvidences(query);
    }
    async createEvidence(dto, user) {
        const operator = user?.username || user?.email || 'qa-operator';
        return await this.service.createEvidence(dto, operator);
    }
    async exportEvidence(query, res) {
        const report = await this.service.exportEvidenceCsv(query);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
        return res.send(report.content);
    }
    async getEvidenceById(id) {
        return await this.service.getEvidenceById(id);
    }
};
exports.TestAutomationController = TestAutomationController;
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'List test sessions with pagination and filters' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_test_session_dto_1.QueryTestSessionDto]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Post)('sessions'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new test session linked to a Sales Order & Item Code',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_test_session_dto_1.CreateTestSessionDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a test session by ID or session code' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "getSessionById", null);
__decorate([
    (0, common_1.Post)('sessions/:id/start'),
    (0, swagger_1.ApiOperation)({
        summary: 'Start an active test session, moving waiting devices to RUNNING',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/abort'),
    (0, swagger_1.ApiOperation)({ summary: 'Abort an ongoing test session' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "abortSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Finalize and complete a test session' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "completeSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id/summary'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get real-time test progress metrics and pass/fail summary',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "getSessionSummary", null);
__decorate([
    (0, common_1.Get)('devices/:deviceRunId/logs'),
    (0, swagger_1.ApiOperation)({
        summary: 'View detailed uplink packets and assertion evaluations for a device',
    }),
    __param(0, (0, common_1.Param)('deviceRunId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "getDeviceLogs", null);
__decorate([
    (0, common_1.Post)('devices/:deviceRunId/retry'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset and retry test execution for a failed device run',
    }),
    __param(0, (0, common_1.Param)('deviceRunId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "retryDevice", null);
__decorate([
    (0, common_1.Get)('devices/:devEUI/trace'),
    (0, swagger_1.ApiOperation)({
        summary: 'Trace real-time online status, RSSI and SNR for a device before test',
    }),
    __param(0, (0, common_1.Param)('devEUI')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "getDeviceTrace", null);
__decorate([
    (0, common_1.Post)('devices/trace-batch'),
    (0, swagger_1.ApiOperation)({
        summary: 'Batch trace real-time online status, RSSI and SNR for devices before test',
    }),
    __param(0, (0, common_1.Body)('devEUIs')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "getBatchDeviceTrace", null);
__decorate([
    (0, common_1.Post)('simulate-packet'),
    (0, swagger_1.ApiOperation)({
        summary: 'Simulate an uplink packet injection from the QA test bench and verify assertions',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [simulate_packet_dto_1.SimulatePacketDto]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "simulatePacket", null);
__decorate([
    (0, common_1.Get)('sessions/:id/export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export factory inspection report as CSV or JSON' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "exportReport", null);
__decorate([
    (0, common_1.Get)('evidence'),
    (0, swagger_1.ApiOperation)({ summary: 'List post-test sensor decoded evidence for audit compliance' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_test_evidence_dto_1.QueryTestEvidenceDto]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "getEvidences", null);
__decorate([
    (0, common_1.Post)('evidence'),
    (0, swagger_1.ApiOperation)({ summary: 'Manually record post-test evidence with decoded sensor fields' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_test_evidence_dto_1.CreateTestEvidenceDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "createEvidence", null);
__decorate([
    (0, common_1.Get)('evidence/export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export post-test sensor evidence to CSV for compliance audit' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_test_evidence_dto_1.QueryTestEvidenceDto, typeof (_b = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "exportEvidence", null);
__decorate([
    (0, common_1.Get)('evidence/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single test evidence record with all decoded sensor fields' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestAutomationController.prototype, "getEvidenceById", null);
exports.TestAutomationController = TestAutomationController = __decorate([
    (0, swagger_1.ApiTags)('D-Module: Product Test Automation Workbench'),
    (0, common_1.Controller)(['api/d-modules/test-run', 'api/d-modules/test-automation']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [test_automation_service_1.TestAutomationService])
], TestAutomationController);
//# sourceMappingURL=test-automation.controller.js.map