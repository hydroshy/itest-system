import { NetworkServersService } from './network-servers.service';
import { CreateNetworkServerDto, UpdateNetworkServerDto, RegionProfileDto } from './dto/network-server.dto';
import { SendDownlinkDto, FlushQueueDto } from './dto/downlink.dto';
export declare class NetworkServersController {
    private readonly networkServersService;
    constructor(networkServersService: NetworkServersService);
    findAll(): Promise<any[]>;
    getDownlinkHistory(devEUI?: string, limit?: number): Promise<import("./entities/downlink-log.entity").DownlinkLogEntity[]>;
    getDeviceQueue(devEUI: string, networkServerId?: string): Promise<{
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
    sendDownlink(dto: SendDownlinkDto, req: any): Promise<{
        success: boolean;
        status: string;
        message: string;
        devEUI: string;
        fPort: number;
        payloadHex: string;
        networkServerType?: string;
        networkServerName?: string;
        details?: any;
        downlinkLog?: import("./entities/downlink-log.entity").DownlinkLogEntity;
    }>;
    flushQueue(dto: FlushQueueDto, req: any): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }>;
    findOne(id: string): Promise<import("./entities/network-server.entity").NetworkServerEntity>;
    create(dto: CreateNetworkServerDto): Promise<import("./entities/network-server.entity").NetworkServerEntity>;
    update(id: string, dto: UpdateNetworkServerDto): Promise<import("./entities/network-server.entity").NetworkServerEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    testConnection(id: string): Promise<{
        success: boolean;
        serverType: string;
        serverName: string;
        apiUrl?: string;
        latencyMs: number;
        message: string;
        details: any;
    }>;
    addRegionProfile(id: string, regionDto: RegionProfileDto): Promise<import("./entities/network-server.entity").NetworkServerEntity>;
    deleteRegionProfile(id: string, regionId: string): Promise<import("./entities/network-server.entity").NetworkServerEntity>;
    getLinkedDevices(id: string): Promise<import("../lorawan").DeviceEntity[]>;
    getLinkedGateways(id: string): Promise<import("../lorawan").GatewayEntity[]>;
}
