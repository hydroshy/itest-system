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
exports.WebhookAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const webhook_admin_service_1 = require("./webhook-admin.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let WebhookAdminController = class WebhookAdminController {
    constructor(webhookAdminService) {
        this.webhookAdminService = webhookAdminService;
    }
    async handleChirpstackWebhook(body) {
        return await this.webhookAdminService.handleChirpstackWebhook(body);
    }
    async handleThingparkWebhook(body) {
        return await this.webhookAdminService.handleThingparkWebhook(body);
    }
    async getLogs(serverType, search, status, limit, offset) {
        return await this.webhookAdminService.getLogs({
            serverType,
            search,
            status,
            limit,
            offset,
        });
    }
    async getStats() {
        return await this.webhookAdminService.getStats();
    }
    async clearLogs(serverType) {
        return await this.webhookAdminService.clearLogs(serverType);
    }
    async setRetention(limit) {
        return await this.webhookAdminService.setRetentionLimit(limit);
    }
    async simulatePacket(body) {
        return await this.webhookAdminService.simulatePacket(body);
    }
};
exports.WebhookAdminController = WebhookAdminController;
__decorate([
    (0, common_1.Post)('chirpstack'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook nhận uplink từ ChirpStack v3/v4 qua Webhook Manager và lưu vào uplink_telemetry' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookAdminController.prototype, "handleChirpstackWebhook", null);
__decorate([
    (0, common_1.Post)('thingpark'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook nhận uplink từ ThingPark Wireless qua Webhook Manager và lưu vào uplink_telemetry' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookAdminController.prototype, "handleThingparkWebhook", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:webhooks:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get filtered webhook packet logs from ChirpStack & ThingPark' }),
    (0, swagger_1.ApiQuery)({ name: 'serverType', required: false, description: 'CHIRPSTACK, THINGPARK, or ALL' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search term for DevEUI or Payload Hex' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'SUCCESS, ERROR, or ALL' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Max records (default 50)' }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, description: 'Offset for pagination' }),
    __param(0, (0, common_1.Query)('serverType')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], WebhookAdminController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:webhooks:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get webhook ingestion statistics and auto-pruning status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WebhookAdminController.prototype, "getStats", null);
__decorate([
    (0, common_1.Delete)('logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:webhooks:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear webhook packet logs (by serverType or ALL)' }),
    (0, swagger_1.ApiQuery)({ name: 'serverType', required: false, description: 'CHIRPSTACK, THINGPARK, or ALL' }),
    __param(0, (0, common_1.Query)('serverType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WebhookAdminController.prototype, "clearLogs", null);
__decorate([
    (0, common_1.Put)('retention'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:webhooks:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Update automated log retention limit per server' }),
    __param(0, (0, common_1.Body)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WebhookAdminController.prototype, "setRetention", null);
__decorate([
    (0, common_1.Post)('simulate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:webhooks:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Simulate an incoming webhook packet for ChirpStack or ThingPark' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhookAdminController.prototype, "simulatePacket", null);
exports.WebhookAdminController = WebhookAdminController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: Webhook Manager'),
    (0, common_1.Controller)('api/webhooks'),
    __metadata("design:paramtypes", [webhook_admin_service_1.WebhookAdminService])
], WebhookAdminController);
//# sourceMappingURL=webhook-admin.controller.js.map