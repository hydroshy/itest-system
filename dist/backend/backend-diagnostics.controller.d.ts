import { BackendSubsystem, DomainDiagnosticReport } from './common/subsystem.types';
import { DatabaseDiagnosticService } from './database/database-diagnostic.service';
import { IdentityDiagnosticService } from './identity/identity-diagnostic.service';
import { RealtimeDiagnosticService } from './realtime/realtime-diagnostic.service';
import { PluginManagerService } from './plugins/plugin-manager.service';
export declare class BackendDiagnosticsController {
    private readonly dbDiagnostic;
    private readonly identityDiagnostic;
    private readonly realtimeDiagnostic;
    private readonly pluginManager;
    constructor(dbDiagnostic: DatabaseDiagnosticService, identityDiagnostic: IdentityDiagnosticService, realtimeDiagnostic: RealtimeDiagnosticService, pluginManager: PluginManagerService);
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
