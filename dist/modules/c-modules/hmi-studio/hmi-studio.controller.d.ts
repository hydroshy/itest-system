import { HmiStudioService } from './hmi-studio.service';
import { CreateHmiScreenDto, UpdateHmiScreenDto, CloneHmiScreenDto, PublishHmiScreenDto } from './dto/hmi-screen.dto';
export declare class HmiStudioController {
    private readonly hmiStudioService;
    constructor(hmiStudioService: HmiStudioService);
    findAll(): Promise<import(".").HmiScreenEntity[]>;
    findPublished(req: any): Promise<import(".").HmiScreenEntity[]>;
    findOne(id: string): Promise<import(".").HmiScreenEntity>;
    create(dto: CreateHmiScreenDto, req: any): Promise<import(".").HmiScreenEntity>;
    update(id: string, dto: UpdateHmiScreenDto, req: any): Promise<import(".").HmiScreenEntity>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    downlink(body: any, req: any): Promise<{
        success: boolean;
        timestamp: string;
        devEUI?: string;
        fPort: number;
        payloadHex?: string;
        status: string;
        message: string;
        networkServerType?: string;
        networkServerName?: string;
        details?: any;
    }>;
    publish(id: string, dto: PublishHmiScreenDto): Promise<import(".").HmiScreenEntity>;
    clone(id: string, dto: CloneHmiScreenDto, req: any): Promise<import(".").HmiScreenEntity>;
    getTelemetryTrend(devEUIs?: string, from?: string, to?: string, limit?: number): Promise<import("../../lorawan").TelemetryEntity[]>;
    getDeviceTelemetryFields(devEUI: string): Promise<{
        devEUI: string;
        fields: Array<{
            key: string;
            label: string;
            latestValue: any;
            dataType: string;
            unit?: string;
            source: "decoded_payload" | "lora_metric" | "default";
            lastSeen?: Date | string;
        }>;
        lastTelemetryAt?: Date | string;
        totalRecordsScanned: number;
    }>;
}
