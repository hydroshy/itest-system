export declare class TelemetryEntity {
    id: string;
    timestamp: Date;
    devEui: string;
    fPort: number;
    fCnt: number;
    dr?: number;
    adr?: boolean;
    data?: string;
    payloadHex: string;
    gatewayId?: string;
    rssi?: number;
    snr?: number;
    channel?: number;
    frequency?: number;
    bandwidth?: number;
    spreadingFactor?: number;
    tenantId?: string;
    applicationId?: string;
    deviceName?: string;
    deviceProfileName?: string;
    devAddr?: string;
    object?: Record<string, any>;
    decodedData?: Record<string, any>;
    serverType: string;
    receivedAt: Date;
    get devEUI(): string;
    set devEUI(value: string);
}
