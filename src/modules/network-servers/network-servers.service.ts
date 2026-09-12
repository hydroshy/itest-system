import { Injectable, NotFoundException, BadRequestException, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { NetworkServerEntity, NetworkServerType, RegionProfile } from './entities/network-server.entity';
import { CreateNetworkServerDto, UpdateNetworkServerDto, RegionProfileDto } from './dto/network-server.dto';
import { DeviceEntity } from '../lorawan/entities/device.entity';
import { GatewayEntity } from '../lorawan/entities/gateway.entity';
import { DownlinkLogEntity } from './entities/downlink-log.entity';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class NetworkServersService implements OnModuleInit {
  private readonly logger = new Logger(NetworkServersService.name);

  constructor(
    private readonly dbService: DynamicDatabaseService,
    @Optional() private readonly realtimeService?: RealtimeService,
  ) {}

  private get serverRepo() {
    return this.dbService.getRepositoryForTable('network_servers', NetworkServerEntity);
  }

  private get deviceRepo() {
    return this.dbService.getRepositoryForTable('devices', DeviceEntity);
  }

  private get gatewayRepo() {
    return this.dbService.getRepositoryForTable('gateways', GatewayEntity);
  }

  private get downlinkRepo() {
    return this.dbService.getRepositoryForTable('downlink_logs', DownlinkLogEntity);
  }

  async onModuleInit() {
    await this.ensureDownlinkLogsTable().catch((err) => {
      this.logger.warn(`Could not ensure downlink_logs table: ${err.message}`);
    });
  }

  private async ensureDownlinkLogsTable() {
    try {
      const ds = this.dbService.getDataSourceForTable('downlink_logs');
      if (!ds || !ds.isInitialized) return;
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
    } catch (e: any) {
      this.logger.warn(`ensureDownlinkLogsTable warning: ${e.message}`);
    }
  }

  async create(dto: CreateNetworkServerDto): Promise<NetworkServerEntity> {
    if (dto.isDefault) {
      await this.serverRepo.createQueryBuilder().update(NetworkServerEntity).set({ isDefault: false }).execute().catch(() => {});
    }

    const regionProfiles: RegionProfile[] = (dto.regionProfiles || []).map((rp, idx) => ({
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
      type: dto.type || NetworkServerType.THINGPARK,
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

  async findAll(): Promise<any[]> {
    const servers = await this.serverRepo.find({
      order: { createdAt: 'ASC' },
    });

    // Enhance with device and gateway counts
    const results = await Promise.all(
      servers.map(async (srv) => {
        let deviceCount = 0;
        let gatewayCount = 0;
        try {
          deviceCount = await this.deviceRepo.count({ where: { networkServerId: srv.id } });
          gatewayCount = await this.gatewayRepo.count({ where: { networkServerId: srv.id } });
        } catch (e) {}

        return {
          ...srv,
          deviceCount,
          gatewayCount,
          regionProfilesCount: Array.isArray(srv.regionProfiles) ? srv.regionProfiles.length : 0,
        };
      }),
    );

    return results;
  }

  async findOne(id: string): Promise<NetworkServerEntity> {
    const server = await this.serverRepo.findOne({ where: { id } });
    if (!server) {
      throw new NotFoundException(`Network Server with ID ${id} not found`);
    }
    return server;
  }

  async update(id: string, dto: UpdateNetworkServerDto): Promise<NetworkServerEntity> {
    const server = await this.findOne(id);

    if (dto.isDefault && !server.isDefault) {
      await this.serverRepo.createQueryBuilder().update(NetworkServerEntity).set({ isDefault: false }).execute().catch(() => {});
    }

    if (dto.name !== undefined && dto.name !== null) server.name = String(dto.name).trim();
    if (dto.type !== undefined && dto.type !== null) server.type = dto.type;
    if (dto.description !== undefined) server.description = dto.description ? String(dto.description).trim() : '';
    if (dto.apiUrl !== undefined) server.apiUrl = dto.apiUrl ? String(dto.apiUrl).trim() : '';
    if (dto.apiKey !== undefined) server.apiKey = dto.apiKey ? String(dto.apiKey).trim() : '';
    if (dto.routeRef !== undefined) server.routeRef = dto.routeRef ? String(dto.routeRef).trim() : '';
    if (dto.applicationId !== undefined) server.applicationId = dto.applicationId ? String(dto.applicationId).trim() : '';
    if (dto.status !== undefined && dto.status !== null) server.status = dto.status;
    if (dto.isDefault !== undefined && dto.isDefault !== null) server.isDefault = Boolean(dto.isDefault);
    if (dto.metadata !== undefined) server.metadata = dto.metadata || {};

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

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const server = await this.findOne(id);

    // Unlink any devices and gateways
    try {
      await this.deviceRepo.update({ networkServerId: id }, { networkServerId: null as any });
      await this.gatewayRepo.update({ networkServerId: id }, { networkServerId: null as any });
    } catch (e) {}

    await this.serverRepo.remove(server);
    this.logger.log(`Deleted Network Server [${server.name}] ID=${id}`);
    return { success: true, message: `Network Server '${server.name}' deleted successfully` };
  }

  async addOrUpdateRegionProfile(id: string, profileDto: RegionProfileDto): Promise<NetworkServerEntity> {
    const server = await this.findOne(id);
    const profiles = Array.isArray(server.regionProfiles) ? [...server.regionProfiles] : [];

    const existingIndex = profiles.findIndex((p) => p.id === profileDto.id);
    const newProfile: RegionProfile = {
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
    } else {
      profiles.push(newProfile);
    }

    server.regionProfiles = profiles;
    return await this.serverRepo.save(server);
  }

  async deleteRegionProfile(id: string, profileId: string): Promise<NetworkServerEntity> {
    const server = await this.findOne(id);
    const profiles = Array.isArray(server.regionProfiles) ? [...server.regionProfiles] : [];
    server.regionProfiles = profiles.filter((p) => p.id !== profileId);
    return await this.serverRepo.save(server);
  }

  async testConnection(id: string): Promise<{
    success: boolean;
    serverType: string;
    serverName: string;
    apiUrl?: string;
    latencyMs: number;
    message: string;
    details: any;
  }> {
    const server = await this.findOne(id);
    const startTime = Date.now();

    // Check standalone mode
    if (!server.apiUrl && !server.routeRef && !server.apiKey) {
      server.status = 'CONFIGURED';
      await this.serverRepo.save(server).catch(() => {});
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
          webhookEndpoint:
            server.type === NetworkServerType.THINGPARK
              ? '/lorawan/webhook/thingpark'
              : '/lorawan/webhook/chirpstack',
        },
      };
    }

    // Try HTTP connection if apiUrl is defined
    if (server.apiUrl && (server.apiUrl.startsWith('http://') || server.apiUrl.startsWith('https://'))) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        if (server.apiKey) {
          headers['Authorization'] = `Bearer ${server.apiKey.trim()}`;
          if (server.type === NetworkServerType.THINGPARK) {
            headers['X-API-KEY'] = server.apiKey.trim();
          }
        }

        // Determine target URL for probing
        let targetUrl = server.apiUrl.trim();
        const rawBase = targetUrl.replace(/\/+$/, '');

        // If ChirpStack, probe REST API endpoint
        if (server.type === NetworkServerType.CHIRPSTACK) {
          if (server.applicationId) {
            targetUrl = rawBase.endsWith('/api')
              ? `${rawBase}/applications/${server.applicationId.trim()}`
              : `${rawBase}/api/applications/${server.applicationId.trim()}`;
          } else {
            targetUrl = rawBase.endsWith('/api')
              ? `${rawBase}/tenants?limit=1`
              : `${rawBase}/api/tenants?limit=1`;
          }
        }

        let res = await fetch(targetUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        }).catch(() => null);

        // Fallback to base URL if subpath failed
        if (!res && targetUrl !== server.apiUrl.trim()) {
          res = await fetch(server.apiUrl.trim(), {
            method: 'GET',
            headers,
            signal: controller.signal,
          }).catch((err) => {
            throw err;
          });
        }

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (!res) {
          throw new Error('Connection timed out or host is unreachable');
        }

        // Strict HTTP status code evaluation
        const httpStatus = res.status;
        const isHealthy = httpStatus >= 200 && httpStatus < 400;

        let statusText = 'ONLINE';
        let userMessage = `Connected successfully to ${server.name} (HTTP ${httpStatus} - ${latencyMs}ms)`;

        if (!isHealthy) {
          statusText = 'OFFLINE';
          if (httpStatus === 401 || httpStatus === 403) {
            userMessage = `Authentication Failed (HTTP ${httpStatus}): Invalid or missing Bearer API Token for ${server.name}`;
          } else if (httpStatus === 404) {
            userMessage = `Endpoint Not Found (HTTP 404): Path not recognized on ${server.name}. Please verify API URL path or Application ID.`;
          } else if (httpStatus >= 500) {
            userMessage = `Remote Server Error (HTTP ${httpStatus}): ${server.name} returned an internal error`;
          } else {
            userMessage = `Connection Rejected (HTTP ${httpStatus}) by ${server.name}`;
          }
        }

        // Update database record status
        server.status = isHealthy ? 'ONLINE' : 'OFFLINE';
        await this.serverRepo.save(server).catch(() => {});

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
            webhookTarget:
              server.type === NetworkServerType.THINGPARK
                ? '/lorawan/webhook/thingpark'
                : '/lorawan/webhook/chirpstack',
          },
        };
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        server.status = 'OFFLINE';
        await this.serverRepo.save(server).catch(() => {});

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
            webhookTarget:
              server.type === NetworkServerType.THINGPARK
                ? '/lorawan/webhook/thingpark'
                : '/lorawan/webhook/chirpstack',
          },
        };
      }
    }

    server.status = 'CONFIGURED';
    await this.serverRepo.save(server).catch(() => {});

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

  async getLinkedDevices(id: string): Promise<DeviceEntity[]> {
    return await this.deviceRepo.find({ where: { networkServerId: id } });
  }

  async getLinkedGateways(id: string): Promise<GatewayEntity[]> {
    return await this.gatewayRepo.find({ where: { networkServerId: id } });
  }

  /**
   * Dispatches a real LoRaWAN downlink payload to the device's Network Server (ChirpStack v3/v4 or ThingPark Wireless)
   */
  async sendDownlink(params: {
    devEUI: string;
    fPort?: number;
    payloadHex?: string;
    confirmed?: boolean;
    flushQueue?: boolean;
    author?: string;
    networkServerId?: string;
  }): Promise<{
    success: boolean;
    status: string;
    message: string;
    devEUI: string;
    fPort: number;
    payloadHex: string;
    networkServerType?: string;
    networkServerName?: string;
    details?: any;
    downlinkLog?: DownlinkLogEntity;
  }> {
    const normEUI = (params.devEUI || '').trim().toUpperCase();
    const fPort = Math.max(1, Math.min(223, Number(params.fPort) || 1));
    const cleanHex = (params.payloadHex || '01').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    const author = (params.author || 'admin').trim();
    const flushQueue = Boolean(params.flushQueue);
    const confirmed = Boolean(params.confirmed);

    this.logger.log(`Dispatching Downlink to DevEUI=${normEUI || 'DEFAULT'}, Port=${fPort}, Hex=${cleanHex}, Flush=${flushQueue}, Confirmed=${confirmed}, Author=${author}`);

    // 1. Locate Device in DB
    let device: DeviceEntity | null = null;
    if (normEUI) {
      device = await this.deviceRepo.findOne({
        where: { devEUI: normEUI },
        relations: ['networkServer'],
      }).catch(() => null);
    }

    // 2. Resolve target Network Server (Explicit selection -> Device linked -> Default -> First available)
    let server: NetworkServerEntity | null = null;
    if (params.networkServerId) {
      server = await this.serverRepo.findOne({ where: { id: params.networkServerId } }).catch(() => null);
    }

    if (!server && device?.networkServer) {
      server = device.networkServer;
    } else if (!server && device?.networkServerId) {
      server = await this.serverRepo.findOne({ where: { id: device.networkServerId } }).catch(() => null);
    }

    if (!server) {
      // Fallback to default or first active network server
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
      await this.downlinkRepo.save(failedLog).catch(() => {});

      return { ...errRes, downlinkLog: failedLog };
    }

    const deviceName = device?.name || normEUI;

    // 3. Dispatch based on Server Type
    const startTime = Date.now();

    // Mode A: Webhook-only / Standalone buffer (no apiUrl configured)
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

    // Mode B: HTTP REST Downlink to ChirpStack or ThingPark
    const rawBase = server.apiUrl.trim().replace(/\/+$/, '');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      if (server.type === NetworkServerType.CHIRPSTACK) {
        const apiPrefix = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
        const queueUrl = `${apiPrefix}/devices/${normEUI.toLowerCase()}/queue`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        if (server.apiKey) {
          headers['Authorization'] = `Bearer ${server.apiKey.trim()}`;
        }

        // Optional Flush Queue for ChirpStack v4
        if (flushQueue) {
          try {
            this.logger.log(`Flushing ChirpStack downlink queue for device [${normEUI}] -> DELETE ${queueUrl}`);
            await fetch(queueUrl, {
              method: 'DELETE',
              headers,
            });
          } catch (flushErr: any) {
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

        const res = await fetch(queueUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(chirpstackPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          this.logger.log(`✅ Downlink successfully queued to ChirpStack [${queueUrl}] in ${latencyMs}ms`);

          const savedLog = await this.downlinkRepo.save(
            this.downlinkRepo.create({
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
            }),
          ).catch((e) => null);

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
        } else {
          const errText = await res.text().catch(() => '');
          this.logger.warn(`ChirpStack rejected downlink (HTTP ${res.status}): ${errText}`);

          const savedLog = await this.downlinkRepo.save(
            this.downlinkRepo.create({
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
            }),
          ).catch((e) => null);

          return {
            success: false,
            status: res.status === 404 ? 'DEVICE_NOT_FOUND_ON_CHIRPSTACK' : 'CHIRPSTACK_REJECTED',
            message: `ChirpStack returned HTTP ${res.status}: ${errText.slice(0, 150) || res.statusText}`,
            devEUI: normEUI,
            fPort,
            payloadHex: cleanHex,
            networkServerType: server.type,
            networkServerName: server.name,
            details: { httpStatus: res.status, error: errText },
            downlinkLog: savedLog || undefined,
          };
        }
      } else {
        // ThingPark Wireless Actility Downlink API: POST {apiUrl}/thingpark/dx/core/v1/rest/devices/{devEUI}/downlink
        const targetUrl = rawBase.includes('/thingpark')
          ? `${rawBase}/devices/${normEUI}/downlink`
          : `${rawBase}/thingpark/dx/core/v1/rest/devices/${normEUI}/downlink`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        if (server.apiKey) {
          headers['Authorization'] = `Bearer ${server.apiKey.trim()}`;
          headers['X-API-KEY'] = server.apiKey.trim();
        }

        // Optional Flush Queue for ThingPark
        if (flushQueue) {
          try {
            this.logger.log(`Flushing ThingPark downlink queue for device [${normEUI}] -> DELETE ${targetUrl}`);
            await fetch(targetUrl, {
              method: 'DELETE',
              headers,
            }).catch(() => {});
          } catch (e) {}
        }

        const thingparkPayload = {
          fPort,
          payload: cleanHex,
          confirmed,
          flush: flushQueue,
          clearQueue: flushQueue,
        };

        const res = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(thingparkPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          this.logger.log(`✅ Downlink successfully queued to ThingPark [${targetUrl}] in ${latencyMs}ms`);

          const savedLog = await this.downlinkRepo.save(
            this.downlinkRepo.create({
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
            }),
          ).catch((e) => null);

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
        } else {
          const errText = await res.text().catch(() => '');
          this.logger.warn(`ThingPark rejected downlink (HTTP ${res.status}): ${errText}`);

          const savedLog = await this.downlinkRepo.save(
            this.downlinkRepo.create({
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
            }),
          ).catch((e) => null);

          return {
            success: false,
            status: 'THINGPARK_REJECTED',
            message: `ThingPark returned HTTP ${res.status}: ${errText.slice(0, 150) || res.statusText}`,
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
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.logger.warn(`Failed to connect to ${server.name} at ${server.apiUrl}: ${err.message}`);

      const savedLog = await this.downlinkRepo.save(
        this.downlinkRepo.create({
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
        }),
      ).catch((e) => null);

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

  /**
   * Retrieves downlink audit logs from database, optionally filtered by DevEUI
   */
  async getDownlinkHistory(params?: {
    devEUI?: string;
    limit?: number;
  }): Promise<DownlinkLogEntity[]> {
    const repo = this.downlinkRepo;
    const where: any = {};
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
    } catch (e: any) {
      this.logger.warn(`Error querying downlink history: ${e.message}`);
      return [];
    }
  }

  /**
   * Explicitly flushes the downlink queue of a device on its Network Server
   */
  async flushDeviceQueue(params: {
    devEUI: string;
    networkServerId?: string;
    author?: string;
  }): Promise<{ success: boolean; message: string; details?: any }> {
    const normEUI = (params.devEUI || '').trim().toUpperCase();
    const author = (params.author || 'admin').trim();

    let device: DeviceEntity | null = null;
    if (normEUI) {
      device = await this.deviceRepo.findOne({
        where: { devEUI: normEUI },
        relations: ['networkServer'],
      }).catch(() => null);
    }

    let server: NetworkServerEntity | null = null;
    if (params.networkServerId) {
      server = await this.serverRepo.findOne({ where: { id: params.networkServerId } }).catch(() => null);
    }
    if (!server && device?.networkServer) server = device.networkServer;
    if (!server && device?.networkServerId) {
      server = await this.serverRepo.findOne({ where: { id: device.networkServerId } }).catch(() => null);
    }
    if (!server) {
      server = await this.serverRepo.findOne({ where: { isDefault: true } }).catch(() => null);
    }

    if (!server || !server.apiUrl) {
      return {
        success: false,
        message: 'No Network Server or API URL configured to flush queue.',
      };
    }

    const rawBase = server.apiUrl.trim().replace(/\/+$/, '');
    try {
      if (server.type === NetworkServerType.CHIRPSTACK) {
        const apiPrefix = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
        const queueUrl = `${apiPrefix}/devices/${normEUI.toLowerCase()}/queue`;
        const res = await fetch(queueUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${server.apiKey || ''}`,
            'Accept': 'application/json',
          },
        });
        const ok = res.ok || res.status === 404;

        await this.downlinkRepo.save(
          this.downlinkRepo.create({
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
          }),
        ).catch(() => {});

        return {
          success: ok,
          message: ok
            ? `Successfully flushed downlink queue for ${normEUI} on ChirpStack`
            : `ChirpStack flush queue returned HTTP ${res.status}`,
        };
      } else {
        const targetUrl = rawBase.includes('/thingpark')
          ? `${rawBase}/devices/${normEUI}/downlink`
          : `${rawBase}/thingpark/dx/core/v1/rest/devices/${normEUI}/downlink`;
        const res = await fetch(targetUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${server.apiKey || ''}`,
            'X-API-KEY': server.apiKey || '',
          },
        });
        const ok = res.ok || res.status === 404;

        await this.downlinkRepo.save(
          this.downlinkRepo.create({
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
          }),
        ).catch(() => {});

        return {
          success: ok,
          message: ok
            ? `Successfully flushed downlink queue for ${normEUI} on ThingPark`
            : `ThingPark flush queue returned HTTP ${res.status}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to flush queue: ${err.message}`,
      };
    }
  }

  async getDeviceQueue(params: {
    devEUI: string;
    networkServerId?: string;
  }): Promise<{
    totalCount: number;
    items: Array<{
      id?: string;
      fPort: number;
      confirmed: boolean;
      payloadHex: string;
      isPending?: boolean;
      fCntDown?: number;
      createdAt?: any;
    }>;
    serverType: string;
    serverName?: string;
  }> {
    const normEUI = (params.devEUI || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    if (!normEUI) {
      return { totalCount: 0, items: [], serverType: 'NONE' };
    }

    const device = await this.deviceRepo
      .findOne({ where: { devEUI: normEUI }, relations: ['networkServer'] })
      .catch(() => null);

    let server: NetworkServerEntity | null = null;
    if (params.networkServerId) {
      server = await this.serverRepo.findOne({ where: { id: params.networkServerId } }).catch(() => null);
    }
    if (!server && device?.networkServer) server = device.networkServer;
    if (!server && device?.networkServerId) {
      server = await this.serverRepo.findOne({ where: { id: device.networkServerId } }).catch(() => null);
    }
    if (!server) {
      server = await this.serverRepo.findOne({ where: { isDefault: true } }).catch(() => null);
    }

    // If server is ChirpStack with apiUrl
    if (server && server.type === NetworkServerType.CHIRPSTACK && server.apiUrl) {
      const rawBase = server.apiUrl.trim().replace(/\/+$/, '');
      const apiPrefix = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
      const queueUrl = `${apiPrefix}/devices/${normEUI.toLowerCase()}/queue`;

      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        if (server.apiKey) {
          headers['Authorization'] = `Bearer ${server.apiKey.trim()}`;
        }

        const res = await fetch(queueUrl, { method: 'GET', headers });
        if (res.ok) {
          const data = await res.json();
          const rawItems = data.result || data.items || [];
          const items = rawItems.map((it: any) => {
            let hex = '';
            if (it.data) {
              try {
                hex = Buffer.from(it.data, 'base64').toString('hex').toUpperCase();
              } catch {
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
      } catch (err: any) {
        this.logger.warn(`Failed to fetch live queue from ChirpStack for ${normEUI}: ${err.message}`);
      }
    }

    // Fallback: Query local queued downlink logs
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
}
