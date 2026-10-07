export declare class DownlinkLogEntity {
    id: string;
    devEUI: string;
    deviceName?: string;
    networkServerId?: string;
    networkServerName?: string;
    serverType: string;
    fPort: number;
    payloadHex: string;
    confirmed: boolean;
    flushQueue: boolean;
    status: string;
    errorMessage?: string;
    responseDetails?: any;
    sentBy: string;
    createdAt: Date;
}
