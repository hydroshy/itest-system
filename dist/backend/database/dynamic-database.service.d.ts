import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, EntityTarget, Repository } from 'typeorm';
import { User } from '../identity/modules/users/entities/user.entity';
import { Role } from '../identity/modules/roles-permissions/entities/role.entity';
import { Permission } from '../identity/modules/roles-permissions/entities/permission.entity';
import { CorePluginEntity } from '../core-models/core-plugin.entity';
import { PluginAuditLogEntity } from '../core-models/plugin-audit-log.entity';
import { UnifiedDeviceEntity } from '../core-models/unified-device.entity';
import { ChirpstackNetworkServerEntity } from '../core-models/chirpstack-network-server.entity';
import { MemmapProfileEntity } from '../core-models/memmap-profile.entity';
import { MemmapRegisterEntity } from '../core-models/memmap-register.entity';
import { FinalConfigProfileEntity } from '../core-models/finalconfig-profile.entity';
import { FinalConfigRegisterEntity } from '../core-models/finalconfig-register.entity';
import { FinalConfigExecutionSessionEntity } from '../core-models/finalconfig-execution-session.entity';
import { FinalConfigExecutionLogEntity } from '../core-models/finalconfig-execution-log.entity';
import { TraceabilitySoEntity } from '../core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../core-models/traceability-wa.entity';
import { TraceabilityOrderEntity } from '../core-models/traceability-order.entity';
import { TraceabilityDeviceEntity } from '../core-models/traceability-device.entity';
import { TestingDeviceEntity } from '../core-models/testing-device.entity';
import { DevicePacketEntity } from '../core-models/device-packet.entity';
import { GatewayTestSessionEntity } from '../core-models/gateway-test-session.entity';
import { DecoderScriptEntity } from '../core-models/decoder-script.entity';
export declare const ALL_DATABASE_ENTITIES: (typeof Permission | typeof Role | typeof User | typeof CorePluginEntity | typeof PluginAuditLogEntity | typeof UnifiedDeviceEntity | typeof ChirpstackNetworkServerEntity | typeof MemmapRegisterEntity | typeof MemmapProfileEntity | typeof FinalConfigRegisterEntity | typeof FinalConfigProfileEntity | typeof FinalConfigExecutionSessionEntity | typeof FinalConfigExecutionLogEntity | typeof TraceabilityDeviceEntity | typeof TraceabilitySoEntity | typeof TraceabilityWaEntity | typeof TraceabilityOrderEntity | typeof DevicePacketEntity | typeof TestingDeviceEntity | typeof GatewayTestSessionEntity | typeof DecoderScriptEntity)[];
export interface DbConnectionConfig {
    host: string;
    port: number;
    username: string;
    password?: string;
    database: string;
    ssl?: boolean;
    poolSize?: number;
    schema?: string;
    synchronize?: boolean;
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
