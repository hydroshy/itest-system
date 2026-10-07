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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const realtime_service_1 = require("./realtime.service");
let RealtimeController = class RealtimeController {
    constructor(realtimeService) {
        this.realtimeService = realtimeService;
    }
    stream() {
        return this.realtimeService.getStream();
    }
    status() {
        return {
            success: true,
            websocket: 'ready',
            sse: 'active',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.RealtimeController = RealtimeController;
__decorate([
    (0, common_1.Sse)('stream'),
    (0, swagger_1.ApiOperation)({ summary: 'Server-Sent Events (SSE) stream for realtime telemetry and downlink events' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", rxjs_1.Observable)
], RealtimeController.prototype, "stream", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check realtime gateway health and connection status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RealtimeController.prototype, "status", null);
exports.RealtimeController = RealtimeController = __decorate([
    (0, swagger_1.ApiTags)('Realtime Stream (WebSocket & SSE)'),
    (0, common_1.Controller)('api/realtime'),
    __metadata("design:paramtypes", [realtime_service_1.RealtimeService])
], RealtimeController);
//# sourceMappingURL=realtime.controller.js.map