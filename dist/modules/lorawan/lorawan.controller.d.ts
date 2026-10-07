import { LorawanService } from './lorawan.service';
import { RegisterDeviceDto, RegisterGatewayDto, UplinkPayloadDto, TestPayloadFormatterDto } from './dto/lorawan.dto';
export declare class LorawanController {
    private readonly lorawanService;
    constructor(lorawanService: LorawanService);
    registerDevice(body: RegisterDeviceDto, user: any): Promise<{
        success: boolean;
        device: import(".").DeviceEntity;
        provisioning?: import(".").ProvisioningResult;
        message: string;
    }>;
    registerGateway(body: RegisterGatewayDto): Promise<import(".").GatewayEntity>;
    updatePayloadFormatter(devEUI: string, script: string): Promise<import(".").DeviceEntity>;
    handleUplink(body: UplinkPayloadDto): Promise<{
        success: boolean;
        devEUI: string;
        decodedData: {};
        telemetry: import(".").TelemetryEntity;
    }>;
    handleChirpstackWebhook(body: any): Promise<{
        success: boolean;
        source: string;
        devEUI: any;
        fPort: number;
        fCnt: number;
        dr: number;
        adr: boolean;
        data: any;
        payloadHex: string;
        gatewayId: string;
        rssi: number;
        snr: number;
        channel: number;
        frequency: number;
        bandwidth: number;
        spreadingFactor: number;
        decodedData: any;
        telemetryId: string;
        timestamp: Date;
        receivedAt: Date;
    }>;
    handleThingparkWebhook(body: any): Promise<{
        success: boolean;
        source: string;
        devEUI: any;
        fPort: number;
        fCnt: number;
        payloadHex: string;
        decodedData: any;
        telemetryId: string;
        timestamp: Date;
        receivedAt: Date;
    }>;
    testPayloadFormatter(body: TestPayloadFormatterDto): Record<string, any>;
    listDevices(user: any): Promise<any[]>;
    findOneDevice(devEUI: string, user: any): Promise<import(".").DeviceEntity>;
    updateDevice(devEUI: string, body: Partial<RegisterDeviceDto>, user: any): Promise<{
        success: boolean;
        device: import(".").DeviceEntity;
        provisioning?: import(".").ProvisioningResult;
        message: string;
    }>;
    deleteDevice(devEUI: string, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    syncDevice(devEUI: string, user: any): Promise<{
        success: boolean;
        provisioning: import(".").ProvisioningResult;
        device: import(".").DeviceEntity;
    }>;
    checkDeviceHealth(devEUI: string, user: any): Promise<{
        success: boolean;
        device: import(".").DeviceEntity;
        health: {
            isOnline: boolean;
            lastSeenAt: string | null;
            deviceStatus?: any;
            message: string;
        };
    }>;
    listGateways(): Promise<import(".").GatewayEntity[]>;
    getTelemetry(devEUI?: string, devEUIs?: string, from?: string, to?: string, order?: 'ASC' | 'DESC', limit?: number): Promise<import(".").TelemetryEntity[]>;
    getDeviceTelemetryFields(devEUI: string): Promise<{
        devEUI: string;
        fields: Array<{
            key: string;
            label: string;
            latestValue: any;
            dataType: string;
            unit?: string;
            source: "decoded_payload" | "lora_metric" | "default";
            lastSeen?: Date | string;
        }>;
        lastTelemetryAt?: Date | string;
        totalRecordsScanned: number;
    }>;
}
