import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, EntityTarget, Repository } from 'typeorm';
import { User } from '../identity/modules/users/entities/user.entity';
import { Role } from '../identity/modules/roles-permissions/entities/role.entity';
import { Permission } from '../identity/modules/roles-permissions/entities/permission.entity';
import { CorePluginEntity } from '../core-models/core-plugin.entity';
import { PluginAuditLogEntity } from '../core-models/plugin-audit-log.entity';
import { UnifiedDeviceEntity } from '../core-models/unified-device.entity';
export declare const ALL_DATABASE_ENTITIES: (typeof Permission | typeof Role | typeof User | typeof CorePluginEntity | typeof PluginAuditLogEntity | typeof UnifiedDeviceEntity)[];
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
