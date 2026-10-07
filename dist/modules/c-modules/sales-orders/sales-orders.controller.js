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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
const sales_orders_service_1 = require("./sales-orders.service");
const sales_order_dto_1 = require("./dto/sales-order.dto");
const csv_import_dto_1 = require("./dto/csv-import.dto");
const odoo_api_sync_dto_1 = require("./dto/odoo-api-sync.dto");
let SalesOrdersController = class SalesOrdersController {
    constructor(service) {
        this.service = service;
    }
    async findAll(query) {
        return await this.service.findAll(query);
    }
    async resolveTemplate(sku, firmwareVersion) {
        return await this.service.resolveTestTemplate(sku, firmwareVersion);
    }
    async getItemTestStatus(soCode, itemCode) {
        return await this.service.getItemTestStatus(soCode, itemCode);
    }
    async findOne(id) {
        return await this.service.findOne(id);
    }
    async create(dto, user) {
        const author = user?.username || user?.fullName || 'admin';
        return await this.service.create(dto, author);
    }
    async update(id, dto) {
        return await this.service.update(id, dto);
    }
    async remove(id) {
        return await this.service.remove(id);
    }
    async attachItems(id, dto) {
        return await this.service.attachItems(id, dto);
    }
    async importOdooJson(payload, user) {
        const author = user?.username || user?.fullName || 'odoo-sync';
        return await this.service.importOdooJson(payload, author);
    }
    async importCsv(dto, user) {
        const author = user?.username || user?.fullName || 'csv-import';
        return await this.service.importCsv(dto, author);
    }
    async syncOdooApi(dto, user) {
        const author = user?.username || user?.fullName || 'odoo-api';
        return await this.service.syncOdooApi(dto, author);
    }
};
exports.SalesOrdersController = SalesOrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List sales orders with pagination, search, and status/source filters' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_order_dto_1.QuerySalesOrderDto]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('mapping/test-template'),
    (0, swagger_1.ApiOperation)({ summary: 'Auto-detect test template by SKU and firmware version' }),
    (0, swagger_1.ApiQuery)({ name: 'sku', required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'firmwareVersion', required: false, type: String }),
    __param(0, (0, common_1.Query)('sku')),
    __param(1, (0, common_1.Query)('firmwareVersion')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "resolveTemplate", null);
__decorate([
    (0, common_1.Get)(':soCode/items/:itemCode/test-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get real-time test progress & pass/fail counts from D-Module test_sessions' }),
    __param(0, (0, common_1.Param)('soCode')),
    __param(1, (0, common_1.Param)('itemCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "getItemTestStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single sales order by UUID or soCode' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create manual sales order with item codes' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sales_order_dto_1.CreateSalesOrderDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update sales order details and items' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_order_dto_1.UpdateSalesOrderDto]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete sales order (cascades to items)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/attach-items'),
    (0, swagger_1.ApiOperation)({ summary: 'Attach one or multiple catalog items into an existing Sales Order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_order_dto_1.AttachItemCodesDto]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "attachItems", null);
__decorate([
    (0, common_1.Post)('import/odoo-json'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Import sales order from Odoo JSON payload (webhook or direct export)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "importOdooJson", null);
__decorate([
    (0, common_1.Post)('import/csv'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Import sales orders and items from raw CSV content' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [csv_import_dto_1.CsvImportDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Post)('import/odoo-api'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Sync sales order directly from remote Odoo ERP by soCode or odooId' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [odoo_api_sync_dto_1.OdooApiSyncDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], SalesOrdersController.prototype, "syncOdooApi", null);
exports.SalesOrdersController = SalesOrdersController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: Sales Orders & Items'),
    (0, common_1.Controller)(['api/sales-orders', 'api/c-modules/sales-orders']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [sales_orders_service_1.SalesOrdersService])
], SalesOrdersController);
//# sourceMappingURL=sales-orders.controller.js.map