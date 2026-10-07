import { DynamicDatabaseService } from '../database/dynamic-database.service';
export declare class UserPanelService {
    private readonly dbService;
    constructor(dbService: DynamicDatabaseService);
    getUserDashboard(userId: string): Promise<{
        userId: string;
        totalDevices: number;
        activeDevices: number;
        devicesSummary: {
            devEUI: string;
            name: string;
            active: boolean;
        }[];
    }>;
}
