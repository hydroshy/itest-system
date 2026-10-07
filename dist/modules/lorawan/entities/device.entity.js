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
exports.DeviceEntity = void 0;
const typeorm_1 = require("typeorm");
const network_server_entity_1 = require("../../network-servers/entities/network-server.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const item_code_entity_1 = require("../../c-modules/item-codes/entities/item-code.entity");
const sales_order_entity_1 = require("../../c-modules/sales-orders/entities/sales-order.entity");
let DeviceEntity = class DeviceEntity {
};
exports.DeviceEntity = DeviceEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeviceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "devEUI", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DeviceEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "appId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'ownerId' }),
    __metadata("design:type", user_entity_1.User)
], DeviceEntity.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "networkServerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "regionProfileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => network_server_entity_1.NetworkServerEntity, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'networkServerId' }),
    __metadata("design:type", network_server_entity_1.NetworkServerEntity)
], DeviceEntity.prototype, "networkServer", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'OTAA' }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "activationMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: '0102030405060708' }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "appEUI", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, default: '0102030405060708090A0B0C0D0E0F10' }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "appKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "nwkSKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "appSKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'SYNCED' }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "syncStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], DeviceEntity.prototype, "syncDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "decoderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "itemCodeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_code_entity_1.ItemCodeEntity, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'itemCodeId' }),
    __metadata("design:type", item_code_entity_1.ItemCodeEntity)
], DeviceEntity.prototype, "itemCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "salesOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrderEntity, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'salesOrderId' }),
    __metadata("design:type", sales_order_entity_1.SalesOrderEntity)
], DeviceEntity.prototype, "salesOrder", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "firmwareVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DeviceEntity.prototype, "payloadFormatterScript", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], DeviceEntity.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], DeviceEntity.prototype, "lastSeenAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DeviceEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DeviceEntity.prototype, "updatedAt", void 0);
exports.DeviceEntity = DeviceEntity = __decorate([
    (0, typeorm_1.Entity)('devices')
], DeviceEntity);
//# sourceMappingURL=device.entity.js.map