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
exports.SalesOrderEntity = exports.SalesOrderSource = exports.SalesOrderStatus = void 0;
const typeorm_1 = require("typeorm");
const sales_order_item_entity_1 = require("./sales-order-item.entity");
var SalesOrderStatus;
(function (SalesOrderStatus) {
    SalesOrderStatus["DRAFT"] = "DRAFT";
    SalesOrderStatus["CONFIRMED"] = "CONFIRMED";
    SalesOrderStatus["IN_PRODUCTION"] = "IN_PRODUCTION";
    SalesOrderStatus["TESTING"] = "TESTING";
    SalesOrderStatus["COMPLETED"] = "COMPLETED";
    SalesOrderStatus["CANCELLED"] = "CANCELLED";
})(SalesOrderStatus || (exports.SalesOrderStatus = SalesOrderStatus = {}));
var SalesOrderSource;
(function (SalesOrderSource) {
    SalesOrderSource["MANUAL"] = "MANUAL";
    SalesOrderSource["ODOO"] = "ODOO";
    SalesOrderSource["CSV"] = "CSV";
    SalesOrderSource["EXCEL"] = "EXCEL";
    SalesOrderSource["API"] = "API";
})(SalesOrderSource || (exports.SalesOrderSource = SalesOrderSource = {}));
let SalesOrderEntity = class SalesOrderEntity {
};
exports.SalesOrderEntity = SalesOrderEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_orders_so_code'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], SalesOrderEntity.prototype, "soCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], SalesOrderEntity.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], SalesOrderEntity.prototype, "orderDate", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_orders_status'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: SalesOrderStatus.DRAFT }),
    __metadata("design:type", String)
], SalesOrderEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_orders_source'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: SalesOrderSource.MANUAL }),
    __metadata("design:type", String)
], SalesOrderEntity.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_orders_odoo_id'),
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], SalesOrderEntity.prototype, "odooId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SalesOrderEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], SalesOrderEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], SalesOrderEntity.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_orders_created_at'),
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SalesOrderEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SalesOrderEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sales_order_item_entity_1.SalesOrderItemEntity, (item) => item.salesOrder, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], SalesOrderEntity.prototype, "items", void 0);
exports.SalesOrderEntity = SalesOrderEntity = __decorate([
    (0, typeorm_1.Entity)('sales_orders')
], SalesOrderEntity);
//# sourceMappingURL=sales-order.entity.js.map