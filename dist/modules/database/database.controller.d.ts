import { DynamicDatabaseService } from './dynamic-database.service';
export declare class DatabaseController {
    private readonly dbService;
    constructor(dbService: DynamicDatabaseService);
    getDatabaseHealth(): Promise<{
        status: "HEALTHY" | "DEGRADED" | "DOWN";
        timestamp: string;
        totalConnections: number;
        connections: Record<string, any>;
        tableStats: Record<string, {
            routedTo: string;
            recordCount: number;
            status: string;
        }>;
    }>;
    getConnectionStatus(): Promise<{
        table_routes: Record<string, string>;
        connections_status: Record<string, any>;
    }>;
    reloadConfig(): Promise<{
        success: boolean;
        message: string;
        status: {
            table_routes: Record<string, string>;
            connections_status: Record<string, any>;
        };
    }>;
}
