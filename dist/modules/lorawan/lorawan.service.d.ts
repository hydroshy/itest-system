import { OnModuleInit } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';
import { DeviceProvisioningService, ProvisioningResult } from './services/device-provisioning.service';
import { DeviceEntity } from './entities/device.entity';
import { GatewayEntity } from './entities/gateway.entity';
import { TelemetryEntity } from './entities/telemetry.entity';
import { RegisterDeviceDto } from './dto/lorawan.dto';
export { cleanFirmwareVersion } from './common/lorawan-utils';
export declare class LorawanService implements OnModuleInit {
    private readonly dbService;
    private readonly payloadFormatterService;
    private readonly provisioningService;
    private readonly realtimeService;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService, payloadFormatterService: PayloadFormatterService, provisioningService: DeviceProvisioningService, realtimeService: RealtimeService);
    onModuleInit(): Promise<void>;
    private ensureDeviceColumns;
    private get itemCodeRepo();
    private get salesOrderRepo();
    private get deviceRepo();
    private get serverRepo();
    private get decoderRepo();
    private get webhookLogRepo();
    private get appRepo();
    private get gatewayRepo();
    private get telemetryRepo();
    registerDevice(dto: RegisterDeviceDto, user?: any): Promise<{
        success: boolean;
        device: DeviceEntity;
        provisioning?: ProvisioningResult;
        message: string;
    }>;
    updateDevice(devEUI: string, dto: Partial<RegisterDeviceDto>, user?: any): Promise<{
        success: boolean;
        device: DeviceEntity;
        provisioning?: ProvisioningResult;
        message: string;
    }>;
    deleteDevice(devEUI: string, user?: any): Promise<{
        success: boolean;
        message: string;
    }>;
    syncDeviceToNetworkServer(devEUI: string, user?: any): Promise<{
        success: boolean;
        provisioning: ProvisioningResult;
        device: DeviceEntity;
    }>;
    checkDeviceHealth(devEUI: string, user?: any): Promise<{
        success: boolean;
        device: DeviceEntity;
        health: {
            isOnline: boolean;
            lastSeenAt: string | null;
            deviceStatus?: any;
            message: string;
        };
    }>;
    registerGateway(data: Partial<GatewayEntity>): Promise<GatewayEntity>;
    updatePayloadFormatter(devEUI: string, script: string): Promise<DeviceEntity>;
    private getDecoderScript;
    private recordWebhookLog;
    private extractBestGateway;
    handleUplink(devEUI: string, payloadHex: string, fPort?: number, fCnt?: number): Promise<{
        success: boolean;
        devEUI: string;
        decodedData: {};
        telemetry: TelemetryEntity;
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
    testPayloadFormatter(script: string, bytesHex: string, fPort?: number): Record<string, any>;
    listDevices(user?: any): Promise<any[]>;
    findOneDevice(devEUI: string, user?: any): Promise<DeviceEntity>;
    getDevice(id: string): Promise<DeviceEntity | null>;
    listGateways(): Promise<GatewayEntity[]>;
    getTelemetry(devEUI?: string, limit?: number, options?: {
        devEUIs?: string[];
        from?: string | Date;
        to?: string | Date;
        order?: 'ASC' | 'DESC';
    }): Promise<TelemetryEntity[]>;
    getDeviceTelemetryFields(devEUI: string): Promise<{
        devEUI: string;
        fields: Array<{
            key: string;
            label: string;
            latestValue: any;
            dataType: string;
            unit?: string;
            source: 'decoded_payload' | 'lora_metric' | 'default';
            lastSeen?: Date | string;
        }>;
        lastTelemetryAt?: Date | string;
        totalRecordsScanned: number;
    }>;
}
