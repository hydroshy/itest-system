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
    const shouldSynchronize = process.env.DB_SYNCHRONIZE !== 'false';

    // Build fallback candidate hosts in case DNS (e.g. mas.local) cannot be resolved inside Docker
    const candidateHosts: string[] = [configuredHost];
    const standardFallbacks = ['postgres_db', 'postgres', 'postgresql', 'host.docker.internal', 'localhost', '127.0.0.1'];
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

        // 1. Guarantee that the 5 core tables exist in PostgreSQL with exact DDL
        await this.ensureCoreTablesExist(dataSource);

        // 2. TypeORM schema synchronize if enabled
        if (shouldSynchronize) {
          try {
            await dataSource.synchronize();
            this.logger.log(`✅ Schema synchronized for database pool [${key}] -> all tables & relations verified/created`);
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

  private async ensureCoreTablesExist(dataSource: DataSource): Promise<void> {
    try {
      await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`).catch(() => {});
      await dataSource.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`).catch(() => {});

      // 1. permission table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "permission" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" VARCHAR(255) UNIQUE NOT NULL,
          "description" VARCHAR(255),
          "module" VARCHAR(100) NOT NULL,
          "action" VARCHAR(100) NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // 2. roles table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "roles" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "code" VARCHAR(100) UNIQUE NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "description" VARCHAR(255),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // 3. role_permissions join table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "role_permissions" (
          "role_id" UUID NOT NULL,
          "permission_id" UUID NOT NULL,
          CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id")
        );
      `);

      // 4. users table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "username" VARCHAR(255) UNIQUE NOT NULL,
          "email" VARCHAR(255) UNIQUE NOT NULL,
          "passwordHash" VARCHAR(255) NOT NULL,
          "fullName" VARCHAR(255),
          "userType" VARCHAR(50) NOT NULL DEFAULT 'USER',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdById" VARCHAR(255),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // 5. user_role join table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "user_role" (
          "user_id" UUID NOT NULL,
          "role_id" UUID NOT NULL,
          CONSTRAINT "PK_user_role" PRIMARY KEY ("user_id", "role_id")
        );
      `);

      this.logger.log('✅ Guaranteed presence of 5 core RBAC tables in PostgreSQL');
    } catch (err: any) {
      this.logger.warn(`Auto-table verification notice: ${err.message}`);
    }
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

