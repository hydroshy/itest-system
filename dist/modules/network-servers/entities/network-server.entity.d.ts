export declare enum NetworkServerType {
    THINGPARK = "THINGPARK",
    CHIRPSTACK = "CHIRPSTACK"
}
export interface RegionProfile {
    id: string;
    name: string;
    region: string;
    routeRef?: string;
    profileId?: string;
    frequencyBand?: string;
    description?: string;
    isActive?: boolean;
}
export declare class NetworkServerEntity {
    id: string;
    name: string;
    type: NetworkServerType;
    description: string;
    apiUrl: string;
    apiKey: string;
    routeRef: string;
    applicationId: string;
    regionProfiles: RegionProfile[];
    status: string;
    isDefault: boolean;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
