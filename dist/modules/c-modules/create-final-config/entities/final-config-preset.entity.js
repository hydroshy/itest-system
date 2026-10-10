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
exports.FinalConfigPresetEntity = void 0;
const typeorm_1 = require("typeorm");
const final_config_reg_entity_1 = require("./final-config-reg.entity");
let FinalConfigPresetEntity = class FinalConfigPresetEntity {
};
exports.FinalConfigPresetEntity = FinalConfigPresetEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FinalConfigPresetEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FinalConfigPresetEntity.prototype, "so", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FinalConfigPresetEntity.prototype, "item_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FinalConfigPresetEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], FinalConfigPresetEntity.prototype, "firmware_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], FinalConfigPresetEntity.prototype, "short_fw", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FinalConfigPresetEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FinalConfigPresetEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FinalConfigPresetEntity.prototype, "total_regs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 3500 }),
    __metadata("design:type", Number)
], FinalConfigPresetEntity.prototype, "write_timeout_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 600 }),
    __metadata("design:type", Number)
], FinalConfigPresetEntity.prototype, "settling_delay_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], FinalConfigPresetEntity.prototype, "enable_probe_verification", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 50 }),
    __metadata("design:type", Number)
], FinalConfigPresetEntity.prototype, "probe_interval_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1500 }),
    __metadata("design:type", Number)
], FinalConfigPresetEntity.prototype, "max_probe_timeout_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FinalConfigPresetEntity.prototype, "safe_probe_register", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, default: 'admin', nullable: true }),
    __metadata("design:type", String)
], FinalConfigPresetEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => final_config_reg_entity_1.FinalConfigRegEntity, (reg) => reg.preset, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], FinalConfigPresetEntity.prototype, "registers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], FinalConfigPresetEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], FinalConfigPresetEntity.prototype, "updated_at", void 0);
exports.FinalConfigPresetEntity = FinalConfigPresetEntity = __decorate([
    (0, typeorm_1.Entity)('final_config_presets', { synchronize: false }),
    (0, typeorm_1.Unique)('UQ_final_config_presets_so_item_code', ['so', 'item_code']),
    (0, typeorm_1.Index)('idx_final_config_presets_so', ['so']),
    (0, typeorm_1.Index)('idx_final_config_presets_item_code', ['item_code']),
    (0, typeorm_1.Index)('idx_final_config_presets_sku_fw', ['sku', 'short_fw']),
    (0, typeorm_1.Index)('idx_final_config_presets_created_at', ['created_at'])
], FinalConfigPresetEntity);
//# sourceMappingURL=final-config-preset.entity.js.map