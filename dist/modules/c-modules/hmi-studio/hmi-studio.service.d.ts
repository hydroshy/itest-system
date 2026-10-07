import { OnModuleInit } from '@nestjs/common';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { NetworkServersService } from '../../network-servers/network-servers.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { HmiScreenEntity } from './entities/hmi-screen.entity';
import { TelemetryEntity } from '../../lorawan/entities/telemetry.entity';
import { CreateHmiScreenDto, UpdateHmiScreenDto, CloneHmiScreenDto, PublishHmiScreenDto } from './dto/hmi-screen.dto';
export declare class HmiStudioService implements OnModuleInit {
    private readonly dynamicDatabaseService;
    private readonly networkServersService;
    private readonly realtimeService;
    private readonly logger;
    constructor(dynamicDatabaseService: DynamicDatabaseService, networkServersService: NetworkServersService, realtimeService: RealtimeService);
    onModuleInit(): Promise<void>;
    private getRepository;
    findAll(): Promise<HmiScreenEntity[]>;
    findPublished(userRole?: string): Promise<HmiScreenEntity[]>;
    findOne(id: string): Promise<HmiScreenEntity>;
    create(dto: CreateHmiScreenDto, author?: string): Promise<HmiScreenEntity>;
    update(id: string, dto: UpdateHmiScreenDto, author?: string): Promise<HmiScreenEntity>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    publish(id: string, dto: PublishHmiScreenDto): Promise<HmiScreenEntity>;
    clone(id: string, dto: CloneHmiScreenDto, author?: string): Promise<HmiScreenEntity>;
    executeDownlink(body: {
        devEUI?: string;
        fPort?: number;
        payloadHex?: string;
        actionType?: string;
        confirmed?: boolean;
    }, user?: any): Promise<{
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
    getTelemetryTrend(query: {
        devEUIs?: string[];
        from?: string;
        to?: string;
        limit?: number;
    }): Promise<TelemetryEntity[]>;
    getDeviceTelemetryFields(devEUI: string): Promise<{
        devEUI: string;
        fields: Array<{
            key: string;
            label: string;
            latestValue: any;
            dataType: string;
            unit?: string;
            source: 'decoded_payload' | 'lora_metric' | 'default';
            lastSeen?: Date | string;
        }>;
        lastTelemetryAt?: Date | string;
        totalRecordsScanned: number;
    }>;
    private seedSampleScreen;
}
