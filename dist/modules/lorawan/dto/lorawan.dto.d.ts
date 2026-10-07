export declare class RegisterDeviceDto {
    devEUI: string;
    name: string;
    appEUI?: string;
    appKey?: string;
    activationType?: string;
    networkServerId?: string;
    regionProfileId?: string;
    decoderId?: string;
    itemCodeId?: string;
    salesOrderId?: string;
    sku?: string;
    firmwareVersion?: string;
    payloadFormatterScript?: string;
    provisionTarget?: 'SERVER' | 'LOCAL';
    region?: string;
    isActive?: boolean;
}
export declare class RegisterGatewayDto {
    gatewayEUI: string;
    name: string;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    status?: string;
    networkServerId?: string;
    regionProfileId?: string;
}
export declare class UplinkPayloadDto {
    devEUI: string;
    payloadHex: string;
    fPort?: number;
    fCnt?: number;
}
export declare class TestPayloadFormatterDto {
    script: string;
    bytesHex: string;
    fPort?: number;
}
