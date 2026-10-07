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
exports.TestSessionEntity = void 0;
const typeorm_1 = require("typeorm");
const test_template_entity_1 = require("../../../c-modules/test-builder/entities/test-template.entity");
const test_device_run_entity_1 = require("./test-device-run.entity");
let TestSessionEntity = class TestSessionEntity {
};
exports.TestSessionEntity = TestSessionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestSessionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], TestSessionEntity.prototype, "sessionCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TestSessionEntity.prototype, "soCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TestSessionEntity.prototype, "itemCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TestSessionEntity.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_template_entity_1.TestTemplateEntity, { onDelete: 'RESTRICT', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'templateId' }),
    __metadata("design:type", test_template_entity_1.TestTemplateEntity)
], TestSessionEntity.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestSessionEntity.prototype, "totalDevices", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestSessionEntity.prototype, "passedDevices", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestSessionEntity.prototype, "failedDevices", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'PENDING' }),
    __metadata("design:type", String)
], TestSessionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TestSessionEntity.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TestSessionEntity.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TestSessionEntity.prototype, "operatorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestSessionEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], TestSessionEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => test_device_run_entity_1.TestDeviceRunEntity, (run) => run.session, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], TestSessionEntity.prototype, "deviceRuns", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestSessionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestSessionEntity.prototype, "updatedAt", void 0);
exports.TestSessionEntity = TestSessionEntity = __decorate([
    (0, typeorm_1.Entity)('test_sessions'),
    (0, typeorm_1.Index)('idx_test_sessions_so_code', ['soCode']),
    (0, typeorm_1.Index)('idx_test_sessions_item_code', ['itemCode']),
    (0, typeorm_1.Index)('idx_test_sessions_status', ['status'])
], TestSessionEntity);
//# sourceMappingURL=test-session.entity.js.map