"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderManagementSubsystemModule = void 0;
const common_1 = require("@nestjs/common");
const sales_orders_module_1 = require("../../modules/c-modules/sales-orders/sales-orders.module");
const item_codes_module_1 = require("../../modules/c-modules/item-codes/item-codes.module");
const sensor_types_module_1 = require("../../modules/c-modules/sensor-types/sensor-types.module");
const traceability_module_1 = require("../../modules/c-modules/traceability/traceability.module");
const order_management_diagnostic_service_1 = require("./order-management-diagnostic.service");
let OrderManagementSubsystemModule = class OrderManagementSubsystemModule {
};
exports.OrderManagementSubsystemModule = OrderManagementSubsystemModule;
exports.OrderManagementSubsystemModule = OrderManagementSubsystemModule = __decorate([
    (0, common_1.Module)({
        imports: [sales_orders_module_1.SalesOrdersModule, item_codes_module_1.ItemCodesModule, sensor_types_module_1.SensorTypesModule, traceability_module_1.TraceabilityModule],
        providers: [order_management_diagnostic_service_1.OrderManagementDiagnosticService],
        exports: [
            sales_orders_module_1.SalesOrdersModule,
            item_codes_module_1.ItemCodesModule,
            sensor_types_module_1.SensorTypesModule,
            traceability_module_1.TraceabilityModule,
            order_management_diagnostic_service_1.OrderManagementDiagnosticService,
        ],
    })
], OrderManagementSubsystemModule);
//# sourceMappingURL=order-management.module.js.map