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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestBuilderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
const test_builder_service_1 = require("./test-builder.service");
const test_builder_dto_1 = require("./dto/test-builder.dto");
let TestBuilderController = class TestBuilderController {
    constructor(testBuilderService) {
        this.testBuilderService = testBuilderService;
    }
    async findAll() {
        return await this.testBuilderService.findAll();
    }
    async findOne(id) {
        return await this.testBuilderService.findOne(id);
    }
    async create(dto, user) {
        try {
            const author = user?.username || user?.fullName || 'admin';
            return await this.testBuilderService.create(dto, author);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to create test template', err.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async sanitizeTemplates() {
        try {
            return await this.testBuilderService.sanitizeExistingTemplates();
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to sanitize test templates', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async update(id, dto, user) {
        try {
            const author = user?.username || user?.fullName || 'admin';
            return await this.testBuilderService.update(id, dto, author);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to update test template', err.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async remove(id) {
        return await this.testBuilderService.remove(id);
    }
    async getAvailableFields(sku, firmwareVersion) {
        return await this.testBuilderService.getAvailableFields(sku, firmwareVersion);
    }
    async extractDecoderFields(dto) {
        try {
            return this.testBuilderService.extractFieldsFromRawCode(dto.decoderCode);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Failed to extract decoder fields', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async dryRun(dto) {
        try {
            return await this.testBuilderService.dryRun(dto);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Dry-run execution error', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async validateFlow(dto) {
        try {
            return this.testBuilderService.validateFlowConfig(dto.flowConfig);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Flow configuration validation error', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async executeFlow(dto) {
        try {
            return await this.testBuilderService.executeFlowGraph(dto.flowConfig, dto.mockPacket || {}, dto.context || {});
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Flow graph execution error', common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.TestBuilderController = TestBuilderController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all test templates with assertions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get test template details with assertions' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new test template (Visual Flow / Custom Script)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_builder_dto_1.CreateTestTemplateDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('templates/sanitize'),
    (0, swagger_1.ApiOperation)({ summary: 'Sanitize and migrate existing test templates and assertions to English' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "sanitizeTemplates", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update test template' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, test_builder_dto_1.UpdateTestTemplateDto,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete test template' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('available-fields'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available telemetry fields from SKU and firmware version' }),
    (0, swagger_1.ApiQuery)({ name: 'sku', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'firmwareVersion', required: false }),
    __param(0, (0, common_1.Query)('sku')),
    __param(1, (0, common_1.Query)('firmwareVersion')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "getAvailableFields", null);
__decorate([
    (0, common_1.Post)('extract-decoder-fields'),
    (0, swagger_1.ApiOperation)({ summary: 'Extract telemetry fields directly from raw JavaScript decoder code (AST + Dynamic VM Sandbox)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_builder_dto_1.ExtractDecoderFieldsDto]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "extractDecoderFields", null);
__decorate([
    (0, common_1.Post)('dry-run'),
    (0, swagger_1.ApiOperation)({ summary: 'Dry-run test template in sandbox with mock packet' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_builder_dto_1.DryRunTestDto]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "dryRun", null);
__decorate([
    (0, common_1.Post)('flow/validate'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate Visual Flow graph configuration (DAG cycle detection, connectivity)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_builder_dto_1.ValidateFlowDto]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "validateFlow", null);
__decorate([
    (0, common_1.Post)('flow/execute'),
    (0, swagger_1.ApiOperation)({ summary: 'Execute Visual Flow graph directly in Graph DAG Engine' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [test_builder_dto_1.ExecuteFlowDto]),
    __metadata("design:returntype", Promise)
], TestBuilderController.prototype, "executeFlow", null);
exports.TestBuilderController = TestBuilderController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: LoRaWAN Test Builder & Automation'),
    (0, common_1.Controller)(['api/test-builder', 'api/c-modules/test-builder']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [test_builder_service_1.TestBuilderService])
], TestBuilderController);
//# sourceMappingURL=test-builder.controller.js.map