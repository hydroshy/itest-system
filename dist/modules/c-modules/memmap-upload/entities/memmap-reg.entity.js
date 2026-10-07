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
exports.MemmapRegEntity = void 0;
const typeorm_1 = require("typeorm");
const memmap_payload_entity_1 = require("./memmap-payload.entity");
let MemmapRegEntity = class MemmapRegEntity {
};
exports.MemmapRegEntity = MemmapRegEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "payload_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => memmap_payload_entity_1.MemmapPayloadEntity, (payload) => payload.registers, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'payload_id' }),
    __metadata("design:type", memmap_payload_entity_1.MemmapPayloadEntity)
], MemmapRegEntity.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MemmapRegEntity.prototype, "short_fw", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MemmapRegEntity.prototype, "no", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MemmapRegEntity.prototype, "modbus_reg_dec", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "modbus_reg_hex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: '3', nullable: true }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "fn_read", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'None', nullable: true }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "fn_write", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], MemmapRegEntity.prototype, "num_regs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "range_val", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "end_user_default", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "downlink_type_5", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MemmapRegEntity.prototype, "in_rd1_template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MemmapRegEntity.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MemmapRegEntity.prototype, "in_engineering_template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MemmapRegEntity.prototype, "in_end_user_template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], MemmapRegEntity.prototype, "in_full_template", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MemmapRegEntity.prototype, "created_at", void 0);
exports.MemmapRegEntity = MemmapRegEntity = __decorate([
    (0, typeorm_1.Entity)('memmap_regs', { synchronize: false }),
    (0, typeorm_1.Index)('idx_memmap_regs_payload_id', ['payload_id']),
    (0, typeorm_1.Index)('idx_memmap_regs_sku_fw', ['sku', 'short_fw']),
    (0, typeorm_1.Index)('idx_memmap_regs_dec', ['modbus_reg_dec']),
    (0, typeorm_1.Index)('idx_memmap_regs_hex', ['modbus_reg_hex']),
    (0, typeorm_1.Index)('idx_memmap_regs_description', ['description'])
], MemmapRegEntity);
//# sourceMappingURL=memmap-reg.entity.js.map