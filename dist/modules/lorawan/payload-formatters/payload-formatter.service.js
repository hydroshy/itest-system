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
var PayloadFormatterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayloadFormatterService = void 0;
const common_1 = require("@nestjs/common");
const lorawan_resilience_service_1 = require("../services/lorawan-resilience.service");
let PayloadFormatterService = PayloadFormatterService_1 = class PayloadFormatterService {
    constructor(resilienceService) {
        this.resilienceService = resilienceService;
        this.logger = new common_1.Logger(PayloadFormatterService_1.name);
    }
    decodePayload(script, bytesHex, fPort = 1) {
        const result = this.resilienceService.safeDecodePayload(script, bytesHex, fPort);
        if (!result.success) {
            this.logger.error(`Payload decode error: ${result.error}`);
            throw new common_1.BadRequestException(`Payload decoder execution failed: ${result.error}`);
        }
        return result.data || {};
    }
};
exports.PayloadFormatterService = PayloadFormatterService;
exports.PayloadFormatterService = PayloadFormatterService = PayloadFormatterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [lorawan_resilience_service_1.LorawanResilienceService])
], PayloadFormatterService);
//# sourceMappingURL=payload-formatter.service.js.map