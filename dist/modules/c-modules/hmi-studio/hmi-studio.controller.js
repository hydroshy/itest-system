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
exports.HmiStudioController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const hmi_studio_service_1 = require("./hmi-studio.service");
const hmi_screen_dto_1 = require("./dto/hmi-screen.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../../common/guards/permissions.guard");
let HmiStudioController = class HmiStudioController {
    constructor(hmiStudioService) {
        this.hmiStudioService = hmiStudioService;
    }
    async findAll() {
        return await this.hmiStudioService.findAll();
    }
    async findPublished(req) {
        const role = req.user?.roles?.[0]?.code || req.user?.userType || 'VIEWER';
        return await this.hmiStudioService.findPublished(role);
    }
    async findOne(id) {
        return await this.hmiStudioService.findOne(id);
    }
    async create(dto, req) {
        const author = req.user?.username || req.user?.fullName || 'Admin';
        return await this.hmiStudioService.create(dto, author);
    }
    async update(id, dto, req) {
        const author = req.user?.username || req.user?.fullName || 'Admin';
        return await this.hmiStudioService.update(id, dto, author);
    }
    async delete(id) {
        return await this.hmiStudioService.delete(id);
    }
    async downlink(body, req) {
        return await this.hmiStudioService.executeDownlink(body, req.user);
    }
    async publish(id, dto) {
        return await this.hmiStudioService.publish(id, dto);
    }
    async clone(id, dto, req) {
        const author = req.user?.username || req.user?.fullName || 'Admin';
        return await this.hmiStudioService.clone(id, dto, author);
    }
    async getTelemetryTrend(devEUIs, from, to, limit) {
        const devEUIList = devEUIs
            ? devEUIs
                .split(',')
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean)
            : undefined;
        return await this.hmiStudioService.getTelemetryTrend({
            devEUIs: devEUIList,
            from,
            to,
            limit: limit !== undefined ? Number(limit) : 500,
        });
    }
    async getDeviceTelemetryFields(devEUI) {
        return await this.hmiStudioService.getDeviceTelemetryFields(devEUI);
    }
};
exports.HmiStudioController = HmiStudioController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all HMI screens (Admin Designer view)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('published'),
    (0, swagger_1.ApiOperation)({ summary: 'Get published screens accessible to current user role' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "findPublished", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get HMI screen details by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new HMI screen' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [hmi_screen_dto_1.CreateHmiScreenDto, Object]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update HMI screen layout, canvas, and widgets' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hmi_screen_dto_1.UpdateHmiScreenDto, Object]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete HMI screen' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('downlink'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger LoRaWAN downlink control action from HMI widget' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "downlink", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish or unpublish HMI screen' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hmi_screen_dto_1.PublishHmiScreenDto]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/clone'),
    (0, swagger_1.ApiOperation)({ summary: 'Clone/duplicate an existing HMI screen' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, hmi_screen_dto_1.CloneHmiScreenDto, Object]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "clone", null);
__decorate([
    (0, common_1.Get)('telemetry/trend'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chuỗi dữ liệu thời gian thực (time-series) cho Trend Widgets' }),
    (0, swagger_1.ApiQuery)({ name: 'devEUIs', required: false, description: 'Danh sách DevEUI (phân cách bằng dấu phẩy)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Từ mốc thời gian ISO' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Đến mốc thời gian ISO' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Số điểm tối đa (mặc định 500)' }),
    __param(0, (0, common_1.Query)('devEUIs')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "getTelemetryTrend", null);
__decorate([
    (0, common_1.Get)('devices/:devEUI/telemetry-fields'),
    (0, swagger_1.ApiOperation)({ summary: 'Auto-detect decoded telemetry tags & RF metrics for a device' }),
    __param(0, (0, common_1.Param)('devEUI')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HmiStudioController.prototype, "getDeviceTelemetryFields", null);
exports.HmiStudioController = HmiStudioController = __decorate([
    (0, swagger_1.ApiTags)('HMI SCADA Studio (C-Module)'),
    (0, common_1.Controller)('api/hmi/screens'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [hmi_studio_service_1.HmiStudioService])
], HmiStudioController);
//# sourceMappingURL=hmi-studio.controller.js.map