import { WebhookAdminService } from './webhook-admin.service';
export declare class WebhookAdminController {
    private readonly webhookAdminService;
    constructor(webhookAdminService: WebhookAdminService);
    handleChirpstackWebhook(body: any): Promise<{
        success: boolean;
        source: string;
        devEUI: any;
        fPort: number;
        fCnt: number;
        dr: number;
        adr: boolean;
        data: any;
        payloadHex: string;
        gatewayId: string;
        rssi: number;
        snr: number;
        channel: number;
        frequency: number;
        bandwidth: number;
        spreadingFactor: number;
        decodedData: any;
        telemetryId: string;
        timestamp: Date;
        receivedAt: Date;
    }>;
    handleThingparkWebhook(body: any): Promise<{
        success: boolean;
        source: string;
        devEUI: any;
        fPort: number;
        fCnt: number;
        payloadHex: string;
        decodedData: any;
        telemetryId: string;
        timestamp: Date;
        receivedAt: Date;
    }>;
    getLogs(serverType?: string, search?: string, status?: string, limit?: number, offset?: number): Promise<{
        logs: import(".").WebhookLogEntity[];
        total: number;
        limit: number;
        offset: number;
        chirpstackCount: number;
        thingparkCount: number;
        genericCount: number;
        retentionLimit: number;
    }>;
    getStats(): Promise<{
        totalCount: number;
        chirpstackCount: number;
        thingparkCount: number;
        genericCount: number;
        retentionLimit: number;
        latestPacketAt: any;
    }>;
    clearLogs(serverType?: string): Promise<{
        success: boolean;
        deletedCount: number;
        message: string;
    }>;
    setRetention(limit: number): Promise<{
        success: boolean;
        retentionLimit: number;
        message: string;
    }>;
    simulatePacket(body: {
        serverType: 'CHIRPSTACK' | 'THINGPARK';
        devEUI: string;
        payloadHex: string;
        fPort?: number;
        fCnt?: number;
    }): Promise<{
        success: boolean;
        serverType: string;
        devEUI: string;
        payloadHex: string;
        fPort: number;
        fCnt: number;
        result: any;
        message: string;
    }>;
}
