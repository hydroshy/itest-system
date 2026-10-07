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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const express_1 = require("express");
const common_2 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const init_superadmin_dto_1 = require("./dto/init-superadmin.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto, res) {
        const result = await this.authService.login(loginDto);
        res.cookie('access_token', result.access_token, {
            path: '/',
            httpOnly: false,
            sameSite: 'lax',
            maxAge: 30 * 24 * 3600 * 1000,
        });
        return result;
    }
    async logout(req, res) {
        const cookieNames = ['access_token', 'lorawan_token', 'session_id', 'connect.sid'];
        cookieNames.forEach((name) => {
            res.clearCookie(name, { path: '/', sameSite: 'lax', httpOnly: false });
            res.clearCookie(name, { path: '/', sameSite: 'lax', httpOnly: true });
            res.clearCookie(name, { path: '/' });
            res.clearCookie(name);
        });
        if (req.method === 'GET') {
            return res.redirect('/login?logout=1');
        }
        return res.json({ success: true, message: 'Logged out successfully' });
    }
    async getProfile(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            userType: user.userType,
            roles: user.roles,
        };
    }
    async initSuperAdmin(body) {
        try {
            return await this.authService.registerInitialAdmin(body?.username || 'admin', body?.email || 'admin@daviteq.com', body?.pass || 'Dvt@123');
        }
        catch (err) {
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                message: `Lỗi khởi tạo Super Admin: ${err.message}`,
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login and establish session (Sets auth cookie & returns JWT)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('logout'),
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and clear session cookie' }),
    __param(0, (0, common_2.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _b : Object, typeof (_c = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('session'),
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user session and permissions' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('init-superadmin'),
    (0, swagger_1.ApiOperation)({ summary: 'Khởi tạo hoặc cập nhật tài khoản Super Admin (Mặc định: admin / Dvt@123)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [init_superadmin_dto_1.InitSuperAdminDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "initSuperAdmin", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication & Control Panel Access'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map