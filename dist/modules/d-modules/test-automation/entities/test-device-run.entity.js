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
exports.TestDeviceRunEntity = void 0;
const typeorm_1 = require("typeorm");
const test_session_entity_1 = require("./test-session.entity");
const test_packet_log_entity_1 = require("./test-packet-log.entity");
let TestDeviceRunEntity = class TestDeviceRunEntity {
};
exports.TestDeviceRunEntity = TestDeviceRunEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestDeviceRunEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestDeviceRunEntity.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_session_entity_1.TestSessionEntity, (session) => session.deviceRuns, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", test_session_entity_1.TestSessionEntity)
], TestDeviceRunEntity.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], TestDeviceRunEntity.prototype, "devEUI", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestDeviceRunEntity.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TestDeviceRunEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TestDeviceRunEntity.prototype, "firmwareVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'WAITING' }),
    __metadata("design:type", String)
], TestDeviceRunEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestDeviceRunEntity.prototype, "totalPackets", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestDeviceRunEntity.prototype, "passedAssertions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestDeviceRunEntity.prototype, "failedAssertions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], TestDeviceRunEntity.prototype, "summaryReport", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], TestDeviceRunEntity.prototype, "rssiAvg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], TestDeviceRunEntity.prototype, "snrAvg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], TestDeviceRunEntity.prototype, "batteryVoltage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TestDeviceRunEntity.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TestDeviceRunEntity.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestDeviceRunEntity.prototype, "failureReason", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => test_packet_log_entity_1.TestPacketLogEntity, (log) => log.deviceRun, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], TestDeviceRunEntity.prototype, "packetLogs", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestDeviceRunEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestDeviceRunEntity.prototype, "updatedAt", void 0);
exports.TestDeviceRunEntity = TestDeviceRunEntity = __decorate([
    (0, typeorm_1.Entity)('test_device_runs'),
    (0, typeorm_1.Index)('idx_test_device_runs_session_id', ['sessionId']),
    (0, typeorm_1.Index)('idx_test_device_runs_deveui', ['devEUI']),
    (0, typeorm_1.Index)('idx_test_device_runs_status', ['status'])
], TestDeviceRunEntity);
//# sourceMappingURL=test-device-run.entity.js.map