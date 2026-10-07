import { AdminPanelService } from './admin-panel.service';
export declare class AdminPanelController {
    private readonly adminPanelService;
    constructor(adminPanelService: AdminPanelService);
    getDashboard(): Promise<{
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
