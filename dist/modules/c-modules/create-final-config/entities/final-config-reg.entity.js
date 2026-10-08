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
exports.FinalConfigRegEntity = void 0;
const typeorm_1 = require("typeorm");
const final_config_preset_entity_1 = require("./final-config-preset.entity");
let FinalConfigRegEntity = class FinalConfigRegEntity {
};
exports.FinalConfigRegEntity = FinalConfigRegEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "preset_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => final_config_preset_entity_1.FinalConfigPresetEntity, (preset) => preset.registers, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'preset_id' }),
    __metadata("design:type", final_config_preset_entity_1.FinalConfigPresetEntity)
], FinalConfigRegEntity.prototype, "preset", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], FinalConfigRegEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "modbus_reg_hex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], FinalConfigRegEntity.prototype, "slave", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], FinalConfigRegEntity.prototype, "reg_num", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "parameter_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, default: '' }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "value_to_write", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "value_on_memmap", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'big-endian' }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "endianness", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: '3', nullable: true }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "fn_read", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: '16', nullable: true }),
    __metadata("design:type", String)
], FinalConfigRegEntity.prototype, "fn_write", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FinalConfigRegEntity.prototype, "order_no", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], FinalConfigRegEntity.prototype, "checked", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], FinalConfigRegEntity.prototype, "created_at", void 0);
exports.FinalConfigRegEntity = FinalConfigRegEntity = __decorate([
    (0, typeorm_1.Entity)('final_config_regs', { synchronize: false }),
    (0, typeorm_1.Index)('idx_final_config_regs_preset_id', ['preset_id']),
    (0, typeorm_1.Index)('idx_final_config_regs_address', ['address']),
    (0, typeorm_1.Index)('idx_final_config_regs_parameter_name', ['parameter_name'])
], FinalConfigRegEntity);
//# sourceMappingURL=final-config-reg.entity.js.map