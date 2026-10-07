export declare class WebhookLogEntity {
    id: string;
    serverType: string;
    devEUI: string;
    fPort: number;
    fCnt: number;
    payloadHex: string;
    decodedData: Record<string, any>;
    rawPayload: Record<string, any>;
    status: string;
    errorMessage?: string;
    receivedAt: Date;
}
