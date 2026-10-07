import { TestDeviceRunEntity } from './test-device-run.entity';
export declare class TestPacketLogEntity {
    id: string;
    deviceRunId: string;
    deviceRun: TestDeviceRunEntity;
    devEUI: string;
    fPort: number;
    fCnt: number;
    payloadHex: string;
    decodedData?: Record<string, any>;
    assertionResults: Array<{
        fieldName: string;
        operator: string;
        expectedValue?: any;
        actualValue?: any;
        pass: boolean;
        severity?: string;
        message?: string;
    }>;
    isPass: boolean;
    rssi?: number;
    snr?: number;
    gatewayId?: string;
    receivedAt: Date;
}
