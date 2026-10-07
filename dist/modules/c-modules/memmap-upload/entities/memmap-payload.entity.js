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
exports.MemmapPayloadEntity = void 0;
const typeorm_1 = require("typeorm");
const memmap_reg_entity_1 = require("./memmap-reg.entity");
let MemmapPayloadEntity = class MemmapPayloadEntity {
};
exports.MemmapPayloadEntity = MemmapPayloadEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MemmapPayloadEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], MemmapPayloadEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MemmapPayloadEntity.prototype, "short_fw", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], MemmapPayloadEntity.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], MemmapPayloadEntity.prototype, "total_regs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], MemmapPayloadEntity.prototype, "dec_valid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], MemmapPayloadEntity.prototype, "hex_valid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, default: 'admin', nullable: true }),
    __metadata("design:type", String)
], MemmapPayloadEntity.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => memmap_reg_entity_1.MemmapRegEntity, (reg) => reg.payload, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], MemmapPayloadEntity.prototype, "registers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MemmapPayloadEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], MemmapPayloadEntity.prototype, "updated_at", void 0);
exports.MemmapPayloadEntity = MemmapPayloadEntity = __decorate([
    (0, typeorm_1.Entity)('memmap_payload', { synchronize: false }),
    (0, typeorm_1.Unique)('UQ_memmap_payload_sku_short_fw', ['sku', 'short_fw']),
    (0, typeorm_1.Index)('idx_memmap_payload_sku_fw', ['sku', 'short_fw']),
    (0, typeorm_1.Index)('idx_memmap_payload_created_at', ['created_at'])
], MemmapPayloadEntity);
//# sourceMappingURL=memmap-payload.entity.js.map