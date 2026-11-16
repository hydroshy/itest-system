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
import { DeviceAutoCheckProfileEntity } from '../core-models/device-autocheck-profile.entity';
import { SoTestBatchEntity } from '../core-models/so-test-batch.entity';

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
  FinalConfigProfileEntity,
  FinalConfigRegisterEntity,
  FinalConfigExecutionSessionEntity,
  FinalConfigExecutionLogEntity,
  TraceabilitySoEntity,
  TraceabilityWaEntity,
  TraceabilityOrderEntity,
  TraceabilityDeviceEntity,
  TestingDeviceEntity,
  DevicePacketEntity,
  GatewayTestSessionEntity,
  DecoderScriptEntity,
  DeviceAutoCheckProfileEntity,
  SoTestBatchEntity,
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

  /**
   * Bắt buộc kiểm tra biến môi trường cơ sở dữ liệu khi khởi động hệ thống.
   * Tuyệt đối không dùng mockdata/fallback; nếu thiếu biến môi trường khi deploy sẽ báo lỗi và dừng hệ thống.
   */
  public validateDatabaseEnv(): void {
    const requiredEnvVars = [
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_NAME',
      'DB_SCHEMA',
    ];

    const missing = requiredEnvVars.filter((varName) => {
      const val = process.env[varName];
      return val === undefined || val === null || String(val).trim() === '';
    });

    if (missing.length > 0) {
      const errorMsg = `❌ [FATAL CONFIG ERROR] Thiếu các biến môi trường bắt buộc cho cơ sở dữ liệu: ${missing.join(', ')}. Hệ thống không sử dụng mockdata fallback và dừng khởi động khi deploy thiếu cấu hình.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const portNum = parseInt(process.env.DB_PORT || '', 10);
    if (isNaN(portNum) || portNum <= 0) {
      const errorMsg = `❌ [FATAL CONFIG ERROR] Biến môi trường DB_PORT="${process.env.DB_PORT}" không hợp lệ. Phải là số cổng hợp lệ (ví dụ: 5432).`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  public async loadConfigAndInitializeDataSources(): Promise<void> {
    // 0. Bắt buộc kiểm tra biến môi trường - Không cho phép chạy nếu thiếu biến môi trường, tuyệt đối không dùng mockdata
    this.validateDatabaseEnv();

    // 1. If routing file exists, load it; otherwise initialize default core_db configuration directly
    if (fs.existsSync(this.configPath)) {
      try {
        this.logger.log(`Loading database routing config from: ${this.configPath}`);
        const fileContent = fs.readFileSync(this.configPath, 'utf8');
        this.routingConfig = JSON.parse(fileContent) as DbRoutingConfig;
      } catch (e: any) {
        this.logger.warn(`Could not parse ${this.configPath}: ${e.message}. Using environment config.`);
      }
    }

    if (!this.routingConfig) {
      this.routingConfig = {
        default_connection: 'core_db',
        connections: {},
        table_routes: {},
      };
    }

    if (!this.routingConfig.connections) {
      this.routingConfig.connections = {};
    }

    // Luôn đảm bảo default_connection (core_db) lấy trực tiếp từ các biến môi trường đã kiểm tra, không dùng mockdata
    const defaultConnKey = this.routingConfig.default_connection || 'core_db';
    const existingConn = this.routingConfig.connections[defaultConnKey] || ({} as DbConnectionConfig);
    this.routingConfig.connections[defaultConnKey] = {
      ...existingConn,
      host: process.env.DB_HOST!.trim(),
      port: parseInt(process.env.DB_PORT!.trim(), 10),
      username: process.env.DB_USERNAME!.trim(),
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME!.trim(),
      schema: process.env.DB_SCHEMA!.trim(),
      ssl: process.env.DB_SSL !== undefined ? process.env.DB_SSL === 'true' : Boolean(existingConn.ssl),
      poolSize: process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : (existingConn.poolSize || 10),
      synchronize: process.env.DB_SYNCHRONIZE !== undefined ? process.env.DB_SYNCHRONIZE === 'true' : Boolean(existingConn.synchronize),
    };

    for (const [connKey, connDetails] of Object.entries(this.routingConfig.connections)) {
      if (!this.dataSources.has(connKey) || !this.dataSources.get(connKey).isInitialized) {
        try {
          await this.createAndRegisterDataSource(connKey, connDetails);
        } catch (err: any) {
          this.logger.error(`❌ Không thể khởi tạo kết nối database pool [${connKey}] khi khởi động: ${err.message}`);
          throw err;
        }
      }
    }
  }

  private async createAndRegisterDataSource(key: string, config: DbConnectionConfig): Promise<DataSource> {
    const isCore = key === (this.routingConfig?.default_connection || 'core_db');
    const targetHost = isCore ? process.env.DB_HOST!.trim() : (process.env.DB_HOST || config.host);
    const port = isCore
      ? parseInt(process.env.DB_PORT!.trim(), 10)
      : (process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : config.port);
    const username = isCore ? process.env.DB_USERNAME!.trim() : (process.env.DB_USERNAME || config.username);
    const password = isCore ? process.env.DB_PASSWORD : (process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : config.password);
    const database = isCore ? process.env.DB_NAME!.trim() : (process.env.DB_NAME || config.database);
    const schema = isCore ? process.env.DB_SCHEMA!.trim() : (process.env.DB_SCHEMA || config.schema);
    const ssl = process.env.DB_SSL !== undefined ? process.env.DB_SSL === 'true' : (config.ssl ? { rejectUnauthorized: false } : false);
    const synchronize = process.env.DB_SYNCHRONIZE !== undefined ? process.env.DB_SYNCHRONIZE === 'true' : Boolean(config.synchronize);
    const poolSize = process.env.DB_POOL_SIZE ? parseInt(process.env.DB_POOL_SIZE, 10) : (config.poolSize || 10);

    if (!targetHost || !port || !username || password === undefined || !database || !schema) {
      throw new Error(
        `❌ [Database Configuration Error] Kết nối [${key}] thiếu biến môi trường bắt buộc (host, port, username, password, database, schema). Tuyệt đối không sử dụng mockdata.`,
      );
    }

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
        max: poolSize,
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
