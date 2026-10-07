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
exports.TestTemplateEntity = void 0;
const typeorm_1 = require("typeorm");
const test_assertion_entity_1 = require("./test-assertion.entity");
let TestTemplateEntity = class TestTemplateEntity {
};
exports.TestTemplateEntity = TestTemplateEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "firmwareVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "decoderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'FLOW' }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "executionMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], TestTemplateEntity.prototype, "flowConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "customScript", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 60 }),
    __metadata("design:type", Number)
], TestTemplateEntity.prototype, "timeoutSeconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], TestTemplateEntity.prototype, "minPacketsRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], TestTemplateEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], TestTemplateEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], TestTemplateEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => test_assertion_entity_1.TestAssertionEntity, (assertion) => assertion.template, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], TestTemplateEntity.prototype, "assertions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestTemplateEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TestTemplateEntity.prototype, "updatedAt", void 0);
exports.TestTemplateEntity = TestTemplateEntity = __decorate([
    (0, typeorm_1.Entity)('test_templates')
], TestTemplateEntity);
//# sourceMappingURL=test-template.entity.js.map