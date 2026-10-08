import { Module } from '@nestjs/common';
import { SalesOrdersModule } from '../../modules/c-modules/sales-orders/sales-orders.module';
import { ItemCodesModule } from '../../modules/c-modules/item-codes/item-codes.module';
import { SensorTypesModule } from '../../modules/c-modules/sensor-types/sensor-types.module';
import { TraceabilityModule } from '../../modules/c-modules/traceability/traceability.module';
import { FinalConfigManagerModule } from '../../modules/c-modules/final-config-manager/final-config-manager.module';
import { OrderManagementDiagnosticService } from './order-management-diagnostic.service';

/**
 * Order Management Domain Subsystem
 * Unifies Sales Orders (SO), Item Codes / SKU Catalog, Sensor Type specifications, Traceability (T-Module), and Final Config Manager.
 */
@Module({
  imports: [SalesOrdersModule, ItemCodesModule, SensorTypesModule, TraceabilityModule, FinalConfigManagerModule],
  providers: [OrderManagementDiagnosticService],
  exports: [
    SalesOrdersModule,
    ItemCodesModule,
    SensorTypesModule,
    TraceabilityModule,
    FinalConfigManagerModule,
    OrderManagementDiagnosticService,
  ],
})
export class OrderManagementSubsystemModule {}
