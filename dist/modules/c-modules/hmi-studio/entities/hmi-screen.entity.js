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
exports.HmiScreenEntity = void 0;
const typeorm_1 = require("typeorm");
let HmiScreenEntity = class HmiScreenEntity {
};
exports.HmiScreenEntity = HmiScreenEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], HmiScreenEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], HmiScreenEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HmiScreenEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        default: () => `'{"width": 1280, "height": 720, "background": "#0b0f19", "grid": 10, "showGrid": true}'`,
    }),
    __metadata("design:type", Object)
], HmiScreenEntity.prototype, "canvasConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        default: () => `'[]'`,
    }),
    __metadata("design:type", Array)
], HmiScreenEntity.prototype, "widgets", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], HmiScreenEntity.prototype, "isPublished", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        default: () => `'["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"]'`,
    }),
    __metadata("design:type", Array)
], HmiScreenEntity.prototype, "allowedRoles", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], HmiScreenEntity.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HmiScreenEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HmiScreenEntity.prototype, "updatedAt", void 0);
exports.HmiScreenEntity = HmiScreenEntity = __decorate([
    (0, typeorm_1.Entity)('hmi_screens')
], HmiScreenEntity);
//# sourceMappingURL=hmi-screen.entity.js.map