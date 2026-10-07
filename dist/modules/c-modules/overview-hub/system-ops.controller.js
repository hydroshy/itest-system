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
exports.SystemOpsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const system_ops_service_1 = require("./system-ops.service");
let SystemOpsController = class SystemOpsController {
    constructor(opsService) {
        this.opsService = opsService;
    }
    async getVersion() {
        return this.opsService.getSystemVersion();
    }
    async restartServer(req) {
        const user = req.user;
        const isSuperAdmin = user?.userType === 'ADMIN' ||
            user?.username === 'admin' ||
            (user?.roles &&
                user.roles.some((r) => {
                    const code = (typeof r === 'string' ? r : (r.code || r.name || '')).toUpperCase();
                    return code === 'SUPER_ADMIN' || code === 'SUPER ADMINISTRATOR' || code === 'ADMIN';
                }));
        if (!isSuperAdmin) {
            throw new common_1.ForbiddenException('Only Super Administrators are authorized to restart the platform server container.');
        }
        return this.opsService.restartServer();
    }
    async getLogs(tail) {
        const count = parseInt(tail || '50', 10);
        return this.opsService.getContainerLogs(count);
    }
};
exports.SystemOpsController = SystemOpsController;
__decorate([
    (0, common_1.Get)('version'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live Git commit metadata, build status, and Ops Agent status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemOpsController.prototype, "getVersion", null);
__decorate([
    (0, common_1.Post)('restart'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Request Ops Agent to restart NestJS server container' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemOpsController.prototype, "restartServer", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent Docker container output stream logs' }),
    __param(0, (0, common_1.Query)('tail')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SystemOpsController.prototype, "getLogs", null);
exports.SystemOpsController = SystemOpsController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: System Ops & Lifecycle'),
    (0, common_1.Controller)('api/system'),
    __metadata("design:paramtypes", [system_ops_service_1.SystemOpsService])
], SystemOpsController);
//# sourceMappingURL=system-ops.controller.js.map