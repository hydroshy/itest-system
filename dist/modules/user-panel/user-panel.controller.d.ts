import { UserPanelService } from './user-panel.service';
export declare class UserPanelController {
    private readonly userPanelService;
    constructor(userPanelService: UserPanelService);
    getDashboard(user: any): Promise<{
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
