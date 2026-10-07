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
exports.TestEvidenceEntity = void 0;
const typeorm_1 = require("typeorm");
const test_session_entity_1 = require("./test-session.entity");
const test_device_run_entity_1 = require("./test-device-run.entity");
let TestEvidenceEntity = class TestEvidenceEntity {
};
exports.TestEvidenceEntity = TestEvidenceEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_session_entity_1.TestSessionEntity, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sessionId' }),
    __metadata("design:type", test_session_entity_1.TestSessionEntity)
], TestEvidenceEntity.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "deviceRunId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_device_run_entity_1.TestDeviceRunEntity, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'deviceRunId' }),
    __metadata("design:type", test_device_run_entity_1.TestDeviceRunEntity)
], TestEvidenceEntity.prototype, "deviceRun", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "sessionCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "soCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "itemCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "devEUI", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "firmwareVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "hardwareVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "payloadHex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], TestEvidenceEntity.prototype, "decodedFields", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'[]'` }),
    __metadata("design:type", Array)
], TestEvidenceEntity.prototype, "assertionResults", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'PASSED' }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "verdict", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "failureReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], TestEvidenceEntity.prototype, "fPort", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestEvidenceEntity.prototype, "fCnt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], TestEvidenceEntity.prototype, "rssi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], TestEvidenceEntity.prototype, "snr", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], TestEvidenceEntity.prototype, "batteryVoltage", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TestEvidenceEntity.prototype, "operatorUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], TestEvidenceEntity.prototype, "testedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], TestEvidenceEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestEvidenceEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestEvidenceEntity.prototype, "updatedAt", void 0);
exports.TestEvidenceEntity = TestEvidenceEntity = __decorate([
    (0, typeorm_1.Entity)('test_evidence'),
    (0, typeorm_1.Index)('idx_test_evidence_deveui', ['devEUI']),
    (0, typeorm_1.Index)('idx_test_evidence_so_code', ['soCode']),
    (0, typeorm_1.Index)('idx_test_evidence_item_code', ['itemCode']),
    (0, typeorm_1.Index)('idx_test_evidence_serial_number', ['serialNumber']),
    (0, typeorm_1.Index)('idx_test_evidence_verdict', ['verdict']),
    (0, typeorm_1.Index)('idx_test_evidence_tested_at', ['testedAt'])
], TestEvidenceEntity);
//# sourceMappingURL=test-evidence.entity.js.map