import { OnModuleInit } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { NetworkServerEntity } from './entities/network-server.entity';
import { CreateNetworkServerDto, UpdateNetworkServerDto, RegionProfileDto } from './dto/network-server.dto';
import { DeviceEntity } from '../lorawan/entities/device.entity';
import { GatewayEntity } from '../lorawan/entities/gateway.entity';
import { DownlinkLogEntity } from './entities/downlink-log.entity';
import { RealtimeService } from '../realtime/realtime.service';
import { LorawanResilienceService } from '../lorawan/services/lorawan-resilience.service';
export declare class NetworkServersService implements OnModuleInit {
    private readonly dbService;
    private readonly resilienceService;
    private readonly realtimeService?;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService, resilienceService: LorawanResilienceService, realtimeService?: RealtimeService);
    private get serverRepo();
    private get deviceRepo();
    private get gatewayRepo();
    private get downlinkRepo();
    onModuleInit(): Promise<void>;
    private ensureDownlinkLogsTable;
    create(dto: CreateNetworkServerDto): Promise<NetworkServerEntity>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<NetworkServerEntity>;
    update(id: string, dto: UpdateNetworkServerDto): Promise<NetworkServerEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    addOrUpdateRegionProfile(id: string, profileDto: RegionProfileDto): Promise<NetworkServerEntity>;
    deleteRegionProfile(id: string, profileId: string): Promise<NetworkServerEntity>;
    testConnection(id: string): Promise<{
        success: boolean;
        serverType: string;
        serverName: string;
        apiUrl?: string;
        latencyMs: number;
        message: string;
        details: any;
    }>;
    getLinkedDevices(id: string): Promise<DeviceEntity[]>;
    getLinkedGateways(id: string): Promise<GatewayEntity[]>;
    sendDownlink(params: {
        devEUI: string;
        fPort?: number;
        payloadHex?: string;
        confirmed?: boolean;
        flushQueue?: boolean;
        author?: string;
        networkServerId?: string;
    }): Promise<{
        success: boolean;
        status: string;
        message: string;
        devEUI: string;
        fPort: number;
        payloadHex: string;
        networkServerType?: string;
        networkServerName?: string;
        details?: any;
        downlinkLog?: DownlinkLogEntity;
    }>;
    getDownlinkHistory(params?: {
        devEUI?: string;
        limit?: number;
    }): Promise<DownlinkLogEntity[]>;
    flushDeviceQueue(params: {
        devEUI: string;
        networkServerId?: string;
        author?: string;
    }): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }>;
    getDeviceQueue(params: {
        devEUI: string;
        networkServerId?: string;
    }): Promise<{
        totalCount: number;
        items: Array<{
            id?: string;
            fPort: number;
            confirmed: boolean;
            payloadHex: string;
            isPending?: boolean;
            fCntDown?: number;
            createdAt?: any;
        }>;
        serverType: string;
        serverName?: string;
    }>;
}
