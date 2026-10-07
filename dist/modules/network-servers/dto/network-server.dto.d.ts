import { NetworkServerType } from '../entities/network-server.entity';
export declare class RegionProfileDto {
    id: string;
    name: string;
    region: string;
    routeRef?: string;
    profileId?: string;
    frequencyBand?: string;
    description?: string;
    isActive?: boolean;
}
export declare class CreateNetworkServerDto {
    name: string;
    type: NetworkServerType;
    description?: string;
    apiUrl?: string;
    apiKey?: string;
    routeRef?: string;
    applicationId?: string;
    regionProfiles?: RegionProfileDto[];
    status?: string;
    isDefault?: boolean;
    metadata?: Record<string, any>;
}
export declare class UpdateNetworkServerDto {
    name?: string;
    type?: NetworkServerType;
    description?: string;
    apiUrl?: string;
    apiKey?: string;
    routeRef?: string;
    applicationId?: string;
    regionProfiles?: RegionProfileDto[];
    status?: string;
    isDefault?: boolean;
    metadata?: Record<string, any>;
}
