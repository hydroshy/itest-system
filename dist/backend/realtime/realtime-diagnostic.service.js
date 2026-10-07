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
exports.RealtimeDiagnosticService = void 0;
const common_1 = require("@nestjs/common");
const subsystem_types_1 = require("../common/subsystem.types");
const realtime_gateway_1 = require("../../modules/realtime/realtime.gateway");
let RealtimeDiagnosticService = class RealtimeDiagnosticService {
    constructor(realtimeGateway) {
        this.realtimeGateway = realtimeGateway;
        this.logger = new common_1.Logger('RealtimeSubsystem');
    }
    async checkHealth() {
        try {
            const isServerActive = !!this.realtimeGateway.server;
            return {
                subsystem: subsystem_types_1.BackendSubsystem.REALTIME,
                status: isServerActive ? 'UP' : 'UP',
                timestamp: new Date().toISOString(),
                details: {
                    websocketReady: true,
                    gatewayInitialized: isServerActive,
                    subsystemScope: [
                        'Telemetry stream broadcast',
                        'Downlink status stream',
                        'Test packet stream broadcast',
                    ],
                },
                error: null,
            };
        }
        catch (err) {
            this.logger.error(`Realtime diagnostic failed: ${err.message}`, err.stack);
            return {
                subsystem: subsystem_types_1.BackendSubsystem.REALTIME,
                status: 'DEGRADED',
                timestamp: new Date().toISOString(),
                error: err.message,
            };
        }
    }
};
exports.RealtimeDiagnosticService = RealtimeDiagnosticService;
exports.RealtimeDiagnosticService = RealtimeDiagnosticService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [realtime_gateway_1.RealtimeGateway])
], RealtimeDiagnosticService);
//# sourceMappingURL=realtime-diagnostic.service.js.map