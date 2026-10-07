export declare class SendDownlinkDto {
    devEUI: string;
    fPort?: number;
    payloadHex: string;
    confirmed?: boolean;
    flushQueue?: boolean;
    networkServerId?: string;
}
export declare class FlushQueueDto {
    devEUI: string;
    networkServerId?: string;
}
