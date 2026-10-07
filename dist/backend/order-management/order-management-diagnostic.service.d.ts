import { SubsystemHealthStatus } from '../common/subsystem.types';
import { SalesOrdersService } from '../../modules/c-modules/sales-orders/sales-orders.service';
import { ItemCodesService } from '../../modules/c-modules/item-codes/item-codes.service';
import { SensorTypesService } from '../../modules/c-modules/sensor-types/sensor-types.service';
export declare class OrderManagementDiagnosticService {
    private readonly salesOrdersService;
    private readonly itemCodesService;
    private readonly sensorTypesService;
    private readonly logger;
    constructor(salesOrdersService: SalesOrdersService, itemCodesService: ItemCodesService, sensorTypesService: SensorTypesService);
    checkHealth(): Promise<SubsystemHealthStatus>;
}
