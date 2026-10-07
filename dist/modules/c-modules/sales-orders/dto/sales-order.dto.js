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
exports.AttachItemCodesDto = exports.AttachItemCodeLineDto = exports.QuerySalesOrderDto = exports.UpdateSalesOrderDto = exports.UpdateSalesOrderItemDto = exports.CreateSalesOrderDto = exports.CreateSalesOrderItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const sales_order_entity_1 = require("../entities/sales-order.entity");
const sales_order_item_entity_1 = require("../entities/sales-order-item.entity");
class CreateSalesOrderItemDto {
    constructor() {
        this.quantity = 1;
        this.firmwareVersion = '1';
    }
}
exports.CreateSalesOrderItemDto = CreateSalesOrderItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Catalog Item Code UUID (if selecting existing)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderItemDto.prototype, "itemCodeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Item Code within SO (e.g. ITEM-001, WSLRW-ATH-01)', example: 'ITEM-001' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderItemDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device SKU (e.g. WSLRW-ATH)', example: 'WSLRW-ATH' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderItemDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ordered quantity', example: 10, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateSalesOrderItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target firmware version', example: '1', default: '1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderItemDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Explicit Test Template UUID (optional, auto-mapped if omitted)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSalesOrderItemDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Line item remarks' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderItemDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Line item metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateSalesOrderItemDto.prototype, "metadata", void 0);
class CreateSalesOrderDto {
    constructor() {
        this.status = sales_order_entity_1.SalesOrderStatus.DRAFT;
        this.source = sales_order_entity_1.SalesOrderSource.MANUAL;
    }
}
exports.CreateSalesOrderDto = CreateSalesOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unique Sales Order code (e.g. SO-2026-001)', example: 'SO-2026-001' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "soCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Customer or partner name', example: 'Daviteq IoT Corp' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "customer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Order date ISO string', example: '2026-09-20T00:00:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "orderDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_order_entity_1.SalesOrderStatus, default: sales_order_entity_1.SalesOrderStatus.DRAFT }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_order_entity_1.SalesOrderStatus),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_order_entity_1.SalesOrderSource, default: sales_order_entity_1.SalesOrderSource.MANUAL }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_order_entity_1.SalesOrderSource),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Remote Odoo sale.order ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateSalesOrderDto.prototype, "odooId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Order remarks' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalesOrderDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Extra metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateSalesOrderDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreateSalesOrderItemDto], description: 'List of items in Sales Order' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSalesOrderItemDto),
    __metadata("design:type", Array)
], CreateSalesOrderDto.prototype, "items", void 0);
class UpdateSalesOrderItemDto {
}
exports.UpdateSalesOrderItemDto = UpdateSalesOrderItemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Item ID for updating existing item' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateSalesOrderItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Catalog Item Code UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateSalesOrderItemDto.prototype, "itemCodeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Item Code' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSalesOrderItemDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device SKU' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSalesOrderItemDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantity' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateSalesOrderItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target firmware version' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSalesOrderItemDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Template UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateSalesOrderItemDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of tested units' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateSalesOrderItemDto.prototype, "testedQuantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of passed units' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateSalesOrderItemDto.prototype, "passedQuantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of failed units' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateSalesOrderItemDto.prototype, "failedQuantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_order_item_entity_1.SalesOrderItemStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_order_item_entity_1.SalesOrderItemStatus),
    __metadata("design:type", String)
], UpdateSalesOrderItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSalesOrderItemDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateSalesOrderItemDto.prototype, "metadata", void 0);
class UpdateSalesOrderDto {
}
exports.UpdateSalesOrderDto = UpdateSalesOrderDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sales Order Code' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSalesOrderDto.prototype, "soCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Customer Name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSalesOrderDto.prototype, "customer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Order Date' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateSalesOrderDto.prototype, "orderDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_order_entity_1.SalesOrderStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_order_entity_1.SalesOrderStatus),
    __metadata("design:type", String)
], UpdateSalesOrderDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_order_entity_1.SalesOrderSource }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(sales_order_entity_1.SalesOrderSource),
    __metadata("design:type", String)
], UpdateSalesOrderDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Odoo ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateSalesOrderDto.prototype, "odooId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSalesOrderDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateSalesOrderDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [UpdateSalesOrderItemDto], description: 'Items' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateSalesOrderItemDto),
    __metadata("design:type", Array)
], UpdateSalesOrderDto.prototype, "items", void 0);
class QuerySalesOrderDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.QuerySalesOrderDto = QuerySalesOrderDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuerySalesOrderDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuerySalesOrderDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search keyword for soCode or customer' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_order_entity_1.SalesOrderStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: sales_order_entity_1.SalesOrderSource }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuerySalesOrderDto.prototype, "source", void 0);
class AttachItemCodeLineDto {
    constructor() {
        this.quantity = 1;
    }
}
exports.AttachItemCodeLineDto = AttachItemCodeLineDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Catalog Item Code UUID (if selecting existing)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AttachItemCodeLineDto.prototype, "itemCodeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Item Code identifier', example: 'ITEM-WSLRW-ATH-01' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachItemCodeLineDto.prototype, "itemCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device SKU' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachItemCodeLineDto.prototype, "sku", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Target firmware version without v prefix' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachItemCodeLineDto.prototype, "firmwareVersion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Ordered quantity', example: 50, default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AttachItemCodeLineDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Test Template UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AttachItemCodeLineDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Line item remarks' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachItemCodeLineDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metadata' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], AttachItemCodeLineDto.prototype, "metadata", void 0);
class AttachItemCodesDto {
}
exports.AttachItemCodesDto = AttachItemCodesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AttachItemCodeLineDto], description: 'List of items to attach' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AttachItemCodeLineDto),
    __metadata("design:type", Array)
], AttachItemCodesDto.prototype, "items", void 0);
//# sourceMappingURL=sales-order.dto.js.map