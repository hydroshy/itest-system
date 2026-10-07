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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NetworkServersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkServersService = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../database/dynamic-database.service");
const network_server_entity_1 = require("./entities/network-server.entity");
const device_entity_1 = require("../lorawan/entities/device.entity");
const gateway_entity_1 = require("../lorawan/entities/gateway.entity");
const downlink_log_entity_1 = require("./entities/downlink-log.entity");
const realtime_service_1 = require("../realtime/realtime.service");
const lorawan_resilience_service_1 = require("../lorawan/services/lorawan-resilience.service");
const lorawan_utils_1 = require("../lorawan/common/lorawan-utils");
let NetworkServersService = NetworkServersService_1 = class NetworkServersService {
    constructor(dbService, resilienceService, realtimeService) {
        this.dbService = dbService;
        this.resilienceService = resilienceService;
        this.realtimeService = realtimeService;
        this.logger = new common_1.Logger(NetworkServersService_1.name);
    }
    get serverRepo() {
        return this.dbService.getRepositoryForTable('network_servers', network_server_entity_1.NetworkServerEntity);
    }
    get deviceRepo() {
        return this.dbService.getRepositoryForTable('devices', device_entity_1.DeviceEntity);
    }
    get gatewayRepo() {
        return this.dbService.getRepositoryForTable('gateways', gateway_entity_1.GatewayEntity);
    }
    get downlinkRepo() {
        return this.dbService.getRepositoryForTable('downlink_logs', downlink_log_entity_1.DownlinkLogEntity);
    }
    async onModuleInit() {
        await this.ensureDownlinkLogsTable().catch((err) => {
            this.logger.warn(`Could not ensure downlink_logs table: ${err.message}`);
        });
    }
    async ensureDownlinkLogsTable() {
        try {
            const ds = this.dbService.getDataSourceForTable('downlink_logs');
            if (!ds || !ds.isInitialized)
                return;
            await ds.query(`
        CREATE TABLE IF NOT EXISTS "downlink_logs" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "devEUI" VARCHAR(50) NOT NULL,
          "deviceName" VARCHAR(255),
          "networkServerId" UUID,
          "networkServerName" VARCHAR(255),
          "serverType" VARCHAR(50) NOT NULL DEFAULT 'CHIRPSTACK',
          "fPort" INT NOT NULL DEFAULT 1,
          "payloadHex" TEXT NOT NULL,
          "confirmed" BOOLEAN NOT NULL DEFAULT false,
          "flushQueue" BOOLEAN NOT NULL DEFAULT false,
          "status" VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
          "errorMessage" TEXT,
          "responseDetails" JSONB,
          "sentBy" VARCHAR(255) NOT NULL DEFAULT 'anonymous',
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS "idx_downlink_logs_deveui" ON "downlink_logs" ("devEUI", "createdAt" DESC);
        CREATE INDEX IF NOT EXISTS "idx_downlink_logs_created_at" ON "downlink_logs" ("createdAt" DESC);
      `);
        }
        catch (e) {
            this.logger.warn(`ensureDownlinkLogsTable warning: ${e.message}`);
        }
    }
    async create(dto) {
        if (dto.isDefault) {
            await this.serverRepo.createQueryBuilder().update(network_server_entity_1.NetworkServerEntity).set({ isDefault: false }).execute().catch(() => { });
        }
        const regionProfiles = (dto.regionProfiles || []).map((rp, idx) => ({
            id: rp.id || `reg-${Date.now()}-${idx + 1}`,
            name: rp.name || `Region ${idx + 1}`,
            region: rp.region || 'AS923-1',
            routeRef: rp.routeRef ? String(rp.routeRef).trim() : undefined,
            profileId: rp.profileId ? String(rp.profileId).trim() : undefined,
            frequencyBand: rp.frequencyBand ? String(rp.frequencyBand).trim() : '',
            description: rp.description ? String(rp.description).trim() : '',
            isActive: rp.isActive !== false,
        }));
        const server = this.serverRepo.create({
            name: dto.name ? String(dto.name).trim() : 'Unnamed Server',
            type: dto.type || network_server_entity_1.NetworkServerType.THINGPARK,
            description: dto.description ? String(dto.description).trim() : '',
            apiUrl: dto.apiUrl ? String(dto.apiUrl).trim() : '',
            apiKey: dto.apiKey ? String(dto.apiKey).trim() : '',
            routeRef: dto.routeRef ? String(dto.routeRef).trim() : '',
            applicationId: dto.applicationId ? String(dto.applicationId).trim() : '',
            regionProfiles,
            status: dto.status || 'ONLINE',
            isDefault: Boolean(dto.isDefault),
            metadata: dto.metadata || {},
        });
        const saved = await this.serverRepo.save(server);
        this.logger.log(`Created Network Server [${saved.name}] (${saved.type}) ID=${saved.id}`);
        return saved;
    }
    async findAll() {
        const servers = await this.serverRepo.find({
            order: { createdAt: 'ASC' },
        });
        const results = await Promise.all(servers.map(async (srv) => {
            let deviceCount = 0;
            let gatewayCount = 0;
            try {
                deviceCount = await this.deviceRepo.count({ where: { networkServerId: srv.id } });
                gatewayCount = await this.gatewayRepo.count({ where: { networkServerId: srv.id } });
            }
            catch (e) { }
            return {
                ...srv,
                deviceCount,
                gatewayCount,
                regionProfilesCount: Array.isArray(srv.regionProfiles) ? srv.regionProfiles.length : 0,
            };
        }));
        return results;
    }
    async findOne(id) {
        const server = await this.serverRepo.findOne({ where: { id } });
        if (!server) {
            throw new common_1.NotFoundException(`Network Server with ID ${id} not found`);
        }
        return server;
    }
    async update(id, dto) {
        const server = await this.findOne(id);
        if (dto.isDefault && !server.isDefault) {
            await this.serverRepo.createQueryBuilder().update(network_server_entity_1.NetworkServerEntity).set({ isDefault: false }).execute().catch(() => { });
        }
        if (dto.name !== undefined && dto.name !== null)
            server.name = String(dto.name).trim();
        if (dto.type !== undefined && dto.type !== null)
            server.type = dto.type;
        if (dto.description !== undefined)
            server.description = dto.description ? String(dto.description).trim() : '';
        if (dto.apiUrl !== undefined)
            server.apiUrl = dto.apiUrl ? String(dto.apiUrl).trim() : '';
        if (dto.apiKey !== undefined)
            server.apiKey = dto.apiKey ? String(dto.apiKey).trim() : '';
        if (dto.routeRef !== undefined)
            server.routeRef = dto.routeRef ? String(dto.routeRef).trim() : '';
        if (dto.applicationId !== undefined)
            server.applicationId = dto.applicationId ? String(dto.applicationId).trim() : '';
        if (dto.status !== undefined && dto.status !== null)
            server.status = dto.status;
        if (dto.isDefault !== undefined && dto.isDefault !== null)
            server.isDefault = Boolean(dto.isDefault);
        if (dto.metadata !== undefined)
            server.metadata = dto.metadata || {};
        if (dto.regionProfiles !== undefined && Array.isArray(dto.regionProfiles)) {
            server.regionProfiles = dto.regionProfiles.map((rp, idx) => ({
                id: rp.id || `reg-${Date.now()}-${idx + 1}`,
                name: rp.name || `Region ${idx + 1}`,
                region: rp.region || 'AS923-1',
                routeRef: rp.routeRef ? String(rp.routeRef).trim() : undefined,
                profileId: rp.profileId ? String(rp.profileId).trim() : undefined,
                frequencyBand: rp.frequencyBand ? String(rp.frequencyBand).trim() : '',
                description: rp.description ? String(rp.description).trim() : '',
                isActive: rp.isActive !== false,
            }));
        }
        const updated = await this.serverRepo.save(server);
        this.logger.log(`Updated Network Server [${updated.name}] ID=${updated.id}`);
        return updated;
    }
    async remove(id) {
        const server = await this.findOne(id);
        try {
            await this.deviceRepo.update({ networkServerId: id }, { networkServerId: null });
            await this.gatewayRepo.update({ networkServerId: id }, { networkServerId: null });
        }
        catch (e) { }
        await this.serverRepo.remove(server);
        this.logger.log(`Deleted Network Server [${server.name}] ID=${id}`);
        return { success: true, message: `Network Server '${server.name}' deleted successfully` };
    }
    async addOrUpdateRegionProfile(id, profileDto) {
        const server = await this.findOne(id);
        const profiles = Array.isArray(server.regionProfiles) ? [...server.regionProfiles] : [];
        const existingIndex = profiles.findIndex((p) => p.id === profileDto.id);
        const newProfile = {
            id: profileDto.id || `reg-${Date.now()}`,
            name: profileDto.name,
            region: profileDto.region,
            routeRef: profileDto.routeRef,
            profileId: profileDto.profileId,
            frequencyBand: profileDto.frequencyBand || '',
            description: profileDto.description || '',
            isActive: profileDto.isActive !== false,
        };
        if (existingIndex >= 0) {
            profiles[existingIndex] = newProfile;
        }
        else {
            profiles.push(newProfile);
        }
        server.regionProfiles = profiles;
        return await this.serverRepo.save(server);
    }
    async deleteRegionProfile(id, profileId) {
        const server = await this.findOne(id);
        const profiles = Array.isArray(server.regionProfiles) ? [...server.regionProfiles] : [];
        server.regionProfiles = profiles.filter((p) => p.id !== profileId);
        return await this.serverRepo.save(server);
    }
    async testConnection(id) {
        const server = await this.findOne(id);
        const startTime = Date.now();
        if (!server.apiUrl && !server.routeRef && !server.apiKey) {
            server.status = 'CONFIGURED';
            await this.serverRepo.save(server).catch(() => { });
            return {
                success: true,
                serverType: server.type,
                serverName: server.name,
                latencyMs: 1,
                message: 'Network Server configuration verified (Webhook Ingestion Mode)',
                details: {
                    type: server.type,
                    routeRef: server.routeRef || '(None)',
                    regionProfilesCount: server.regionProfiles?.length || 0,
                    webhookEndpoint: server.type === network_server_entity_1.NetworkServerType.THINGPARK
                        ? '/lorawan/webhook/thingpark'
                        : '/lorawan/webhook/chirpstack',
                },
            };
        }
        if (server.apiUrl && (server.apiUrl.startsWith('http://') || server.apiUrl.startsWith('https://'))) {
            try {
                const headers = {
                    'Accept': 'application/json',
                };
                if (server.apiKey) {
                    headers['Authorization'] = `Bearer ${server.apiKey.trim()}`;
                    if (server.type === network_server_entity_1.NetworkServerType.THINGPARK) {
                        headers['X-API-KEY'] = server.apiKey.trim();
                    }
                }
                let targetUrl = server.apiUrl.trim();
                const rawBase = targetUrl.replace(/\/+$/, '');
                if (server.type === network_server_entity_1.NetworkServerType.CHIRPSTACK) {
                    if (server.applicationId) {
                        targetUrl = rawBase.endsWith('/api')
                            ? `${rawBase}/applications/${server.applicationId.trim()}`
                            : `${rawBase}/api/applications/${server.applicationId.trim()}`;
                    }
                    else {
                        targetUrl = rawBase.endsWith('/api')
                            ? `${rawBase}/tenants?limit=1`
                            : `${rawBase}/api/tenants?limit=1`;
                    }
                }
                let res = await this.resilienceService.safeFetch(targetUrl, { method: 'GET', headers }, { maxRetries: 1, timeoutMs: 4500 });
                if (!res.ok && res.status === 404 && targetUrl !== server.apiUrl.trim()) {
                    const fallbackRes = await this.resilienceService.safeFetch(server.apiUrl.trim(), { method: 'GET', headers }, { maxRetries: 1, timeoutMs: 4500 });
                    if (fallbackRes.ok || (fallbackRes.status && fallbackRes.status > 0)) {
                        res = fallbackRes;
                    }
                }
                const latencyMs = Date.now() - startTime;
                if (!res || !res.status) {
                    throw new Error('Connection timed out or host is unreachable');
                }
                const httpStatus = res.status;
                const isHealthy = httpStatus >= 200 && httpStatus < 400;
                let statusText = 'ONLINE';
                let userMessage = `Connected successfully to ${server.name} (HTTP ${httpStatus} - ${latencyMs}ms)`;
                if (!isHealthy) {
                    statusText = 'OFFLINE';
                    if (httpStatus === 401 || httpStatus === 403) {
                        userMessage = `Authentication Failed (HTTP ${httpStatus}): Invalid or missing Bearer API Token for ${server.name}`;
                    }
                    else if (httpStatus === 404) {
                        userMessage = `Endpoint Not Found (HTTP 404): Path not recognized on ${server.name}. Please verify API URL path or Application ID.`;
                    }
                    else if (httpStatus >= 500) {
                        userMessage = `Remote Server Error (HTTP ${httpStatus}): ${server.name} returned an internal error`;
                    }
                    else {
                        userMessage = `Connection Rejected (HTTP ${httpStatus}) by ${server.name}`;
                    }
                }
                server.status = isHealthy ? 'ONLINE' : 'OFFLINE';
                await this.serverRepo.save(server).catch(() => { });
                return {
                    success: isHealthy,
                    serverType: server.type,
                    serverName: server.name,
                    apiUrl: server.apiUrl,
                    latencyMs,
                    message: userMessage,
                    details: {
                        httpStatus,
                        testedUrl: targetUrl,
                        status: statusText,
                        latencyMs,
                        webhookTarget: server.type === network_server_entity_1.NetworkServerType.THINGPARK
                            ? '/lorawan/webhook/thingpark'
                            : '/lorawan/webhook/chirpstack',
                    },
                };
            }
            catch (err) {
                const latencyMs = Date.now() - startTime;
                server.status = 'OFFLINE';
                await this.serverRepo.save(server).catch(() => { });
                return {
                    success: false,
                    serverType: server.type,
                    serverName: server.name,
                    apiUrl: server.apiUrl,
                    latencyMs,
                    message: `Connection failed: ${err.message || 'Host unreachable'} (Marked as OFFLINE)`,
                    details: {
                        error: err.message,
                        status: 'OFFLINE',
                        webhookTarget: server.type === network_server_entity_1.NetworkServerType.THINGPARK
                            ? '/lorawan/webhook/thingpark'
                            : '/lorawan/webhook/chirpstack',
                    },
                };
            }
        }
        server.status = 'CONFIGURED';
        await this.serverRepo.save(server).catch(() => { });
        return {
            success: true,
            serverType: server.type,
            serverName: server.name,
            latencyMs: Date.now() - startTime,
            message: `Config for ${server.type} is ready for webhook reception`,
            details: {
                serverType: server.type,
                regionProfilesCount: server.regionProfiles?.length || 0,
            },
        };
    }
    async getLinkedDevices(id) {
        return await this.deviceRepo.find({ where: { networkServerId: id } });
    }
    async getLinkedGateways(id) {
        return await this.gatewayRepo.find({ where: { networkServerId: id } });
    }
    async sendDownlink(params) {
        const normEUI = (0, lorawan_utils_1.cleanDevEUI)(params.devEUI || '');
        const fPort = Math.max(1, Math.min(223, Number(params.fPort) || 1));
        const cleanHex = (0, lorawan_utils_1.cleanHexPayload)(params.payloadHex || '01');
        const author = (params.author || 'admin').trim();
        const flushQueue = Boolean(params.flushQueue);
        const confirmed = Boolean(params.confirmed);
        this.logger.log(`Dispatching Downlink to DevEUI=${normEUI || 'DEFAULT'}, Port=${fPort}, Hex=${cleanHex}, Flush=${flushQueue}, Confirmed=${confirmed}, Author=${author}`);
        let device = null;
        if (normEUI) {
            device = await this.deviceRepo.findOne({
                where: { devEUI: normEUI },
                relations: ['networkServer'],
            }).catch(() => null);
        }
        let server = null;
        if (params.networkServerId) {
            server = await this.serverRepo.findOne({ where: { id: params.networkServerId } }).catch(() => null);
        }
        if (!server && device?.networkServer) {
            server = device.networkServer;
        }
        else if (!server && device?.networkServerId) {
            server = await this.serverRepo.findOne({ where: { id: device.networkServerId } }).catch(() => null);
        }
        if (!server) {
            server = await this.serverRepo.findOne({ where: { isDefault: true } }).catch(() => null);
            if (!server) {
                server = await this.serverRepo.findOne({ order: { createdAt: 'ASC' } }).catch(() => null);
            }
        }
        if (!server) {
            const errRes = {
                success: false,
                status: 'NO_NETWORK_SERVER',
                message: 'No Network Server is configured or linked to this device.',
                devEUI: normEUI,
                fPort,
                payloadHex: cleanHex,
            };
            const failedLog = this.downlinkRepo.create({
                devEUI: normEUI,
                deviceName: device?.name || normEUI,
                serverType: 'UNKNOWN',
                fPort,
                payloadHex: cleanHex,
                confirmed,
                flushQueue,
                status: 'ERROR',
                errorMessage: errRes.message,
                sentBy: author,
            });
            await this.downlinkRepo.save(failedLog).catch(() => { });
            return { ...errRes, downlinkLog: failedLog };
        }
        const deviceName = device?.name || normEUI;
        const startTime = Date.now();
        if (!server.apiUrl || (!server.apiUrl.startsWith('http://') && !server.apiUrl.startsWith('https://'))) {
            this.logger.log(`Downlink buffered locally for ${server.name} (Webhook-only mode, no API URL)`);
            const msg = `Downlink [${cleanHex}] queued in local buffer. Server ${server.name} operates in webhook ingestion mode.`;
            const logEntity = this.downlinkRepo.create({
                devEUI: normEUI,
                deviceName,
                networkServerId: server.id,
                networkServerName: server.name,
                serverType: server.type,
                fPort,
                payloadHex: cleanHex,
                confirmed,
                flushQueue,
                status: 'QUEUED_LOCAL_BUFFER',
                errorMessage: null,
                responseDetails: { mode: 'LOCAL_BUFFER', note: 'Webhook-only ingestion' },
                sentBy: author,
            });
            const savedLog = await this.downlinkRepo.save(logEntity).catch(() => logEntity);
            if (this.realtimeService) {
                this.realtimeService.publishDownlink({
                    event: 'DOWNLINK_QUEUED',
                    devEUI: normEUI,
                    deviceName,
                    serverType: server.type,
                    fPort,
                    payloadHex: cleanHex,
                    confirmed,
                    flushQueue,
                    status: 'QUEUED_LOCAL_BUFFER',
                    sentBy: author,
                    createdAt: new Date().toISOString(),
                    downlinkLog: savedLog,
                });
            }
            return {
                success: true,
                status: 'QUEUED_LOCAL_BUFFER',
                message: msg,
                devEUI: normEUI,
                fPort,
                payloadHex: cleanHex,
                networkServerType: server.type,
                networkServerName: server.name,
                downlinkLog: savedLog,
            };
        }
        const rawBase = server.apiUrl.trim().replace(/\/+$/, '');
        try {
            if (server.type === network_server_entity_1.NetworkServerType.CHIRPSTACK) {
                const apiPrefix = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
                const queueUrl = `${apiPrefix}/devices/${normEUI.toLowerCase()}/queue`;
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                };
                if (server.apiKey) {
                    headers['Authorization'] = `Bearer ${server.apiKey.trim()}`;
                }
                if (flushQueue) {
                    try {
                        this.logger.log(`Flushing ChirpStack downlink queue for device [${normEUI}] -> DELETE ${queueUrl}`);
                        await this.resilienceService.safeFetch(queueUrl, {
                            method: 'DELETE',
                            headers,
                        });
                    }
                    catch (flushErr) {
                        this.logger.warn(`Failed to flush queue on ChirpStack: ${flushErr.message}`);
                    }
                }
                const base64Data = Buffer.from(cleanHex, 'hex').toString('base64');
                const chirpstackPayload = {
                    queueItem: {
                        confirmed,
                        data: base64Data,
                        fPort,
                        isPending: false,
                    },
                };
                const res = await this.resilienceService.safeFetch(queueUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(chirpstackPayload),
                });
                const latencyMs = Date.now() - startTime;
                if (res.ok) {
                    const resData = res.data || {};
                    this.logger.log(`✅ Downlink successfully queued to ChirpStack [${queueUrl}] in ${latencyMs}ms`);
                    const savedLog = await this.downlinkRepo.save(this.downlinkRepo.create({
                        devEUI: normEUI,
                        deviceName,
                        networkServerId: server.id,
                        networkServerName: server.name,
                        serverType: server.type,
                        fPort,
                        payloadHex: cleanHex,
                        confirmed,
                        flushQueue,
                        status: 'QUEUED',
                        errorMessage: null,
                        responseDetails: resData,
                        sentBy: author,
                    })).catch((e) => null);
                    if (this.realtimeService) {
                        this.realtimeService.publishDownlink({
                            event: 'DOWNLINK_QUEUED',
                            devEUI: normEUI,
                            deviceName,
                            serverType: server.type,
                            fPort,
                            payloadHex: cleanHex,
                            confirmed,
                            flushQueue,
                            status: 'QUEUED',
                            sentBy: author,
                            createdAt: new Date().toISOString(),
                            downlinkLog: savedLog,
                        });
                    }
                    return {
                        success: true,
                        status: 'QUEUED_TO_CHIRPSTACK',
                        message: `Downlink payload [${cleanHex}] (${Math.ceil(cleanHex.length / 2)} Bytes) queued to ChirpStack on fPort ${fPort}${flushQueue ? ' (Queue Flushed)' : ''} in ${latencyMs}ms`,
                        devEUI: normEUI,
                        fPort,
                        payloadHex: cleanHex,
                        networkServerType: server.type,
                        networkServerName: server.name,
                        details: resData,
                        downlinkLog: savedLog || undefined,
                    };
                }
                else {
                    const errText = res.error || (typeof res.data === 'string' ? res.data : JSON.stringify(res.data || ''));
                    this.logger.warn(`ChirpStack rejected downlink (HTTP ${res.status}): ${errText}`);
                    const savedLog = await this.downlinkRepo.save(this.downlinkRepo.create({
                        devEUI: normEUI,
                        deviceName,
                        networkServerId: server.id,
                        networkServerName: server.name,
                        serverType: server.type,
                        fPort,
                        payloadHex: cleanHex,
                        confirmed,
                        flushQueue,
                        status: 'ERROR',
                        errorMessage: `ChirpStack HTTP ${res.status}: ${errText.slice(0, 200)}`,
                        responseDetails: { httpStatus: res.status, error: errText },
                        sentBy: author,
                    })).catch((e) => null);
                    return {
                        success: false,
                        status: res.status === 404 ? 'DEVICE_NOT_FOUND_ON_CHIRPSTACK' : 'CHIRPSTACK_REJECTED',
                        message: `ChirpStack returned HTTP ${res.status}: ${errText.slice(0, 150) || 'Rejected'}`,
                        devEUI: normEUI,
                        fPort,
                        payloadHex: cleanHex,
                        networkServerType: server.type,
                        networkServerName: server.name,
                        details: { httpStatus: res.status, error: errText },
                        downlinkLog: savedLog || undefined,
                    };
                }
            }
            else {
                const targetUrl = rawBase.includes('/thingpark')
                    ? `${rawBase}/devices/${normEUI}/downlink`
                    : `${rawBase}/thingpark/dx/core/v1/rest/devices/${normEUI}/downlink`;
                const headers = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                };
                if (server.apiKey) {
                    headers['Authorization'] = `Bearer ${server.apiKey.trim()}`;
                    headers['X-API-KEY'] = server.apiKey.trim();
                }
                if (flushQueue) {
                    try {
                        this.logger.log(`Flushing ThingPark downlink queue for device [${normEUI}] -> DELETE ${targetUrl}`);
                        await this.resilienceService.safeFetch(targetUrl, {
                            method: 'DELETE',
                            headers,
                        });
                    }
                    catch (e) { }
                }
                const thingparkPayload = {
                    fPort,
                    payload: cleanHex,
                    confirmed,
                    flush: flushQueue,
                    clearQueue: flushQueue,
                };
                const res = await this.resilienceService.safeFetch(targetUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(thingparkPayload),
                });
                const latencyMs = Date.now() - startTime;
                if (res.ok) {
                    const resData = res.data || {};
                    this.logger.log(`✅ Downlink successfully queued to ThingPark [${targetUrl}] in ${latencyMs}ms`);
                    const savedLog = await this.downlinkRepo.save(this.downlinkRepo.create({
                        devEUI: normEUI,
                        deviceName,
                        networkServerId: server.id,
                        networkServerName: server.name,
                        serverType: server.type,
                        fPort,
                        payloadHex: cleanHex,
                        confirmed,
                        flushQueue,
                        status: 'QUEUED',
                        errorMessage: null,
                        responseDetails: resData,
                        sentBy: author,
                    })).catch((e) => null);
                    if (this.realtimeService) {
                        this.realtimeService.publishDownlink({
                            event: 'DOWNLINK_QUEUED',
                            devEUI: normEUI,
                            deviceName,
                            serverType: server.type,
                            fPort,
                            payloadHex: cleanHex,
                            confirmed,
                            flushQueue,
                            status: 'QUEUED',
                            sentBy: author,
                            createdAt: new Date().toISOString(),
                            downlinkLog: savedLog,
                        });
                    }
                    return {
                        success: true,
                        status: 'QUEUED_TO_THINGPARK',
                        message: `Downlink payload [${cleanHex}] (${Math.ceil(cleanHex.length / 2)} Bytes) queued to ThingPark on fPort ${fPort}${flushQueue ? ' (Queue Flushed)' : ''} in ${latencyMs}ms`,
                        devEUI: normEUI,
                        fPort,
                        payloadHex: cleanHex,
                        networkServerType: server.type,
                        networkServerName: server.name,
                        details: resData,
                        downlinkLog: savedLog || undefined,
                    };
                }
                else {
                    const errText = res.error || (typeof res.data === 'string' ? res.data : JSON.stringify(res.data || ''));
                    this.logger.warn(`ThingPark rejected downlink (HTTP ${res.status}): ${errText}`);
                    const savedLog = await this.downlinkRepo.save(this.downlinkRepo.create({
                        devEUI: normEUI,
                        deviceName,
                        networkServerId: server.id,
                        networkServerName: server.name,
                        serverType: server.type,
                        fPort,
                        payloadHex: cleanHex,
                        confirmed,
                        flushQueue,
                        status: 'ERROR',
                        errorMessage: `ThingPark HTTP ${res.status}: ${errText.slice(0, 200)}`,
                        responseDetails: { httpStatus: res.status, error: errText },
                        sentBy: author,
                    })).catch((e) => null);
                    return {
                        success: false,
                        status: 'THINGPARK_REJECTED',
                        message: `ThingPark returned HTTP ${res.status}: ${errText.slice(0, 150) || 'Rejected'}`,
                        devEUI: normEUI,
                        fPort,
                        payloadHex: cleanHex,
                        networkServerType: server.type,
                        networkServerName: server.name,
                        details: { httpStatus: res.status, error: errText },
                        downlinkLog: savedLog || undefined,
                    };
                }
            }
        }
        catch (err) {
            this.logger.warn(`Failed to connect to ${server.name} at ${server.apiUrl}: ${err.message}`);
            const savedLog = await this.downlinkRepo.save(this.downlinkRepo.create({
                devEUI: normEUI,
                deviceName,
                networkServerId: server.id,
                networkServerName: server.name,
                serverType: server.type,
                fPort,
                payloadHex: cleanHex,
                confirmed,
                flushQueue,
                status: 'ERROR',
                errorMessage: `Connection error: ${err.message}`,
                responseDetails: { error: err.message },
                sentBy: author,
            })).catch((e) => null);
            return {
                success: false,
                status: 'LNS_CONNECTION_ERROR',
                message: `Connection error to ${server.name}: ${err.message}`,
                devEUI: normEUI,
                fPort,
                payloadHex: cleanHex,
                networkServerType: server.type,
                networkServerName: server.name,
                details: { error: err.message },
                downlinkLog: savedLog || undefined,
            };
        }
    }
    async getDownlinkHistory(params) {
        const repo = this.downlinkRepo;
        const where = {};
        if (params?.devEUI) {
            where.devEUI = params.devEUI.trim().toUpperCase();
        }
        const limit = Math.min(200, Math.max(1, Number(params?.limit) || 50));
        try {
            return await repo.find({
                where: Object.keys(where).length > 0 ? where : undefined,
                order: { createdAt: 'DESC' },
                take: limit,
            });
        }
        catch (e) {
            this.logger.warn(`Error querying downlink history: ${e.message}`);
            return [];
        }
    }
    async flushDeviceQueue(params) {
        const normEUI = (0, lorawan_utils_1.cleanDevEUI)(params.devEUI || '');
        const author = (params.author || 'admin').trim();
        if (!normEUI) {
            return {
                success: false,
                message: 'Invalid or missing DevEUI.',
            };
        }
        let device = null;
        device = await this.deviceRepo.findOne({
            where: { devEUI: normEUI },
            relations: ['networkServer'],
        }).catch(() => null);
        let server = null;
        if (params.networkServerId) {
            server = await this.serverRepo.findOne({ where: { id: params.networkServerId } }).catch(() => null);
        }
        if (!server && device?.networkServer)
            server = device.networkServer;
        if (!server && device?.networkServerId) {
            server = await this.serverRepo.findOne({ where: { id: device.networkServerId } }).catch(() => null);
        }
        if (!server) {
            server = await this.serverRepo.findOne({ where: { isDefault: true } }).catch(() => null);
        }
        if (!server) {
            server = await this.serverRepo.findOne({ order: { createdAt: 'ASC' } }).catch(() => null);
        }
        if (!server || !server.apiUrl) {
            return {
                success: false,
                message: 'No Network Server or API URL configured to flush queue.',
            };
        }
        const rawBase = server.apiUrl.trim().replace(/\/+$/, '');
        try {
            if (server.type === network_server_entity_1.NetworkServerType.CHIRPSTACK) {
                const apiPrefix = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
                const queueUrl = `${apiPrefix}/devices/${normEUI.toLowerCase()}/queue`;
                const res = await this.resilienceService.safeFetch(queueUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${server.apiKey || ''}`,
                        'Accept': 'application/json',
                    },
                });
                const ok = res.ok || res.status === 404;
                await this.downlinkRepo.save(this.downlinkRepo.create({
                    devEUI: normEUI,
                    deviceName: device?.name || normEUI,
                    networkServerId: server.id,
                    networkServerName: server.name,
                    serverType: server.type,
                    fPort: 0,
                    payloadHex: 'FLUSH_QUEUE',
                    confirmed: false,
                    flushQueue: true,
                    status: ok ? 'FLUSHED' : 'ERROR',
                    errorMessage: ok ? null : `HTTP ${res.status}`,
                    sentBy: author,
                })).catch(() => { });
                return {
                    success: ok,
                    message: ok
                        ? `Successfully flushed downlink queue for ${normEUI} on ChirpStack`
                        : `ChirpStack flush queue returned HTTP ${res.status}: ${res.error || 'Failed'}`,
                };
            }
            else {
                const targetUrl = rawBase.includes('/thingpark')
                    ? `${rawBase}/devices/${normEUI}/downlink`
                    : `${rawBase}/thingpark/dx/core/v1/rest/devices/${normEUI}/downlink`;
                const res = await this.resilienceService.safeFetch(targetUrl, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${server.apiKey || ''}`,
                        'X-API-KEY': server.apiKey || '',
                    },
                });
                const ok = res.ok || res.status === 404;
                await this.downlinkRepo.save(this.downlinkRepo.create({
                    devEUI: normEUI,
                    deviceName: device?.name || normEUI,
                    networkServerId: server.id,
                    networkServerName: server.name,
                    serverType: server.type,
                    fPort: 0,
                    payloadHex: 'FLUSH_QUEUE',
                    confirmed: false,
                    flushQueue: true,
                    status: ok ? 'FLUSHED' : 'ERROR',
                    errorMessage: ok ? null : `HTTP ${res.status}`,
                    sentBy: author,
                })).catch(() => { });
                return {
                    success: ok,
                    message: ok
                        ? `Successfully flushed downlink queue for ${normEUI} on ThingPark`
                        : `ThingPark flush queue returned HTTP ${res.status}: ${res.error || 'Failed'}`,
                };
            }
        }
        catch (err) {
            return {
                success: false,
                message: err.message || 'Failed to flush queue',
            };
        }
    }
    async getDeviceQueue(params) {
        const normEUI = (0, lorawan_utils_1.cleanDevEUI)(params.devEUI || '');
        if (!normEUI) {
            return { totalCount: 0, items: [], serverType: 'NONE' };
        }
        const device = await this.deviceRepo
            .findOne({ where: { devEUI: normEUI }, relations: ['networkServer'] })
            .catch(() => null);
        let server = null;
        if (params.networkServerId) {
            server = await this.serverRepo.findOne({ where: { id: params.networkServerId } }).catch(() => null);
        }
        if (!server && device?.networkServer)
            server = device.networkServer;
        if (!server && device?.networkServerId) {
            server = await this.serverRepo.findOne({ where: { id: device.networkServerId } }).catch(() => null);
        }
        if (!server) {
            server = await this.serverRepo.findOne({ where: { isDefault: true } }).catch(() => null);
        }
        if (server && server.type === network_server_entity_1.NetworkServerType.CHIRPSTACK && server.apiUrl) {
            const rawBase = server.apiUrl.trim().replace(/\/+$/, '');
            const apiPrefix = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
            const queueUrl = `${apiPrefix}/devices/${normEUI.toLowerCase()}/queue`;
            try {
                const headers = {
                    'Accept': 'application/json',
                };
                if (server.apiKey) {
                    headers['Authorization'] = `Bearer ${server.apiKey.trim()}`;
                }
                const res = await this.resilienceService.safeFetch(queueUrl, { method: 'GET', headers });
                if (res.ok && res.data) {
                    const data = res.data;
                    const rawItems = data.result || data.items || [];
                    const items = rawItems.map((it) => {
                        let hex = '';
                        if (it.data) {
                            try {
                                hex = Buffer.from(it.data, 'base64').toString('hex').toUpperCase();
                            }
                            catch {
                                hex = String(it.data);
                            }
                        }
                        return {
                            id: it.id,
                            fPort: it.fPort || 1,
                            confirmed: Boolean(it.confirmed),
                            payloadHex: hex,
                            isPending: Boolean(it.isPending),
                            fCntDown: it.fCntDown,
                            createdAt: it.createdAt || null,
                        };
                    });
                    return {
                        totalCount: data.totalCount !== undefined ? Number(data.totalCount) : items.length,
                        items,
                        serverType: server.type,
                        serverName: server.name,
                    };
                }
            }
            catch (err) {
                this.logger.warn(`Failed to fetch live queue from ChirpStack for ${normEUI}: ${err.message}`);
            }
        }
        const queuedLogs = await this.downlinkRepo.find({
            where: { devEUI: normEUI, status: 'QUEUED' },
            order: { createdAt: 'DESC' },
            take: 20,
        }).catch(() => []);
        const items = queuedLogs.map((l) => ({
            id: l.id,
            fPort: l.fPort,
            confirmed: l.confirmed,
            payloadHex: l.payloadHex,
            isPending: true,
            createdAt: l.createdAt,
        }));
        return {
            totalCount: items.length,
            items,
            serverType: server?.type || 'LOCAL_DB',
            serverName: server?.name,
        };
    }
};
exports.NetworkServersService = NetworkServersService;
exports.NetworkServersService = NetworkServersService = NetworkServersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService,
        lorawan_resilience_service_1.LorawanResilienceService,
        realtime_service_1.RealtimeService])
], NetworkServersService);
//# sourceMappingURL=network-servers.service.js.map