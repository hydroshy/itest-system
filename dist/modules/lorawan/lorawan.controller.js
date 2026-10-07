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
exports.LorawanController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const lorawan_service_1 = require("./lorawan.service");
const lorawan_dto_1 = require("./dto/lorawan.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let LorawanController = class LorawanController {
    constructor(lorawanService) {
        this.lorawanService = lorawanService;
    }
    async registerDevice(body, user) {
        return await this.lorawanService.registerDevice(body, user);
    }
    async registerGateway(body) {
        return await this.lorawanService.registerGateway(body);
    }
    async updatePayloadFormatter(devEUI, script) {
        return await this.lorawanService.updatePayloadFormatter(devEUI, script);
    }
    async handleUplink(body) {
        return await this.lorawanService.handleUplink(body.devEUI, body.payloadHex, body.fPort, body.fCnt);
    }
    async handleChirpstackWebhook(body) {
        return await this.lorawanService.handleChirpstackWebhook(body);
    }
    async handleThingparkWebhook(body) {
        return await this.lorawanService.handleThingparkWebhook(body);
    }
    testPayloadFormatter(body) {
        return this.lorawanService.testPayloadFormatter(body.script, body.bytesHex, body.fPort);
    }
    async listDevices(user) {
        return await this.lorawanService.listDevices(user);
    }
    async findOneDevice(devEUI, user) {
        return await this.lorawanService.findOneDevice(devEUI, user);
    }
    async updateDevice(devEUI, body, user) {
        return await this.lorawanService.updateDevice(devEUI, body, user);
    }
    async deleteDevice(devEUI, user) {
        return await this.lorawanService.deleteDevice(devEUI, user);
    }
    async syncDevice(devEUI, user) {
        return await this.lorawanService.syncDeviceToNetworkServer(devEUI, user);
    }
    async checkDeviceHealth(devEUI, user) {
        return await this.lorawanService.checkDeviceHealth(devEUI, user);
    }
    async listGateways() {
        return await this.lorawanService.listGateways();
    }
    async getTelemetry(devEUI, devEUIs, from, to, order, limit) {
        const parsedLimit = limit !== undefined ? Number(limit) : (devEUI || devEUIs ? 0 : 100);
        const devEUIList = devEUIs
            ? devEUIs
                .split(',')
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean)
            : undefined;
        return await this.lorawanService.getTelemetry(devEUI, parsedLimit, {
            devEUIs: devEUIList,
            from,
            to,
            order,
        });
    }
    async getDeviceTelemetryFields(devEUI) {
        return await this.lorawanService.getDeviceTelemetryFields(devEUI);
    }
};
exports.LorawanController = LorawanController;
__decorate([
    (0, common_1.Post)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:create'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng ký thiết bị LoRaWAN mới (DevEUI, OTAA/ABP, Network Server)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lorawan_dto_1.RegisterDeviceDto, Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "registerDevice", null);
__decorate([
    (0, common_1.Post)('gateways'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:gateway:manage'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đăng ký Gateway LoRaWAN mới' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lorawan_dto_1.RegisterGatewayDto]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "registerGateway", null);
__decorate([
    (0, common_1.Put)('devices/:devEUI/payload-formatter'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật script JS Payload Formatter cho thiết bị' }),
    __param(0, (0, common_1.Param)('devEUI')),
    __param(1, (0, common_1.Body)('script')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "updatePayloadFormatter", null);
__decorate([
    (0, common_1.Post)('uplink'),
    (0, swagger_1.ApiOperation)({ summary: 'Generic Webhook nhận gói tin thô Uplink Hex & tự giải mã (Datacake / TTN style)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lorawan_dto_1.UplinkPayloadDto]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "handleUplink", null);
__decorate([
    (0, common_1.Post)('webhook/chirpstack'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook nhận uplink từ ChirpStack v3/v4 và chuyển vào database' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "handleChirpstackWebhook", null);
__decorate([
    (0, common_1.Post)('webhook/thingpark'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook nhận uplink từ ThingPark Wireless và chuyển vào database' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "handleThingparkWebhook", null);
__decorate([
    (0, common_1.Post)('payload-formatter/test'),
    (0, swagger_1.ApiOperation)({ summary: 'Kiểm thử trực tiếp JavaScript Payload Formatter trong JS Sandbox (Node vm)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [lorawan_dto_1.TestPayloadFormatterDto]),
    __metadata("design:returntype", void 0)
], LorawanController.prototype, "testPayloadFormatter", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:read'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Danh sách các thiết bị LoRaWAN' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "listDevices", null);
__decorate([
    (0, common_1.Get)('devices/:devEUI'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:read'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết một thiết bị LoRaWAN theo DevEUI' }),
    __param(0, (0, common_1.Param)('devEUI')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "findOneDevice", null);
__decorate([
    (0, common_1.Put)('devices/:devEUI'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật cấu hình thiết bị LoRaWAN' }),
    __param(0, (0, common_1.Param)('devEUI')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "updateDevice", null);
__decorate([
    (0, common_1.Delete)('devices/:devEUI'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:delete'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa thiết bị LoRaWAN khỏi hệ thống và Network Server' }),
    __param(0, (0, common_1.Param)('devEUI')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "deleteDevice", null);
__decorate([
    (0, common_1.Post)('devices/:devEUI/sync'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Đồng bộ/Provisioning lại thiết bị lên Network Server (ThingPark / ChirpStack)' }),
    __param(0, (0, common_1.Param)('devEUI')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "syncDevice", null);
__decorate([
    (0, common_1.Post)('devices/:devEUI/health'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:read'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Kiểm tra trạng thái trực tuyến / sức khỏe thiết bị từ Network Server API' }),
    __param(0, (0, common_1.Param)('devEUI')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "checkDeviceHealth", null);
__decorate([
    (0, common_1.Get)('gateways'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:gateway:read'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Danh sách các Gateway LoRaWAN' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "listGateways", null);
__decorate([
    (0, common_1.Get)('telemetry'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:telemetry:read'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Danh sách dữ liệu Telemetry nhận từ Webhook' }),
    (0, swagger_1.ApiQuery)({ name: 'devEUI', required: false, description: 'Lọc theo 1 DevEUI' }),
    (0, swagger_1.ApiQuery)({ name: 'devEUIs', required: false, description: 'Lọc theo nhiều DevEUI (phân cách bằng dấu phẩy)' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false, description: 'Từ mốc thời gian ISO' }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'Đến mốc thời gian ISO' }),
    (0, swagger_1.ApiQuery)({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Sắp xếp thời gian' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Số bản ghi tối đa (0 để lấy toàn bộ)' }),
    __param(0, (0, common_1.Query)('devEUI')),
    __param(1, (0, common_1.Query)('devEUIs')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('order')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Number]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "getTelemetry", null);
__decorate([
    (0, common_1.Get)('devices/:devEUI/telemetry-fields'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:telemetry:read'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Tự nhận diện danh sách các trường Telemetry / Decoded Tags từ payload gần nhất' }),
    __param(0, (0, common_1.Param)('devEUI')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LorawanController.prototype, "getDeviceTelemetryFields", null);
exports.LorawanController = LorawanController = __decorate([
    (0, swagger_1.ApiTags)('LoRaWAN & Webhook Ingestion'),
    (0, common_1.Controller)(['lorawan', 'api/lorawan']),
    __metadata("design:paramtypes", [lorawan_service_1.LorawanService])
], LorawanController);
//# sourceMappingURL=lorawan.controller.js.map