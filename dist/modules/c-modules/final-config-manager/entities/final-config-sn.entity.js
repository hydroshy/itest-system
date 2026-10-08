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
exports.FinalConfigSnEntity = void 0;
const typeorm_1 = require("typeorm");
const final_config_regs_sn_entity_1 = require("./final-config-regs-sn.entity");
const final_config_preset_entity_1 = require("../../create-final-config/entities/final-config-preset.entity");
let FinalConfigSnEntity = class FinalConfigSnEntity {
    get serialNumber() {
        return this.serial_number;
    }
    set serialNumber(val) {
        this.serial_number = val;
    }
    get itemCode() {
        return this.item_code;
    }
    set itemCode(val) {
        this.item_code = val;
    }
    get presetId() {
        return this.preset_id;
    }
    set presetId(val) {
        this.preset_id = val;
    }
    get firmwareVersion() {
        return this.firmware_version;
    }
    set firmwareVersion(val) {
        this.firmware_version = val;
    }
    get shortFw() {
        return this.short_fw;
    }
    set shortFw(val) {
        this.short_fw = val;
    }
    get devEui() {
        return this.dev_eui;
    }
    set devEui(val) {
        this.dev_eui = val;
    }
    get appKey() {
        return this.app_key;
    }
    set appKey(val) {
        this.app_key = val;
    }
    get configuredRegsCount() {
        return this.configured_regs_count;
    }
    set configuredRegsCount(val) {
        this.configured_regs_count = val;
    }
    get totalRegsCount() {
        return this.total_regs_count;
    }
    set totalRegsCount(val) {
        this.total_regs_count = val;
    }
    get testedAt() {
        return this.tested_at;
    }
    set testedAt(val) {
        this.tested_at = val;
    }
    get createdAt() {
        return this.created_at;
    }
    set createdAt(val) {
        this.created_at = val;
    }
    get updatedAt() {
        return this.updated_at;
    }
    set updatedAt(val) {
        this.updated_at = val;
    }
};
exports.FinalConfigSnEntity = FinalConfigSnEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'serial_number', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "serial_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_code', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "item_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'so', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "so", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'preset_id', type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "preset_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => final_config_preset_entity_1.FinalConfigPresetEntity, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'preset_id' }),
    __metadata("design:type", final_config_preset_entity_1.FinalConfigPresetEntity)
], FinalConfigSnEntity.prototype, "preset", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sku', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'firmware_version', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "firmware_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'short_fw', type: 'int', nullable: true }),
    __metadata("design:type", Number)
], FinalConfigSnEntity.prototype, "short_fw", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 20, default: 'NONE' }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dev_eui', type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "dev_eui", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'app_key', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "app_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'configured_regs_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FinalConfigSnEntity.prototype, "configured_regs_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_regs_count', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FinalConfigSnEntity.prototype, "total_regs_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tested_at', type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], FinalConfigSnEntity.prototype, "tested_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'operator', type: 'varchar', length: 100, default: 'admin' }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], FinalConfigSnEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], FinalConfigSnEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => final_config_regs_sn_entity_1.FinalConfigRegsSnEntity, (reg) => reg.configSn, { cascade: true }),
    __metadata("design:type", Array)
], FinalConfigSnEntity.prototype, "registers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], FinalConfigSnEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], FinalConfigSnEntity.prototype, "updated_at", void 0);
exports.FinalConfigSnEntity = FinalConfigSnEntity = __decorate([
    (0, typeorm_1.Entity)('final_config_sn', { synchronize: false }),
    (0, typeorm_1.Unique)('UQ_final_config_sn_serial_item', ['serial_number', 'item_code']),
    (0, typeorm_1.Index)('idx_final_config_sn_serial_number', ['serial_number']),
    (0, typeorm_1.Index)('idx_final_config_sn_item_code', ['item_code']),
    (0, typeorm_1.Index)('idx_final_config_sn_so', ['so']),
    (0, typeorm_1.Index)('idx_final_config_sn_status', ['status']),
    (0, typeorm_1.Index)('idx_final_config_sn_preset_id', ['preset_id']),
    (0, typeorm_1.Index)('idx_final_config_sn_tested_at', ['tested_at']),
    (0, typeorm_1.Index)('idx_final_config_sn_created_at', ['created_at'])
], FinalConfigSnEntity);
//# sourceMappingURL=final-config-sn.entity.js.map