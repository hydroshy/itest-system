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
exports.OrderManagementDiagnosticService = void 0;
const common_1 = require("@nestjs/common");
const subsystem_types_1 = require("../common/subsystem.types");
const sales_orders_service_1 = require("../../modules/c-modules/sales-orders/sales-orders.service");
const item_codes_service_1 = require("../../modules/c-modules/item-codes/item-codes.service");
const sensor_types_service_1 = require("../../modules/c-modules/sensor-types/sensor-types.service");
let OrderManagementDiagnosticService = class OrderManagementDiagnosticService {
    constructor(salesOrdersService, itemCodesService, sensorTypesService) {
        this.salesOrdersService = salesOrdersService;
        this.itemCodesService = itemCodesService;
        this.sensorTypesService = sensorTypesService;
        this.logger = new common_1.Logger('OrderManagementSubsystem');
    }
    async checkHealth() {
        try {
            const soList = await this.salesOrdersService.findAll({ limit: 1 });
            const itemCodesList = await this.itemCodesService.findAll({ limit: 1 });
            const sensorTypesList = await this.sensorTypesService.findAll({ limit: 1 });
            return {
                subsystem: subsystem_types_1.BackendSubsystem.ORDER_MANAGEMENT,
                status: 'UP',
                timestamp: new Date().toISOString(),
                details: {
                    totalSalesOrders: soList.total ?? soList.data?.length ?? 0,
                    totalItemCodes: itemCodesList.total ?? itemCodesList.data?.length ?? 0,
                    totalSensorTypes: sensorTypesList.total ?? sensorTypesList.data?.length ?? 0,
                    subsystemScope: ['sales-orders (SO)', 'item-codes (SKU)', 'sensor-types'],
                },
                error: null,
            };
        }
        catch (err) {
            this.logger.error(`Order Management diagnostic failed: ${err.message}`, err.stack);
            return {
                subsystem: subsystem_types_1.BackendSubsystem.ORDER_MANAGEMENT,
                status: 'DEGRADED',
                timestamp: new Date().toISOString(),
                error: err.message,
            };
        }
    }
};
exports.OrderManagementDiagnosticService = OrderManagementDiagnosticService;
exports.OrderManagementDiagnosticService = OrderManagementDiagnosticService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_orders_service_1.SalesOrdersService,
        item_codes_service_1.ItemCodesService,
        sensor_types_service_1.SensorTypesService])
], OrderManagementDiagnosticService);
//# sourceMappingURL=order-management-diagnostic.service.js.map