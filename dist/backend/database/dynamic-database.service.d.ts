import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, EntityTarget, Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Role } from '../../modules/roles-permissions/entities/role.entity';
import { Permission } from '../../modules/roles-permissions/entities/permission.entity';
import { NetworkServerEntity } from '../../modules/network-servers/entities/network-server.entity';
import { ApplicationEntity } from '../../modules/lorawan/entities/application.entity';
import { DeviceEntity } from '../../modules/lorawan/entities/device.entity';
import { GatewayEntity } from '../../modules/lorawan/entities/gateway.entity';
import { TelemetryEntity } from '../../modules/lorawan/entities/telemetry.entity';
import { DecoderEntity } from '../../modules/c-modules/decoder-admin/entities/decoder.entity';
import { WebhookLogEntity } from '../../modules/c-modules/webhook-admin/entities/webhook-log.entity';
import { HmiScreenEntity } from '../../modules/c-modules/hmi-studio/entities/hmi-screen.entity';
import { DownlinkLogEntity } from '../../modules/network-servers/entities/downlink-log.entity';
import { ModbusPresetEntity } from '../../modules/c-modules/modbus-presets/entities/modbus-preset.entity';
import { TestTemplateEntity } from '../../modules/c-modules/test-builder/entities/test-template.entity';
import { TestAssertionEntity } from '../../modules/c-modules/test-builder/entities/test-assertion.entity';
import { SalesOrderEntity } from '../../modules/c-modules/sales-orders/entities/sales-order.entity';
import { SalesOrderItemEntity } from '../../modules/c-modules/sales-orders/entities/sales-order-item.entity';
import { ItemCodeEntity } from '../../modules/c-modules/item-codes/entities/item-code.entity';
import { SensorTypeEntity } from '../../modules/c-modules/sensor-types/entities/sensor-type.entity';
import { TestSessionEntity } from '../../modules/d-modules/test-automation/entities/test-session.entity';
import { TestDeviceRunEntity } from '../../modules/d-modules/test-automation/entities/test-device-run.entity';
import { TestPacketLogEntity } from '../../modules/d-modules/test-automation/entities/test-packet-log.entity';
import { TestEvidenceEntity } from '../../modules/d-modules/test-automation/entities/test-evidence.entity';
import { TestResultEntity } from '../../modules/c-modules/traceability/entities/test-result.entity';
import { RawData3Entity } from '../../modules/c-modules/traceability/entities/raw-data3.entity';
import { MemmapPayloadEntity } from '../../modules/c-modules/memmap-upload/entities/memmap-payload.entity';
import { MemmapRegEntity } from '../../modules/c-modules/memmap-upload/entities/memmap-reg.entity';
import { FinalConfigPresetEntity } from '../../modules/c-modules/create-final-config/entities/final-config-preset.entity';
import { FinalConfigRegEntity } from '../../modules/c-modules/create-final-config/entities/final-config-reg.entity';
import { FinalConfigSnEntity } from '../../modules/c-modules/final-config-manager/entities/final-config-sn.entity';
import { FinalConfigRegsSnEntity } from '../../modules/c-modules/final-config-manager/entities/final-config-regs-sn.entity';
import { DeviceTestedEntity } from '../../modules/c-modules/device-tested/entities/device-tested.entity';
export declare const ALL_DATABASE_ENTITIES: (typeof Permission | typeof Role | typeof User | typeof NetworkServerEntity | typeof ApplicationEntity | typeof TestAssertionEntity | typeof TestTemplateEntity | typeof ItemCodeEntity | typeof SalesOrderItemEntity | typeof SalesOrderEntity | typeof DeviceEntity | typeof GatewayEntity | typeof TelemetryEntity | typeof DecoderEntity | typeof WebhookLogEntity | typeof HmiScreenEntity | typeof DownlinkLogEntity | typeof ModbusPresetEntity | typeof SensorTypeEntity | typeof TestPacketLogEntity | typeof TestDeviceRunEntity | typeof TestSessionEntity | typeof TestEvidenceEntity | typeof TestResultEntity | typeof RawData3Entity | typeof MemmapRegEntity | typeof MemmapPayloadEntity | typeof FinalConfigRegEntity | typeof FinalConfigPresetEntity | typeof FinalConfigRegsSnEntity | typeof FinalConfigSnEntity | typeof DeviceTestedEntity)[];
export interface DbConnectionConfig {
    host: string;
    port: number;
    username: string;
    password?: string;
    database: string;
    ssl?: boolean;
    poolSize?: number;
}
export interface DbRoutingConfig {
    default_connection: string;
    connections: Record<string, DbConnectionConfig>;
    table_routes: Record<string, string>;
}
export declare class DynamicDatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private dataSources;
    private routingConfig;
    private configPath;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    loadConfigAndInitializeDataSources(): Promise<void>;
    private createAndRegisterDataSource;
    getDataSourceForTable(tableName: string): DataSource;
    getRepositoryForTable<T>(tableName: string, entityTarget: EntityTarget<T>): Repository<T>;
    getRawRoutingConfig(): DbRoutingConfig;
    getDatabaseHealth(): Promise<{
        status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
        timestamp: string;
        totalConnections: number;
        connections: Record<string, any>;
        tableStats: Record<string, {
            routedTo: string;
            recordCount: number;
            status: string;
        }>;
    }>;
    getConnectionStatus(): {
        table_routes: Record<string, string>;
        connections_status: Record<string, any>;
    };
}
