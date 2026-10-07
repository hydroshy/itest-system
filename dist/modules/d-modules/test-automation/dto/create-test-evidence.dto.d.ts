export declare class CreateTestEvidenceDto {
    sessionId?: string;
    deviceRunId?: string;
    sessionCode?: string;
    soCode?: string;
    itemCode?: string;
    devEUI: string;
    serialNumber?: string;
    sku: string;
    firmwareVersion?: string;
    hardwareVersion?: string;
    payloadHex: string;
    decodedFields: Record<string, any>;
    assertionResults?: any[];
    verdict?: string;
    failureReason?: string;
    fPort?: number;
    fCnt?: number;
    rssi?: number;
    snr?: number;
    batteryVoltage?: number;
    operatorUsername?: string;
    metadata?: Record<string, any>;
}
