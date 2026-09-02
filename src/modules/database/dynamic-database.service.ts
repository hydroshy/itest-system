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
        try {
          await this.createAndRegisterDataSource(connKey, connDetails);
        } catch (err: any) {
          this.logger.error(`⚠️ Could not connect pool [${connKey}] on startup: ${err.message}. Server will remain active.`);
        }
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
          "name" VARCHAR(255) UNIQUE,
          "description" VARCHAR(255),
          "module" VARCHAR(100) NOT NULL DEFAULT 'system',
          "action" VARCHAR(100) NOT NULL DEFAULT 'read',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      // Delete any dirty rows with null name before setting NOT NULL
      await dataSource.query(`DELETE FROM "permission" WHERE "name" IS NULL OR "name" = '';`).catch(() => {});
      await dataSource.query(`ALTER TABLE "permission" ALTER COLUMN "name" SET NOT NULL;`).catch(() => {});

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

      // 6. Clean orphaned join records
      await dataSource.query(`
        DELETE FROM "role_permissions"
        WHERE "role_id" NOT IN (SELECT "id" FROM "roles")
           OR "permission_id" NOT IN (SELECT "id" FROM "permission");
      `).catch(() => {});

      await dataSource.query(`
        DELETE FROM "user_role"
        WHERE "user_id" NOT IN (SELECT "id" FROM "users")
           OR "role_id" NOT IN (SELECT "id" FROM "roles");
      `).catch(() => {});

      this.logger.log('✅ Guaranteed presence of 5 core RBAC tables in PostgreSQL');
    } catch (err: any) {
      this.logger.warn(`Auto-table verification notice: ${err.message}`);
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
          const countRes = await ds.query(`SELECT count(*)::int as count FROM "${table}"`).catch(() => null);
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

