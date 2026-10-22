import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { DataSource, DataSourceOptions, EntityTarget, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../identity/modules/users/entities/user.entity';
import { Role } from '../identity/modules/roles-permissions/entities/role.entity';
import { Permission } from '../identity/modules/roles-permissions/entities/permission.entity';
import { CorePluginEntity } from '../core-models/core-plugin.entity';
import { PluginAuditLogEntity } from '../core-models/plugin-audit-log.entity';
import { UnifiedDeviceEntity } from '../core-models/unified-device.entity';
import { ChirpstackNetworkServerEntity } from '../core-models/chirpstack-network-server.entity';
import { MemmapProfileEntity } from '../core-models/memmap-profile.entity';
import { MemmapRegisterEntity } from '../core-models/memmap-register.entity';

export const ALL_DATABASE_ENTITIES = [
  User,
  Role,
  Permission,
  CorePluginEntity,
  PluginAuditLogEntity,
  UnifiedDeviceEntity,
  ChirpstackNetworkServerEntity,
  MemmapProfileEntity,
  MemmapRegisterEntity,
];

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

@Injectable()
export class DynamicDatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DynamicDatabaseService.name);
  private dataSources: Map<string, DataSource> = new Map();
  private routingConfig: DbRoutingConfig;
  private configPath: string;

  constructor() {
    this.configPath = process.env.DB_ROUTING_CONFIG_PATH || path.join(process.cwd(), 'config', 'db-routing.config.json');
  }

  async onModuleInit() {
    await this.loadConfigAndInitializeDataSources();
  }

  async onModuleDestroy() {
    for (const [key, dataSource] of this.dataSources.entries()) {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        this.logger.log(`Closed PostgreSQL connection pool: ${key}`);
      }
    }
  }

  public async loadConfigAndInitializeDataSources(): Promise<void> {
    // 1. If routing file exists, load it; otherwise initialize default core_db configuration directly
    if (fs.existsSync(this.configPath)) {
      try {
        this.logger.log(`Loading database routing config from: ${this.configPath}`);
        const fileContent = fs.readFileSync(this.configPath, 'utf8');
        this.routingConfig = JSON.parse(fileContent) as DbRoutingConfig;
      } catch (e: any) {
        this.logger.warn(`Could not parse ${this.configPath}: ${e.message}. Using default environment config.`);
      }
    }

    if (!this.routingConfig) {
      this.routingConfig = {
        default_connection: 'core_db',
        connections: {
          core_db: {
            host: process.env.DB_HOST || '127.0.0.1',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
            username: process.env.DB_USERNAME || 'itest_system_user',
            password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'system_secret_2026',
            database: process.env.DB_NAME || 'itest_platform',
            schema: process.env.DB_SCHEMA || 'system_schema',
            ssl: process.env.DB_SSL === 'true',
            poolSize: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : 10,
            synchronize: process.env.DB_SYNCHRONIZE === 'true',
          },
        },
        table_routes: {},
      };
    }

    for (const [connKey, connDetails] of Object.entries(this.routingConfig.connections)) {
      if (!this.dataSources.has(connKey) || !this.dataSources.get(connKey).isInitialized) {
        try {
          await this.createAndRegisterDataSource(connKey, connDetails);
        } catch (err: any) {
          this.logger.error(`⚠️ Could not connect pool [${connKey}] on startup: ${err.message}. Server will remain active.`);
        }
      }
    }
  }

  private async createAndRegisterDataSource(key: string, config: DbConnectionConfig): Promise<DataSource> {
    const targetHost = process.env.DB_HOST || config.host || '127.0.0.1';
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : (config.port || 5432);
    const username = process.env.DB_USERNAME || config.username;
    const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : config.password;
    const database = process.env.DB_NAME || config.database;
    const schema = process.env.DB_SCHEMA || config.schema || 'system_schema';
    const ssl = process.env.DB_SSL !== undefined ? process.env.DB_SSL === 'true' : (config.ssl ? { rejectUnauthorized: false } : false);
    const synchronize = process.env.DB_SYNCHRONIZE === 'true' || config.synchronize === true;

    const options: DataSourceOptions = {
      type: 'postgres',
      host: targetHost,
      port,
      username,
      password,
      database,
      schema,
      ssl,
      synchronize,
      logging: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
      entities: ALL_DATABASE_ENTITIES,
      extra: {
        max: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : (config.poolSize || 10),
      },
    };

    const dataSource = new DataSource(options);
    try {
      await dataSource.initialize();
      this.dataSources.set(key, dataSource);
      this.logger.log(`✅ Successfully connected to database pool [${key}] -> ${targetHost}:${port}/${database} (schema: ${schema})`);
      return dataSource;
    } catch (error: any) {
      this.logger.error(`❌ Failed to connect database pool [${key}] at [${targetHost}:${port}/${database}]: ${error.message}`);
      throw error;
    }
  }

  public getDataSourceForTable(tableName: string): DataSource {
    if (!this.routingConfig) {
      try {
        if (fs.existsSync(this.configPath)) {
          this.routingConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        }
      } catch (e) {}
    }
    const targetConnKey = this.routingConfig?.table_routes?.[tableName] || this.routingConfig?.default_connection || 'core_db';
    let ds = this.dataSources.get(targetConnKey);
    if (!ds || !ds.isInitialized) {
      // Fallback to first available initialized data source
      for (const candidate of this.dataSources.values()) {
        if (candidate && candidate.isInitialized) {
          ds = candidate;
          break;
        }
      }
    }
    if (!ds || !ds.isInitialized) {
      throw new Error(`No initialized database DataSource for table [${tableName}] assigned to connection [${targetConnKey}]`);
    }
    return ds;
  }

  public getRepositoryForTable<T>(tableName: string, entityTarget: EntityTarget<T>): Repository<T> {
    const dataSource = this.getDataSourceForTable(tableName);
    return dataSource.getRepository(entityTarget);
  }

  public getRawRoutingConfig(): DbRoutingConfig {
    return this.routingConfig;
  }

  public async getDatabaseHealth(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    timestamp: string;
    totalConnections: number;
    connections: Record<string, any>;
    tableStats: Record<string, { routedTo: string; recordCount: number; status: string }>;
  }> {
    const connections: Record<string, any> = {};
    const tableStats: Record<string, any> = {};
    let allHealthy = true;

    for (const [key, ds] of this.dataSources.entries()) {
      const startTime = Date.now();
      let isAlive = false;
      let latencyMs = 0;
      let version = 'PostgreSQL';
      let errorMsg: string | null = null;

      try {
        if (ds.isInitialized) {
          const res = await ds.query('SELECT version();');
          latencyMs = Date.now() - startTime;
          isAlive = true;
          if (res && res[0] && res[0].version) {
            version = res[0].version.split(' ')[0] + ' ' + (res[0].version.split(' ')[1] || '');
          }
        }
      } catch (err: any) {
        isAlive = false;
        allHealthy = false;
        errorMsg = err.message;
      }

      connections[key] = {
        name: key,
        host: (ds.options as any).host || 'unknown',
        port: (ds.options as any).port || 5432,
        database: ds.options.database,
        isInitialized: ds.isInitialized,
        isAlive,
        latencyMs: isAlive ? latencyMs : null,
        version,
        error: errorMsg,
        poolSize: (ds.options as any).extra?.max || 10,
        status: isAlive ? (latencyMs < 100 ? 'EXCELLENT' : 'GOOD') : 'UNREACHABLE',
      };
    }

    // Measure table row counts
    const routes = this.routingConfig?.table_routes || {};
    for (const [table, connKey] of Object.entries(routes)) {
      try {
        const ds = this.dataSources.get(connKey);
        if (ds && ds.isInitialized) {
          let schemaPrefix = '';
          try {
            const meta = ds.entityMetadatas.find((m) => m.tableName === table);
            if (meta && meta.schema) {
              schemaPrefix = `"${meta.schema}".`;
            }
          } catch {}
          const countRes = await ds.query(`SELECT count(*)::int as count FROM ${schemaPrefix}"${table}"`).catch(() => null);
          tableStats[table] = {
            routedTo: connKey,
            recordCount: countRes && countRes[0] ? countRes[0].count : 0,
            status: 'ONLINE',
          };
        } else {
          tableStats[table] = {
            routedTo: connKey,
            recordCount: 0,
            status: 'OFFLINE',
          };
        }
      } catch (e: any) {
        tableStats[table] = {
          routedTo: connKey,
          recordCount: 0,
          status: 'UNAVAILABLE',
        };
      }
    }

    return {
      status: allHealthy ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      totalConnections: this.dataSources.size,
      connections,
      tableStats,
    };
  }

  public getConnectionStatus() {
    const status: Record<string, any> = {};
    for (const [key, ds] of this.dataSources.entries()) {
      status[key] = {
        initialized: ds.isInitialized,
        database: ds.options.database,
        host: (ds.options as any).host,
        port: (ds.options as any).port,
      };
    }
    return {
      table_routes: this.routingConfig.table_routes,
      connections_status: status,
    };
  }
}
