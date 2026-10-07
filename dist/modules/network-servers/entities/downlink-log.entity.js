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
exports.DownlinkLogEntity = void 0;
const typeorm_1 = require("typeorm");
let DownlinkLogEntity = class DownlinkLogEntity {
};
exports.DownlinkLogEntity = DownlinkLogEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    (0, typeorm_1.Index)('idx_downlink_logs_deveui'),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "devEUI", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "deviceName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "networkServerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "networkServerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'CHIRPSTACK' }),
    (0, typeorm_1.Index)('idx_downlink_logs_server_type'),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "serverType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], DownlinkLogEntity.prototype, "fPort", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "payloadHex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], DownlinkLogEntity.prototype, "confirmed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], DownlinkLogEntity.prototype, "flushQueue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'QUEUED' }),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DownlinkLogEntity.prototype, "responseDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, default: 'anonymous' }),
    __metadata("design:type", String)
], DownlinkLogEntity.prototype, "sentBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    (0, typeorm_1.Index)('idx_downlink_logs_created_at'),
    __metadata("design:type", Date)
], DownlinkLogEntity.prototype, "createdAt", void 0);
exports.DownlinkLogEntity = DownlinkLogEntity = __decorate([
    (0, typeorm_1.Entity)('downlink_logs')
], DownlinkLogEntity);
//# sourceMappingURL=downlink-log.entity.js.map