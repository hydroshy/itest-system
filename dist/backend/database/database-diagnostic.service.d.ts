import { SubsystemHealthStatus } from '../common/subsystem.types';
import { DynamicDatabaseService } from './dynamic-database.service';
export declare class DatabaseDiagnosticService {
    private readonly dbService;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService);
    checkHealth(): Promise<SubsystemHealthStatus>;
}
