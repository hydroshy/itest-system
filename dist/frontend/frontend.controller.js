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
exports.FrontendController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_1 = require("@nestjs/jwt");
const login_page_1 = require("./pages/login.page");
const control_panel_page_1 = require("./pages/control-panel.page");
let FrontendController = class FrontendController {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    setNoCacheHeaders(res) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
    clearAllCookies(res) {
        const cookieNames = ['access_token', 'lorawan_token', 'session_id', 'connect.sid'];
        cookieNames.forEach((name) => {
            res.clearCookie(name, { path: '/', sameSite: 'lax', httpOnly: false });
            res.clearCookie(name, { path: '/', sameSite: 'lax', httpOnly: true });
            res.clearCookie(name, { path: '/' });
            res.clearCookie(name);
        });
    }
    isValidToken(token) {
        if (!token || token === 'undefined' || token === 'null' || token.length < 20) {
            return false;
        }
        try {
            this.jwtService.verify(token);
            return true;
        }
        catch {
            return false;
        }
    }
    root(req, res) {
        this.setNoCacheHeaders(res);
        const isLogout = req.query?.logout === '1' || req.query?.logout === 'true' || req.query?.clear === '1';
        if (isLogout) {
            this.clearAllCookies(res);
            return res.redirect('/login?cleared=1');
        }
        const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
        if (this.isValidToken(token)) {
            return res.redirect('/dashboard');
        }
        return res.redirect('/login');
    }
    getLoginPage(req, res) {
        this.setNoCacheHeaders(res);
        const isClearing = req.query?.logout === '1' ||
            req.query?.logout === 'true' ||
            req.query?.clear === '1' ||
            req.query?.cleared === '1' ||
            req.query?.reset === '1';
        if (isClearing) {
            this.clearAllCookies(res);
        }
        else {
            const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
            if (this.isValidToken(token)) {
                return res.redirect('/dashboard');
            }
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(login_page_1.LOGIN_HTML);
    }
    getDashboardPage(req, res) {
        this.setNoCacheHeaders(res);
        const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
        if (!this.isValidToken(token)) {
            this.clearAllCookies(res);
            return res.redirect('/login');
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(control_panel_page_1.CONTROL_PANEL_HTML);
    }
    getControlPanelPage(req, res) {
        this.setNoCacheHeaders(res);
        const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
        if (!this.isValidToken(token)) {
            this.clearAllCookies(res);
            return res.redirect('/login');
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(control_panel_page_1.CONTROL_PANEL_HTML);
    }
    resetSessionGet(res) {
        this.setNoCacheHeaders(res);
        this.clearAllCookies(res);
        return res.redirect('/login?cleared=1');
    }
    resetSessionPost(res) {
        this.setNoCacheHeaders(res);
        this.clearAllCookies(res);
        return res.json({ success: true, message: 'Session cleared successfully' });
    }
    clearSession(res) {
        this.setNoCacheHeaders(res);
        this.clearAllCookies(res);
        return res.redirect('/login?cleared=1');
    }
    getManagerRedirect(req, res) {
        const host = req.hostname || 'localhost';
        return res.redirect(`http://${host}:3099/manager`);
    }
    getOpsRedirect(req, res) {
        const host = req.hostname || 'localhost';
        return res.redirect(`http://${host}:3099/manager`);
    }
};
exports.FrontendController = FrontendController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "root", null);
__decorate([
    (0, common_1.Get)('login'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "getLoginPage", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "getDashboardPage", null);
__decorate([
    (0, common_1.Get)('control-panel'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "getControlPanelPage", null);
__decorate([
    (0, common_1.Get)('reset-session'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "resetSessionGet", null);
__decorate([
    (0, common_1.Post)('reset-session'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "resetSessionPost", null);
__decorate([
    (0, common_1.Get)('auth/clear-session'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "clearSession", null);
__decorate([
    (0, common_1.Get)('manager'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "getManagerRedirect", null);
__decorate([
    (0, common_1.Get)('ops'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FrontendController.prototype, "getOpsRedirect", null);
exports.FrontendController = FrontendController = __decorate([
    (0, swagger_1.ApiTags)('Frontend Presentation Layer'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], FrontendController);
//# sourceMappingURL=frontend.controller.js.map