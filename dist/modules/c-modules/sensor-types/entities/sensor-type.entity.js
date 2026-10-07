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
exports.SensorTypeEntity = void 0;
const typeorm_1 = require("typeorm");
let SensorTypeEntity = class SensorTypeEntity {
};
exports.SensorTypeEntity = SensorTypeEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SensorTypeEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sensor_types_sensor_type_code', { unique: true }),
    (0, typeorm_1.Column)({ type: 'int', unique: true }),
    __metadata("design:type", Number)
], SensorTypeEntity.prototype, "sensorTypeCode", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sensor_types_sku'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SensorTypeEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SensorTypeEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SensorTypeEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'EU868' }),
    __metadata("design:type", String)
], SensorTypeEntity.prototype, "defaultRegion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'A' }),
    __metadata("design:type", String)
], SensorTypeEntity.prototype, "defaultClass", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sensor_types_is_active'),
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], SensorTypeEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], SensorTypeEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sensor_types_created_at'),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SensorTypeEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SensorTypeEntity.prototype, "updatedAt", void 0);
exports.SensorTypeEntity = SensorTypeEntity = __decorate([
    (0, typeorm_1.Entity)('sensor_types')
], SensorTypeEntity);
//# sourceMappingURL=sensor-type.entity.js.map