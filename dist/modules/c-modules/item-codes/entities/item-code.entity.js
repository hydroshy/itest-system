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
exports.ItemCodeEntity = void 0;
const typeorm_1 = require("typeorm");
const test_template_entity_1 = require("../../test-builder/entities/test-template.entity");
let ItemCodeEntity = class ItemCodeEntity {
};
exports.ItemCodeEntity = ItemCodeEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ItemCodeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_item_codes_item_code'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], ItemCodeEntity.prototype, "itemCode", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_item_codes_sku'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ItemCodeEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: '1' }),
    __metadata("design:type", String)
], ItemCodeEntity.prototype, "firmwareVersion", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_item_codes_sku_fw'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ItemCodeEntity.prototype, "skuFw", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_item_codes_default_template_id'),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], ItemCodeEntity.prototype, "defaultTemplateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_template_entity_1.TestTemplateEntity, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'defaultTemplateId' }),
    __metadata("design:type", test_template_entity_1.TestTemplateEntity)
], ItemCodeEntity.prototype, "defaultTemplate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ItemCodeEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_item_codes_is_active'),
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], ItemCodeEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], ItemCodeEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_item_codes_created_at'),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ItemCodeEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ItemCodeEntity.prototype, "updatedAt", void 0);
exports.ItemCodeEntity = ItemCodeEntity = __decorate([
    (0, typeorm_1.Entity)('item_codes')
], ItemCodeEntity);
//# sourceMappingURL=item-code.entity.js.map