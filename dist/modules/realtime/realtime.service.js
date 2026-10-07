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
var RealtimeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const realtime_gateway_1 = require("./realtime.gateway");
let RealtimeService = RealtimeService_1 = class RealtimeService {
    constructor(gateway) {
        this.gateway = gateway;
        this.logger = new common_1.Logger(RealtimeService_1.name);
        this.stream$ = new rxjs_1.Subject();
    }
    publishTelemetry(telemetry) {
        const event = {
            type: 'telemetry',
            data: telemetry,
            timestamp: new Date().toISOString(),
        };
        this.stream$.next(event);
        try {
            this.gateway.broadcastTelemetry(telemetry);
        }
        catch (err) {
            this.logger.warn(`Failed to broadcast telemetry via WebSocket: ${err.message}`);
        }
    }
    publishDownlink(downlinkEvent) {
        const event = {
            type: 'downlink',
            data: downlinkEvent,
            timestamp: new Date().toISOString(),
        };
        this.stream$.next(event);
        try {
            this.gateway.broadcastDownlink(downlinkEvent);
        }
        catch (err) {
            this.logger.warn(`Failed to broadcast downlink via WebSocket: ${err.message}`);
        }
    }
    getStream() {
        return this.stream$.asObservable().pipe((0, operators_1.map)((event) => ({
            data: event,
        })));
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = RealtimeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway])
], RealtimeService);
//# sourceMappingURL=realtime.service.js.map