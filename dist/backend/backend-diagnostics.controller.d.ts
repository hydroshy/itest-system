import { BackendSubsystem, DomainDiagnosticReport } from './common/subsystem.types';
import { DatabaseDiagnosticService } from './database/database-diagnostic.service';
import { LorawanDiagnosticService } from './lorawan/lorawan-diagnostic.service';
import { OrderManagementDiagnosticService } from './order-management/order-management-diagnostic.service';
import { TestAutomationDiagnosticService } from './test-automation/test-automation-diagnostic.service';
import { IdentityDiagnosticService } from './identity/identity-diagnostic.service';
import { IndustrialIotDiagnosticService } from './industrial-iot/industrial-iot-diagnostic.service';
import { RealtimeDiagnosticService } from './realtime/realtime-diagnostic.service';
export declare class BackendDiagnosticsController {
    private readonly dbDiagnostic;
    private readonly lorawanDiagnostic;
    private readonly orderManagementDiagnostic;
    private readonly testAutomationDiagnostic;
    private readonly identityDiagnostic;
    private readonly industrialIotDiagnostic;
    private readonly realtimeDiagnostic;
    constructor(dbDiagnostic: DatabaseDiagnosticService, lorawanDiagnostic: LorawanDiagnosticService, orderManagementDiagnostic: OrderManagementDiagnosticService, testAutomationDiagnostic: TestAutomationDiagnosticService, identityDiagnostic: IdentityDiagnosticService, industrialIotDiagnostic: IndustrialIotDiagnosticService, realtimeDiagnostic: RealtimeDiagnosticService);
    getDiagnostics(): Promise<DomainDiagnosticReport>;
    getSubsystemDirectory(): {
        architecture: string;
        version: string;
        subsystems: {
            id: BackendSubsystem;
            name: string;
            routes: string[];
            description: string;
        }[];
    };
}
