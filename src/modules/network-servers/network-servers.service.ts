import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { NetworkServerEntity, NetworkServerType, RegionProfile } from './entities/network-server.entity';
import { CreateNetworkServerDto, UpdateNetworkServerDto, RegionProfileDto } from './dto/network-server.dto';
import { DeviceEntity } from '../lorawan/entities/device.entity';
import { GatewayEntity } from '../lorawan/entities/gateway.entity';

@Injectable()
export class NetworkServersService {
  private readonly logger = new Logger(NetworkServersService.name);

  constructor(private readonly dbService: DynamicDatabaseService) {}

  private get serverRepo() {
    return this.dbService.getRepositoryForTable('network_servers', NetworkServerEntity);
  }

  private get deviceRepo() {
    return this.dbService.getRepositoryForTable('devices', DeviceEntity);
  }

  private get gatewayRepo() {
    return this.dbService.getRepositoryForTable('gateways', GatewayEntity);
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
}
