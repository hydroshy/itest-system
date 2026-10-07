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
exports.LorawanDiagnosticService = void 0;
const common_1 = require("@nestjs/common");
const subsystem_types_1 = require("../common/subsystem.types");
const network_servers_service_1 = require("../../modules/network-servers/network-servers.service");
const lorawan_service_1 = require("../../modules/lorawan/lorawan.service");
let LorawanDiagnosticService = class LorawanDiagnosticService {
    constructor(networkServersService, lorawanService) {
        this.networkServersService = networkServersService;
        this.lorawanService = lorawanService;
        this.logger = new common_1.Logger('LorawanSubsystem');
    }
    async checkHealth() {
        try {
            const servers = await this.networkServersService.findAll();
            const gateways = await this.lorawanService.listGateways();
            const devices = await this.lorawanService.listDevices();
            return {
                subsystem: subsystem_types_1.BackendSubsystem.LORAWAN,
                status: 'UP',
                timestamp: new Date().toISOString(),
                details: {
                    networkServersCount: servers.length,
                    gatewaysCount: gateways.length,
                    devicesCount: devices.length,
                    subsystemScope: [
                        'chirpstack / ttn connectors',
                        'device activations (OTAA/ABP)',
                        'downlink queue scheduler',
                        'gateway packets',
                        'payload decoders & webhooks',
                    ],
                },
                error: null,
            };
        }
        catch (err) {
            this.logger.error(`LoRaWAN diagnostic failed: ${err.message}`, err.stack);
            return {
                subsystem: subsystem_types_1.BackendSubsystem.LORAWAN,
                status: 'DEGRADED',
                timestamp: new Date().toISOString(),
                error: err.message,
            };
        }
    }
};
exports.LorawanDiagnosticService = LorawanDiagnosticService;
exports.LorawanDiagnosticService = LorawanDiagnosticService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [network_servers_service_1.NetworkServersService,
        lorawan_service_1.LorawanService])
], LorawanDiagnosticService);
//# sourceMappingURL=lorawan-diagnostic.service.js.map