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
exports.TestAssertionEntity = void 0;
const typeorm_1 = require("typeorm");
const test_template_entity_1 = require("./test-template.entity");
let TestAssertionEntity = class TestAssertionEntity {
};
exports.TestAssertionEntity = TestAssertionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestAssertionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TestAssertionEntity.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_template_entity_1.TestTemplateEntity, (template) => template.assertions, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'templateId' }),
    __metadata("design:type", test_template_entity_1.TestTemplateEntity)
], TestAssertionEntity.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TestAssertionEntity.prototype, "fieldName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TestAssertionEntity.prototype, "fieldLabel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], TestAssertionEntity.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], TestAssertionEntity.prototype, "expectedValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', default: 0 }),
    __metadata("design:type", Number)
], TestAssertionEntity.prototype, "tolerance", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TestAssertionEntity.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'ERROR' }),
    __metadata("design:type", String)
], TestAssertionEntity.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], TestAssertionEntity.prototype, "orderIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestAssertionEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestAssertionEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestAssertionEntity.prototype, "updatedAt", void 0);
exports.TestAssertionEntity = TestAssertionEntity = __decorate([
    (0, typeorm_1.Entity)('test_assertions')
], TestAssertionEntity);
//# sourceMappingURL=test-assertion.entity.js.map