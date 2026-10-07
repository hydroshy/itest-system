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
exports.WebhookLogEntity = void 0;
const typeorm_1 = require("typeorm");
let WebhookLogEntity = class WebhookLogEntity {
};
exports.WebhookLogEntity = WebhookLogEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], WebhookLogEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], WebhookLogEntity.prototype, "serverType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], WebhookLogEntity.prototype, "devEUI", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], WebhookLogEntity.prototype, "fPort", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], WebhookLogEntity.prototype, "fCnt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], WebhookLogEntity.prototype, "payloadHex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WebhookLogEntity.prototype, "decodedData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], WebhookLogEntity.prototype, "rawPayload", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'SUCCESS' }),
    __metadata("design:type", String)
], WebhookLogEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], WebhookLogEntity.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], WebhookLogEntity.prototype, "receivedAt", void 0);
exports.WebhookLogEntity = WebhookLogEntity = __decorate([
    (0, typeorm_1.Entity)('webhook_logs')
], WebhookLogEntity);
//# sourceMappingURL=webhook-log.entity.js.map