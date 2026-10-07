"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SubsystemDebugInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubsystemDebugInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const subsystem_types_1 = require("./subsystem.types");
let SubsystemDebugInterceptor = SubsystemDebugInterceptor_1 = class SubsystemDebugInterceptor {
    constructor() {
        this.logger = new common_1.Logger('SubsystemDispatcher');
    }
    static resolveSubsystem(url) {
        const cleanUrl = url.toLowerCase().split('?')[0];
        if (cleanUrl.includes('/database')) {
            return subsystem_types_1.BackendSubsystem.DATABASE;
        }
        if (cleanUrl.includes('/lorawan') ||
            cleanUrl.includes('/network-servers') ||
            cleanUrl.includes('/webhook')) {
            return subsystem_types_1.BackendSubsystem.LORAWAN;
        }
        if (cleanUrl.includes('/sales-orders') ||
            cleanUrl.includes('/item-codes') ||
            cleanUrl.includes('/sensor-types')) {
            return subsystem_types_1.BackendSubsystem.ORDER_MANAGEMENT;
        }
        if (cleanUrl.includes('/test-run') ||
            cleanUrl.includes('/test-builder') ||
            cleanUrl.includes('/decoder') ||
            cleanUrl.includes('/test-automation')) {
            return subsystem_types_1.BackendSubsystem.TEST_AUTOMATION;
        }
        if (cleanUrl.includes('/auth') ||
            cleanUrl.includes('/users') ||
            cleanUrl.includes('/roles')) {
            return subsystem_types_1.BackendSubsystem.IDENTITY;
        }
        if (cleanUrl.includes('/modbus') ||
            cleanUrl.includes('/hmi') ||
            cleanUrl.includes('/overview')) {
            return subsystem_types_1.BackendSubsystem.INDUSTRIAL_IOT;
        }
        if (cleanUrl.includes('/realtime') || cleanUrl.includes('/socket.io')) {
            return subsystem_types_1.BackendSubsystem.REALTIME;
        }
        return subsystem_types_1.BackendSubsystem.IDENTITY;
    }
    intercept(context, next) {
        const httpCtx = context.switchToHttp();
        const req = httpCtx.getRequest();
        const res = httpCtx.getResponse();
        const url = req?.originalUrl || req?.url || '';
        const method = req?.method || 'GET';
        const subsystem = SubsystemDebugInterceptor_1.resolveSubsystem(url);
        const startTime = Date.now();
        if (res && res.setHeader) {
            res.setHeader('X-Daviteq-Subsystem', subsystem);
        }
        return next.handle().pipe((0, operators_1.tap)(() => {
            const duration = Date.now() - startTime;
            if (duration > 500) {
                this.logger.warn(`[${subsystem}] SLOW REQUEST: ${method} ${url} completed in ${duration}ms`);
            }
        }), (0, operators_1.catchError)((err) => {
            const duration = Date.now() - startTime;
            const status = err instanceof common_1.HttpException ? err.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            const message = err?.message || 'Internal Server Error';
            console.error(`\x1b[31m[ERROR IN DOMAIN: ${subsystem}]\x1b[0m ${method} ${url} -> Status ${status} (${duration}ms): ${message}`);
            if (err instanceof common_1.HttpException) {
                const resp = err.getResponse();
                if (typeof resp === 'object' && resp !== null) {
                    resp.subsystem = subsystem;
                    resp.debugOrigin = `Daviteq/Backend/${subsystem}`;
                }
            }
            return (0, rxjs_1.throwError)(() => err);
        }));
    }
};
exports.SubsystemDebugInterceptor = SubsystemDebugInterceptor;
exports.SubsystemDebugInterceptor = SubsystemDebugInterceptor = SubsystemDebugInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], SubsystemDebugInterceptor);
//# sourceMappingURL=subsystem-debug.interceptor.js.map