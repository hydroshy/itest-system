import { Injectable, Logger } from '@nestjs/common';
import { SubsystemHealthStatus, BackendSubsystem } from '../common/subsystem.types';
import { SalesOrdersService } from '../../modules/c-modules/sales-orders/sales-orders.service';
import { ItemCodesService } from '../../modules/c-modules/item-codes/item-codes.service';
import { SensorTypesService } from '../../modules/c-modules/sensor-types/sensor-types.service';

@Injectable()
export class OrderManagementDiagnosticService {
  private readonly logger = new Logger('OrderManagementSubsystem');

  constructor(
    private readonly salesOrdersService: SalesOrdersService,
    private readonly itemCodesService: ItemCodesService,
    private readonly sensorTypesService: SensorTypesService,
  ) {}

  async checkHealth(): Promise<SubsystemHealthStatus> {
    try {
      const soList = await this.salesOrdersService.findAll({ limit: 1 });
      const itemCodesList = await this.itemCodesService.findAll({ limit: 1 });
      const sensorTypesList = await this.sensorTypesService.findAll({ limit: 1 });

      return {
        subsystem: BackendSubsystem.ORDER_MANAGEMENT,
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
    } catch (err: any) {
      this.logger.error(`Order Management diagnostic failed: ${err.message}`, err.stack);
      return {
        subsystem: BackendSubsystem.ORDER_MANAGEMENT,
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }
}
