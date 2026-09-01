import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { DataSource, DataSourceOptions, EntityTarget, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { Permission } from '../roles-permissions/entities/permission.entity';
import { ApplicationEntity } from '../lorawan/entities/application.entity';
import { DeviceEntity } from '../lorawan/entities/device.entity';
import { GatewayEntity } from '../lorawan/entities/gateway.entity';
import { TelemetryEntity } from '../lorawan/entities/telemetry.entity';

export const ALL_DATABASE_ENTITIES = [
  User,
  Role,
  Permission,
  ApplicationEntity,
  DeviceEntity,
  GatewayEntity,
  TelemetryEntity,
];

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
    this.logger.log(`Loading dynamic database routing config from: ${this.configPath}`);
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Database routing config file not found at ${this.configPath}`);
    }

    const fileContent = fs.readFileSync(this.configPath, 'utf8');
    this.routingConfig = JSON.parse(fileContent) as DbRoutingConfig;

    for (const [connKey, connDetails] of Object.entries(this.routingConfig.connections)) {
      if (!this.dataSources.has(connKey) || !this.dataSources.get(connKey).isInitialized) {
        await this.createAndRegisterDataSource(connKey, connDetails);
      }
    }
  }

  private async createAndRegisterDataSource(key: string, config: DbConnectionConfig): Promise<DataSource> {
    const configuredHost = process.env.DB_HOST || config.host || 'postgres_db';
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : (config.port || 5432);
    const username = process.env.DB_USERNAME || config.username;
    const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : config.password;
    const database = process.env.DB_NAME || config.database;
    const shouldSynchronize = process.env.DB_SYNCHRONIZE === 'true';

    // Build fallback candidate hosts in case DNS (e.g. mas.local) cannot be resolved inside Docker
    const candidateHosts: string[] = [configuredHost];
    const standardFallbacks = ['postgres_db', 'host.docker.internal', 'localhost', '127.0.0.1'];
    for (const fb of standardFallbacks) {
      if (!candidateHosts.includes(fb)) {
        candidateHosts.push(fb);
      }
    }

    let lastError: any = null;

    for (let i = 0; i < candidateHosts.length; i++) {
      const targetHost = candidateHosts[i];
      const options: DataSourceOptions = {
        type: 'postgres',
        host: targetHost,
        port,
        username,
        password,
        database,
        ssl: config.ssl ? { rejectUnauthorized: false } : false,
        synchronize: false,
        logging: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
        entities: ALL_DATABASE_ENTITIES,
        extra: {
          max: config.poolSize || 10,
        },
      };

      const dataSource = new DataSource(options);
      try {
        await dataSource.initialize();

        if (shouldSynchronize) {
          try {
            await dataSource.synchronize();
            this.logger.log(`Schema synchronized for database pool [${key}]`);
          } catch (syncErr: any) {
            this.logger.warn(`Schema sync warning for pool [${key}]: ${syncErr.message}`);
          }
        }

        this.dataSources.set(key, dataSource);
        this.logger.log(`✅ Successfully connected to database pool [${key}] -> ${targetHost}:${port}/${database}`);
        return dataSource;
      } catch (error: any) {
        lastError = error;
        if (error.code === 'ENOTFOUND' && i < candidateHosts.length - 1) {
          this.logger.warn(`⚠️ Host [${targetHost}] not found via DNS in Docker. Trying fallback [${candidateHosts[i + 1]}]...`);
        } else if (i < candidateHosts.length - 1) {
          this.logger.warn(`⚠️ Connection to [${targetHost}:${port}/${database}] failed (${error.message}). Trying fallback [${candidateHosts[i + 1]}]...`);
        }
      }
    }

    this.logger.error(`❌ Failed to initialize database pool [${key}] after trying [${candidateHosts.join(', ')}]: ${lastError?.message}`);
    throw lastError;
  }

  public getDataSourceForTable(tableName: string): DataSource {
    const targetConnKey = this.routingConfig.table_routes[tableName] || this.routingConfig.default_connection;
    const ds = this.dataSources.get(targetConnKey);
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

