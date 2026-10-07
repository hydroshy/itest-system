import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { WebhookLogEntity } from './entities/webhook-log.entity';
import { LorawanService } from '../../lorawan/lorawan.service';
export interface CreateWebhookLogInput {
    serverType: string;
    devEUI: string;
    fPort?: number;
    fCnt?: number;
    payloadHex?: string;
    decodedData?: Record<string, any>;
    rawPayload?: Record<string, any>;
    status?: string;
    errorMessage?: string;
}
export declare class WebhookAdminService {
    private readonly dbService;
    private readonly lorawanService;
    private readonly logger;
    private retentionLimit;
    constructor(dbService: DynamicDatabaseService, lorawanService: LorawanService);
    private get logRepo();
    logPacket(data: CreateWebhookLogInput): Promise<WebhookLogEntity>;
    autoPruneOldLogs(serverType: string): Promise<number>;
    getLogs(query: {
        serverType?: string;
        search?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        logs: WebhookLogEntity[];
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
    setRetentionLimit(limit: number): Promise<{
        success: boolean;
        retentionLimit: number;
        message: string;
    }>;
    simulatePacket(dto: {
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
}
