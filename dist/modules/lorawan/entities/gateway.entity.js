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
exports.GatewayEntity = void 0;
const typeorm_1 = require("typeorm");
const network_server_entity_1 = require("../../network-servers/entities/network-server.entity");
let GatewayEntity = class GatewayEntity {
};
exports.GatewayEntity = GatewayEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GatewayEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], GatewayEntity.prototype, "gatewayEUI", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], GatewayEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GatewayEntity.prototype, "networkServerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GatewayEntity.prototype, "regionProfileId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => network_server_entity_1.NetworkServerEntity, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'networkServerId' }),
    __metadata("design:type", network_server_entity_1.NetworkServerEntity)
], GatewayEntity.prototype, "networkServer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], GatewayEntity.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], GatewayEntity.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Number)
], GatewayEntity.prototype, "altitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'ONLINE' }),
    __metadata("design:type", String)
], GatewayEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], GatewayEntity.prototype, "ownerId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GatewayEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], GatewayEntity.prototype, "updatedAt", void 0);
exports.GatewayEntity = GatewayEntity = __decorate([
    (0, typeorm_1.Entity)('gateways')
], GatewayEntity);
//# sourceMappingURL=gateway.entity.js.map