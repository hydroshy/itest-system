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
exports.NetworkServersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const network_servers_service_1 = require("./network-servers.service");
const network_server_dto_1 = require("./dto/network-server.dto");
const downlink_dto_1 = require("./dto/downlink.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let NetworkServersController = class NetworkServersController {
    constructor(networkServersService) {
        this.networkServersService = networkServersService;
    }
    async findAll() {
        return await this.networkServersService.findAll();
    }
    async getDownlinkHistory(devEUI, limit) {
        return await this.networkServersService.getDownlinkHistory({ devEUI, limit });
    }
    async getDeviceQueue(devEUI, networkServerId) {
        return await this.networkServersService.getDeviceQueue({ devEUI, networkServerId });
    }
    async sendDownlink(dto, req) {
        const author = req.user?.username || req.user?.fullName || 'Operator';
        return await this.networkServersService.sendDownlink({
            ...dto,
            author,
        });
    }
    async flushQueue(dto, req) {
        const author = req.user?.username || req.user?.fullName || 'Operator';
        return await this.networkServersService.flushDeviceQueue({
            devEUI: dto.devEUI,
            networkServerId: dto.networkServerId,
            author,
        });
    }
    async findOne(id) {
        return await this.networkServersService.findOne(id);
    }
    async create(dto) {
        return await this.networkServersService.create(dto);
    }
    async update(id, dto) {
        return await this.networkServersService.update(id, dto);
    }
    async remove(id) {
        return await this.networkServersService.remove(id);
    }
    async testConnection(id) {
        return await this.networkServersService.testConnection(id);
    }
    async addRegionProfile(id, regionDto) {
        return await this.networkServersService.addOrUpdateRegionProfile(id, regionDto);
    }
    async deleteRegionProfile(id, regionId) {
        return await this.networkServersService.deleteRegionProfile(id, regionId);
    }
    async getLinkedDevices(id) {
        return await this.networkServersService.getLinkedDevices(id);
    }
    async getLinkedGateways(id) {
        return await this.networkServersService.getLinkedGateways(id);
    }
};
exports.NetworkServersController = NetworkServersController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('network_server:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Danh sách tất cả Network Servers (ThingPark, ChirpStack)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('downlinks/history'),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve downlink execution history and audit logs' }),
    (0, swagger_1.ApiQuery)({ name: 'devEUI', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('devEUI')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "getDownlinkHistory", null);
__decorate([
    (0, common_1.Get)('queue'),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current pending downlink queue for device' }),
    (0, swagger_1.ApiQuery)({ name: 'devEUI', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'networkServerId', required: false, type: String }),
    __param(0, (0, common_1.Query)('devEUI')),
    __param(1, (0, common_1.Query)('networkServerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "getDeviceQueue", null);
__decorate([
    (0, common_1.Post)('downlink'),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Dispatch downlink Hex command to LoRaWAN device via selected Network Server' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [downlink_dto_1.SendDownlinkDto, Object]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "sendDownlink", null);
__decorate([
    (0, common_1.Post)('flush-queue'),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:device:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Flush device downlink queue on Network Server' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [downlink_dto_1.FlushQueueDto, Object]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "flushQueue", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('network_server:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết Network Server theo ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('network_server:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Tạo mới Network Server (ThingPark, ChirpStack) cùng RouteRef và Region Profiles' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [network_server_dto_1.CreateNetworkServerDto]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('network_server:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật thông tin cấu hình Network Server' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, network_server_dto_1.UpdateNetworkServerDto]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('network_server:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa Network Server' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, permissions_decorator_1.RequirePermissions)('network_server:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Kiểm tra kết nối và tính hợp lệ của cấu hình Network Server' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)(':id/regions'),
    (0, permissions_decorator_1.RequirePermissions)('network_server:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Thêm hoặc cập nhật Region Profile cho Network Server' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, network_server_dto_1.RegionProfileDto]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "addRegionProfile", null);
__decorate([
    (0, common_1.Delete)(':id/regions/:regionId'),
    (0, permissions_decorator_1.RequirePermissions)('network_server:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa Region Profile khỏi Network Server' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('regionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "deleteRegionProfile", null);
__decorate([
    (0, common_1.Get)(':id/devices'),
    (0, permissions_decorator_1.RequirePermissions)('network_server:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Danh sách các thiết bị thuộc Network Server này' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "getLinkedDevices", null);
__decorate([
    (0, common_1.Get)(':id/gateways'),
    (0, permissions_decorator_1.RequirePermissions)('network_server:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Danh sách các gateway thuộc Network Server này' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NetworkServersController.prototype, "getLinkedGateways", null);
exports.NetworkServersController = NetworkServersController = __decorate([
    (0, swagger_1.ApiTags)('Network Servers Management'),
    (0, common_1.Controller)('api/network-servers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [network_servers_service_1.NetworkServersService])
], NetworkServersController);
//# sourceMappingURL=network-servers.controller.js.map