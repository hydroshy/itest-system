"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DynamicDatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicDatabaseService = exports.ALL_DATABASE_ENTITIES = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const fs = require("fs");
const path = require("path");
const user_entity_1 = require("../identity/modules/users/entities/user.entity");
const role_entity_1 = require("../identity/modules/roles-permissions/entities/role.entity");
const permission_entity_1 = require("../identity/modules/roles-permissions/entities/permission.entity");
const core_plugin_entity_1 = require("../core-models/core-plugin.entity");
const plugin_audit_log_entity_1 = require("../core-models/plugin-audit-log.entity");
const unified_device_entity_1 = require("../core-models/unified-device.entity");
exports.ALL_DATABASE_ENTITIES = [
    user_entity_1.User,
    role_entity_1.Role,
    permission_entity_1.Permission,
    core_plugin_entity_1.CorePluginEntity,
    plugin_audit_log_entity_1.PluginAuditLogEntity,
    unified_device_entity_1.UnifiedDeviceEntity,
];
let DynamicDatabaseService = DynamicDatabaseService_1 = class DynamicDatabaseService {
    constructor() {
        this.logger = new common_1.Logger(DynamicDatabaseService_1.name);
        this.dataSources = new Map();
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
    async loadConfigAndInitializeDataSources() {
        this.logger.log(`Loading dynamic database routing config from: ${this.configPath}`);
        if (!fs.existsSync(this.configPath)) {
            throw new Error(`Database routing config file not found at ${this.configPath}`);
        }
        const fileContent = fs.readFileSync(this.configPath, 'utf8');
        this.routingConfig = JSON.parse(fileContent);
        for (const [connKey, connDetails] of Object.entries(this.routingConfig.connections)) {
            if (!this.dataSources.has(connKey) || !this.dataSources.get(connKey).isInitialized) {
                try {
                    await this.createAndRegisterDataSource(connKey, connDetails);
                }
                catch (err) {
                    this.logger.error(`⚠️ Could not connect pool [${connKey}] on startup: ${err.message}. Server will remain active.`);
                }
            }
        }
    }
    async createAndRegisterDataSource(key, config) {
        const configuredHost = process.env.DB_HOST || config.host || 'postgres_db';
        const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : (config.port || 5432);
        const username = process.env.DB_USERNAME || config.username;
        const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : config.password;
        const database = process.env.DB_NAME || config.database;
        const schema = process.env.DB_SCHEMA || config.schema || 'system_schema';
        const candidateHosts = [configuredHost];
        const standardFallbacks = ['172.21.0.1', 'postgres_db', 'postgres', 'postgresql', 'host.docker.internal', 'localhost', '127.0.0.1'];
        for (const fb of standardFallbacks) {
            if (!candidateHosts.includes(fb)) {
                candidateHosts.push(fb);
            }
        }
        let lastError = null;
        for (let i = 0; i < candidateHosts.length; i++) {
            const targetHost = candidateHosts[i];
            const options = {
                type: 'postgres',
                host: targetHost,
                port,
                username,
                password,
                database,
                schema,
                ssl: config.ssl ? { rejectUnauthorized: false } : false,
                synchronize: process.env.DB_SYNCHRONIZE === 'true' || config.synchronize === true,
                logging: process.env.NODE_ENV === 'development' || process.env.DB_LOGGING === 'true',
                entities: exports.ALL_DATABASE_ENTITIES,
                extra: {
                    max: config.poolSize || 10,
                },
            };
            const dataSource = new typeorm_1.DataSource(options);
            try {
                await dataSource.initialize();
                this.dataSources.set(key, dataSource);
                this.logger.log(`✅ Successfully connected to database pool [${key}] -> ${targetHost}:${port}/${database} (schema: ${schema})`);
                return dataSource;
            }
            catch (error) {
                lastError = error;
                if (error.code === 'ENOTFOUND' && i < candidateHosts.length - 1) {
                    this.logger.warn(`⚠️ Host [${targetHost}] not found via DNS in Docker. Trying fallback [${candidateHosts[i + 1]}]...`);
                }
                else if (i < candidateHosts.length - 1) {
                    this.logger.warn(`⚠️ Connection to [${targetHost}:${port}/${database}] failed (${error.message}). Trying fallback [${candidateHosts[i + 1]}]...`);
                }
            }
        }
        this.logger.error(`❌ Failed to initialize database pool [${key}] after trying [${candidateHosts.join(', ')}]: ${lastError?.message}`);
        throw lastError;
    }
    getDataSourceForTable(tableName) {
        if (!this.routingConfig) {
            try {
                if (fs.existsSync(this.configPath)) {
                    this.routingConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                }
            }
            catch (e) { }
        }
        const targetConnKey = this.routingConfig?.table_routes?.[tableName] || this.routingConfig?.default_connection || 'core_db';
        let ds = this.dataSources.get(targetConnKey);
        if (!ds || !ds.isInitialized) {
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
    getRepositoryForTable(tableName, entityTarget) {
        const dataSource = this.getDataSourceForTable(tableName);
        return dataSource.getRepository(entityTarget);
    }
    getRawRoutingConfig() {
        return this.routingConfig;
    }
    async getDatabaseHealth() {
        const connections = {};
        const tableStats = {};
        let allHealthy = true;
        for (const [key, ds] of this.dataSources.entries()) {
            const startTime = Date.now();
            let isAlive = false;
            let latencyMs = 0;
            let version = 'PostgreSQL';
            let errorMsg = null;
            try {
                if (ds.isInitialized) {
                    const res = await ds.query('SELECT version();');
                    latencyMs = Date.now() - startTime;
                    isAlive = true;
                    if (res && res[0] && res[0].version) {
                        version = res[0].version.split(' ')[0] + ' ' + (res[0].version.split(' ')[1] || '');
                    }
                }
            }
            catch (err) {
                isAlive = false;
                allHealthy = false;
                errorMsg = err.message;
            }
            connections[key] = {
                name: key,
                host: ds.options.host || 'unknown',
                port: ds.options.port || 5432,
                database: ds.options.database,
                isInitialized: ds.isInitialized,
                isAlive,
                latencyMs: isAlive ? latencyMs : null,
                version,
                error: errorMsg,
                poolSize: ds.options.extra?.max || 10,
                status: isAlive ? (latencyMs < 100 ? 'EXCELLENT' : 'GOOD') : 'UNREACHABLE',
            };
        }
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
                }
                else {
                    tableStats[table] = {
                        routedTo: connKey,
                        recordCount: 0,
                        status: 'OFFLINE',
                    };
                }
            }
            catch (e) {
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
    getConnectionStatus() {
        const status = {};
        for (const [key, ds] of this.dataSources.entries()) {
            status[key] = {
                initialized: ds.isInitialized,
                database: ds.options.database,
                host: ds.options.host,
                port: ds.options.port,
            };
        }
        return {
            table_routes: this.routingConfig.table_routes,
            connections_status: status,
        };
    }
};
exports.DynamicDatabaseService = DynamicDatabaseService;
exports.DynamicDatabaseService = DynamicDatabaseService = DynamicDatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DynamicDatabaseService);
//# sourceMappingURL=dynamic-database.service.js.map