import { NetworkServerEntity } from '../../network-servers/entities/network-server.entity';
export declare class GatewayEntity {
    id: string;
    gatewayEUI: string;
    name: string;
    networkServerId: string;
    regionProfileId: string;
    networkServer?: NetworkServerEntity;
    latitude: number;
    longitude: number;
    altitude: number;
    status: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}
