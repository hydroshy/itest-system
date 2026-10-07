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
exports.TestPacketLogEntity = void 0;
const typeorm_1 = require("typeorm");
const test_device_run_entity_1 = require("./test-device-run.entity");
let TestPacketLogEntity = class TestPacketLogEntity {
};
exports.TestPacketLogEntity = TestPacketLogEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestPacketLogEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestPacketLogEntity.prototype, "deviceRunId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_device_run_entity_1.TestDeviceRunEntity, (run) => run.packetLogs, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'deviceRunId' }),
    __metadata("design:type", test_device_run_entity_1.TestDeviceRunEntity)
], TestPacketLogEntity.prototype, "deviceRun", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], TestPacketLogEntity.prototype, "devEUI", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], TestPacketLogEntity.prototype, "fPort", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestPacketLogEntity.prototype, "fCnt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TestPacketLogEntity.prototype, "payloadHex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TestPacketLogEntity.prototype, "decodedData", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'[]'` }),
    __metadata("design:type", Array)
], TestPacketLogEntity.prototype, "assertionResults", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], TestPacketLogEntity.prototype, "isPass", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], TestPacketLogEntity.prototype, "rssi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], TestPacketLogEntity.prototype, "snr", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TestPacketLogEntity.prototype, "gatewayId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestPacketLogEntity.prototype, "receivedAt", void 0);
exports.TestPacketLogEntity = TestPacketLogEntity = __decorate([
    (0, typeorm_1.Entity)('test_packet_logs'),
    (0, typeorm_1.Index)('idx_test_packet_logs_device_run_id', ['deviceRunId']),
    (0, typeorm_1.Index)('idx_test_packet_logs_deveui', ['devEUI']),
    (0, typeorm_1.Index)('idx_test_packet_logs_received_at', ['receivedAt'])
], TestPacketLogEntity);
//# sourceMappingURL=test-packet-log.entity.js.map