import { Module } from '@nestjs/common';
import { SalesOrdersModule } from '../../modules/c-modules/sales-orders/sales-orders.module';
import { ItemCodesModule } from '../../modules/c-modules/item-codes/item-codes.module';
import { SensorTypesModule } from '../../modules/c-modules/sensor-types/sensor-types.module';
import { OrderManagementDiagnosticService } from './order-management-diagnostic.service';

/**
 * Order Management Domain Subsystem
 * Unifies Sales Orders (SO), Item Codes / SKU Catalog, and Sensor Type specifications.
 */
@Module({
  imports: [SalesOrdersModule, ItemCodesModule, SensorTypesModule],
  providers: [OrderManagementDiagnosticService],
  exports: [
    SalesOrdersModule,
    ItemCodesModule,
    SensorTypesModule,
    OrderManagementDiagnosticService,
  ],
})
export class OrderManagementSubsystemModule {}
