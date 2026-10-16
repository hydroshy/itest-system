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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const login_view_1 = require("./views/login.view");
const dashboard_view_1 = require("./views/dashboard.view");
const control_panel_view_1 = require("./views/control-panel.view");
let AppController = class AppController {
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
    root(req, res) {
        this.setNoCacheHeaders(res);
        const isLogout = req.query?.logout === '1' || req.query?.logout === 'true' || req.query?.clear === '1';
        if (isLogout) {
            this.clearAllCookies(res);
            return res.redirect('/login?cleared=1');
        }
        const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
        if (token && token !== 'undefined' && token !== 'null' && token.length > 20) {
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
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(login_view_1.LOGIN_HTML);
    }
    getDashboardPage(req, res) {
        this.setNoCacheHeaders(res);
        const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
        if (!token || token === 'undefined' || token === 'null' || token.length < 20) {
            return res.redirect('/login');
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(dashboard_view_1.DASHBOARD_HTML);
    }
    getControlPanelPage(req, res) {
        this.setNoCacheHeaders(res);
        const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
        if (!token || token === 'undefined' || token === 'null' || token.length < 20) {
            return res.redirect('/login');
        }
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(control_panel_view_1.CONTROL_PANEL_HTML);
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
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "root", null);
__decorate([
    (0, common_1.Get)('login'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getLoginPage", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getDashboardPage", null);
__decorate([
    (0, common_1.Get)('control-panel'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getControlPanelPage", null);
__decorate([
    (0, common_1.Get)('reset-session'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "resetSessionGet", null);
__decorate([
    (0, common_1.Post)('reset-session'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "resetSessionPost", null);
__decorate([
    (0, common_1.Get)('auth/clear-session'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "clearSession", null);
__decorate([
    (0, common_1.Get)('manager'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getManagerRedirect", null);
__decorate([
    (0, common_1.Get)('ops'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getOpsRedirect", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)()
], AppController);
//# sourceMappingURL=app.controller.js.map