import { DynamicDatabaseService } from '../database/dynamic-database.service';
export declare class AdminPanelService {
    private readonly dbService;
    constructor(dbService: DynamicDatabaseService);
    getDashboardStats(): Promise<{
        systemStatus: string;
        uptime: number;
        dbConnections: {
            table_routes: Record<string, string>;
            connections_status: Record<string, any>;
        };
        timestamp: string;
    }>;
    reloadDbConfig(): Promise<{
        message: string;
        dbStatus: {
            table_routes: Record<string, string>;
            connections_status: Record<string, any>;
        };
    }>;
}
