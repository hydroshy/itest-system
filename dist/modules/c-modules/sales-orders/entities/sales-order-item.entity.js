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
exports.SalesOrderItemEntity = exports.SalesOrderItemStatus = void 0;
const typeorm_1 = require("typeorm");
const sales_order_entity_1 = require("./sales-order.entity");
const test_template_entity_1 = require("../../test-builder/entities/test-template.entity");
const item_code_entity_1 = require("../../item-codes/entities/item-code.entity");
var SalesOrderItemStatus;
(function (SalesOrderItemStatus) {
    SalesOrderItemStatus["PENDING"] = "PENDING";
    SalesOrderItemStatus["TESTING"] = "TESTING";
    SalesOrderItemStatus["PASSED"] = "PASSED";
    SalesOrderItemStatus["FAILED"] = "FAILED";
})(SalesOrderItemStatus || (exports.SalesOrderItemStatus = SalesOrderItemStatus = {}));
let SalesOrderItemEntity = class SalesOrderItemEntity {
};
exports.SalesOrderItemEntity = SalesOrderItemEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_order_items_so_id'),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "salesOrderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sales_order_entity_1.SalesOrderEntity, (so) => so.items, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'salesOrderId' }),
    __metadata("design:type", sales_order_entity_1.SalesOrderEntity)
], SalesOrderItemEntity.prototype, "salesOrder", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_order_items_item_code'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "itemCode", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_order_items_item_code_id'),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "itemCodeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => item_code_entity_1.ItemCodeEntity, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'itemCodeId' }),
    __metadata("design:type", item_code_entity_1.ItemCodeEntity)
], SalesOrderItemEntity.prototype, "itemCodeRef", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_order_items_sku'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], SalesOrderItemEntity.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: '1' }),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "firmwareVersion", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_order_items_template_id'),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "templateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => test_template_entity_1.TestTemplateEntity, {
        nullable: true,
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'templateId' }),
    __metadata("design:type", test_template_entity_1.TestTemplateEntity)
], SalesOrderItemEntity.prototype, "template", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SalesOrderItemEntity.prototype, "testedQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SalesOrderItemEntity.prototype, "passedQuantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SalesOrderItemEntity.prototype, "failedQuantity", void 0);
__decorate([
    (0, typeorm_1.Index)('idx_sales_order_items_status'),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: SalesOrderItemStatus.PENDING }),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SalesOrderItemEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => `'{}'` }),
    __metadata("design:type", Object)
], SalesOrderItemEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SalesOrderItemEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SalesOrderItemEntity.prototype, "updatedAt", void 0);
exports.SalesOrderItemEntity = SalesOrderItemEntity = __decorate([
    (0, typeorm_1.Entity)('sales_order_items'),
    (0, typeorm_1.Unique)('UQ_so_items_so_item_code', ['salesOrderId', 'itemCode'])
], SalesOrderItemEntity);
//# sourceMappingURL=sales-order-item.entity.js.map