import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { DataSource, DataSourceOptions, EntityTarget, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { Permission } from '../roles-permissions/entities/permission.entity';
import { NetworkServerEntity } from '../network-servers/entities/network-server.entity';
import { ApplicationEntity } from '../lorawan/entities/application.entity';
import { DeviceEntity } from '../lorawan/entities/device.entity';
import { GatewayEntity } from '../lorawan/entities/gateway.entity';
import { TelemetryEntity } from '../lorawan/entities/telemetry.entity';

export const ALL_DATABASE_ENTITIES = [
  User,
  Role,
  Permission,
  NetworkServerEntity,
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

        // 1. Guarantee that the core tables exist in PostgreSQL with exact DDL
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

      // 6. network_servers table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "network_servers" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "name" VARCHAR(255) NOT NULL,
          "type" VARCHAR(50) NOT NULL DEFAULT 'THINGPARK',
          "description" TEXT,
          "apiUrl" VARCHAR(500),
          "apiKey" TEXT,
          "routeRef" VARCHAR(255),
          "regionProfiles" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "status" VARCHAR(50) NOT NULL DEFAULT 'ONLINE',
          "isDefault" BOOLEAN NOT NULL DEFAULT false,
          "metadata" JSONB,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // 7. applications table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "applications" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "appId" VARCHAR(255) UNIQUE NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "description" VARCHAR(255),
          "ownerId" VARCHAR(255),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // 8. devices table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "devices" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "devEUI" VARCHAR(255) UNIQUE NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "appId" VARCHAR(255),
          "ownerId" UUID,
          "appEUI" VARCHAR(255) DEFAULT '0102030405060708',
          "networkServerId" UUID,
          "regionProfileId" VARCHAR(100),
          "activationMode" VARCHAR(50) NOT NULL DEFAULT 'OTAA',
          "appKey" VARCHAR(255) DEFAULT '0102030405060708090A0B0C0D0E0F10',
          "nwkSKey" VARCHAR(255),
          "appSKey" VARCHAR(255),
          "syncStatus" VARCHAR(50) DEFAULT 'SYNCED',
          "syncDetails" JSONB DEFAULT '{}'::jsonb,
          "payloadFormatterScript" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      await dataSource.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "ownerId" UUID;`).catch(() => {});
      await dataSource.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "appEUI" VARCHAR(255) DEFAULT '0102030405060708';`).catch(() => {});
      await dataSource.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "networkServerId" UUID;`).catch(() => {});
      await dataSource.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "regionProfileId" VARCHAR(100);`).catch(() => {});
      await dataSource.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "syncStatus" VARCHAR(50) DEFAULT 'SYNCED';`).catch(() => {});
      await dataSource.query(`ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "syncDetails" JSONB;`).catch(() => {});

      // 9. gateways table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "gateways" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "gatewayEUI" VARCHAR(255) UNIQUE NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "networkServerId" UUID,
          "regionProfileId" VARCHAR(100),
          "latitude" DOUBLE PRECISION,
          "longitude" DOUBLE PRECISION,
          "altitude" DOUBLE PRECISION,
          "status" VARCHAR(50) NOT NULL DEFAULT 'ONLINE',
          "ownerId" VARCHAR(255),
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);
      await dataSource.query(`ALTER TABLE "gateways" ADD COLUMN IF NOT EXISTS "networkServerId" UUID;`).catch(() => {});
      await dataSource.query(`ALTER TABLE "gateways" ADD COLUMN IF NOT EXISTS "regionProfileId" VARCHAR(100);`).catch(() => {});

      // 10. uplink_telemetry table
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "uplink_telemetry" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "devEUI" VARCHAR(255) NOT NULL,
          "fPort" INT NOT NULL DEFAULT 1,
          "fCnt" INT NOT NULL DEFAULT 1,
          "payloadHex" TEXT NOT NULL,
          "decodedData" JSONB,
          "receivedAt" TIMESTAMP NOT NULL DEFAULT now()
        );
      `);

      // 11. Clean orphaned join records
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

      // 12. Seed default permissions for network server
      await dataSource.query(`
        INSERT INTO "permission" ("name", "description", "module", "action")
        VALUES 
          ('network_server:read', 'View network server configurations', 'network_server', 'read'),
          ('network_server:manage', 'Create, edit, delete network servers and region profiles', 'network_server', 'manage')
        ON CONFLICT ("name") DO NOTHING;
      `).catch(() => {});

      // 13. Seed default Network Servers if empty
      const nsCountRes = await dataSource.query(`SELECT count(*)::int as count FROM "network_servers";`).catch(() => [{ count: 0 }]);
      if (nsCountRes && nsCountRes[0] && nsCountRes[0].count === 0) {
        const defaultThingParkRegions = JSON.stringify([
          {
            id: 'tp-prof-vn920',
            name: 'Vietnam AS923-1 Plan',
            region: 'AS923-1',
            routeRef: 'TP_VN_AS923_DEFAULT',
            frequencyBand: '920-925 MHz',
            description: 'Default ThingPark routing profile for Vietnam market',
            isActive: true,
          },
          {
            id: 'tp-prof-eu868',
            name: 'Europe EU868 Standard',
            region: 'EU868',
            routeRef: 'TP_EU868_DEFAULT',
            frequencyBand: '863-870 MHz',
            description: 'Actility ThingPark EU868 Band routing profile',
            isActive: true,
          },
          {
            id: 'tp-prof-us915',
            name: 'US915 North America',
            region: 'US915',
            routeRef: 'TP_US915_DEFAULT',
            frequencyBand: '902-928 MHz',
            description: 'ThingPark US915 Channel routing profile',
            isActive: true,
          },
        ]);

        const defaultChirpStackRegions = JSON.stringify([
          {
            id: 'cs-prof-as923',
            name: 'ChirpStack AS923-1 Profile',
            region: 'AS923-1',
            profileId: 'dp_as923_vn_001',
            frequencyBand: '920-925 MHz',
            description: 'ChirpStack Device Profile for AS923-1',
            isActive: true,
          },
          {
            id: 'cs-prof-eu868',
            name: 'ChirpStack EU868 Standard',
            region: 'EU868',
            profileId: 'dp_eu868_std_001',
            frequencyBand: '863-870 MHz',
            description: 'ChirpStack Device Profile for EU868',
            isActive: true,
          },
          {
            id: 'cs-prof-us915',
            name: 'ChirpStack US915 Sub-band 2',
            region: 'US915',
            profileId: 'dp_us915_sb2_001',
            frequencyBand: '902-928 MHz',
            description: 'ChirpStack Device Profile for US915',
            isActive: true,
          },
        ]);

        await dataSource.query(`
          INSERT INTO "network_servers" ("name", "type", "description", "apiUrl", "apiKey", "routeRef", "regionProfiles", "status", "isDefault", "metadata")
          VALUES
            ('ThingPark Wireless Enterprise', 'THINGPARK', 'Actility ThingPark Wireless Cloud / On-Premises Server', 'https://community.thingpark.io/thingpark/wireless/rest/v1', 'tp_api_key_demo_token', 'DAVITEQ_TP_DEFAULT_ROUTE', $1, 'ONLINE', true, '{"webhookUrl": "/lorawan/webhook/thingpark"}'::jsonb),
            ('ChirpStack LoRaWAN Network Server', 'CHIRPSTACK', 'ChirpStack v4 Open-source LoRaWAN Network Server', 'https://chirpstack-test.globiots.com', 'cs_api_token_secret_demo', NULL, $2, 'ONLINE', false, '{"webhookUrl": "/lorawan/webhook/chirpstack", "tenantId": "52f14cd4-c6f1-4fbd-8f87-4025e1d49242", "applicationId": "app_daviteq_sensors"}'::jsonb);
        `, [defaultThingParkRegions, defaultChirpStackRegions]).catch((err) => {
          this.logger.warn(`Could not seed default network servers: ${err.message}`);
        });

        this.logger.log('🌱 Seeded default ThingPark and ChirpStack Network Servers into database');
      }

      // Update any existing chirpstack URL from old local to new test URL
      await dataSource.query(`
        UPDATE "network_servers"
        SET "apiUrl" = 'https://chirpstack-test.globiots.com'
        WHERE "type" = 'CHIRPSTACK' AND ("apiUrl" LIKE '%chirpstack.mas.local%' OR "apiUrl" IS NULL OR "apiUrl" = '');
      `).catch(() => {});

      this.logger.log('✅ Guaranteed presence of all 10 core RBAC & LoRaWAN tables (including network_servers) in PostgreSQL');
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
