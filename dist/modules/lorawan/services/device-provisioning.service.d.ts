import { NetworkServerEntity, NetworkServerType, RegionProfile } from '../../network-servers/entities/network-server.entity';
import { RegisterDeviceDto } from '../dto/lorawan.dto';
import { LorawanResilienceService } from './lorawan-resilience.service';
export interface ProvisioningStepResult {
    step: number;
    stepName: string;
    endpoint: string;
    method: string;
    status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'SKIPPED';
    httpStatus?: number;
    message: string;
    payload?: any;
    response?: any;
}
export interface ProvisioningResult {
    success: boolean;
    serverType: NetworkServerType;
    serverName: string;
    totalSteps: number;
    steps: ProvisioningStepResult[];
    syncStatus: 'SYNCED' | 'LOCAL' | 'FAILED';
    summaryMessage: string;
    errorMessage?: string;
}
export declare class DeviceProvisioningService {
    private readonly resilienceService;
    private readonly logger;
    constructor(resilienceService: LorawanResilienceService);
    provisionDevice(server: NetworkServerEntity, regionProfile: RegionProfile | undefined, dto: RegisterDeviceDto, isEdit?: boolean): Promise<ProvisioningResult>;
    private discoverChirpstackApplicationId;
    private discoverChirpstackDeviceProfileId;
    private provisionChirpstack;
    private provisionThingpark;
    checkDeviceHealth(server: NetworkServerEntity, devEui: string): Promise<{
        success: boolean;
        isOnline: boolean;
        lastSeenAt: string | null;
        deviceStatus?: any;
        message: string;
    }>;
    deprovisionDevice(server: NetworkServerEntity, devEui: string): Promise<any>;
}
