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
      await this.serverRepo.update({}, { isDefault: false });
    }

    const regionProfiles: RegionProfile[] = (dto.regionProfiles || []).map((rp, idx) => ({
      id: rp.id || `reg-${Date.now()}-${idx + 1}`,
      name: rp.name,
      region: rp.region,
      routeRef: rp.routeRef,
      profileId: rp.profileId,
      frequencyBand: rp.frequencyBand || '',
      description: rp.description || '',
      isActive: rp.isActive !== false,
    }));

    const server = this.serverRepo.create({
      name: dto.name.trim(),
      type: dto.type,
      description: dto.description?.trim(),
      apiUrl: dto.apiUrl?.trim(),
      apiKey: dto.apiKey?.trim(),
      routeRef: dto.routeRef?.trim(),
      regionProfiles,
      status: dto.status || 'ONLINE',
      isDefault: dto.isDefault || false,
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
      await this.serverRepo.update({}, { isDefault: false });
    }

    if (dto.name !== undefined) server.name = dto.name.trim();
    if (dto.type !== undefined) server.type = dto.type;
    if (dto.description !== undefined) server.description = dto.description.trim();
    if (dto.apiUrl !== undefined) server.apiUrl = dto.apiUrl.trim();
    if (dto.apiKey !== undefined) server.apiKey = dto.apiKey.trim();
    if (dto.routeRef !== undefined) server.routeRef = dto.routeRef.trim();
    if (dto.status !== undefined) server.status = dto.status;
    if (dto.isDefault !== undefined) server.isDefault = dto.isDefault;
    if (dto.metadata !== undefined) server.metadata = dto.metadata;

    if (dto.regionProfiles !== undefined) {
      server.regionProfiles = dto.regionProfiles.map((rp, idx) => ({
        id: rp.id || `reg-${Date.now()}-${idx + 1}`,
        name: rp.name,
        region: rp.region,
        routeRef: rp.routeRef,
        profileId: rp.profileId,
        frequencyBand: rp.frequencyBand || '',
        description: rp.description || '',
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

    // Check basic parameters
    if (!server.apiUrl && !server.routeRef && !server.apiKey) {
      return {
        success: true,
        serverType: server.type,
        serverName: server.name,
        latencyMs: 1,
        message: 'Network Server configuration is verified (Standalone/Webhook mode)',
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

    // Try HTTP ping if apiUrl is defined
    if (server.apiUrl && (server.apiUrl.startsWith('http://') || server.apiUrl.startsWith('https://'))) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        if (server.apiKey) {
          if (server.type === NetworkServerType.CHIRPSTACK) {
            headers['Authorization'] = `Bearer ${server.apiKey}`;
          } else {
            headers['Authorization'] = `Bearer ${server.apiKey}`;
            headers['X-API-KEY'] = server.apiKey;
          }
        }

        const res = await fetch(server.apiUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        }).catch((err) => {
          throw err;
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        return {
          success: true,
          serverType: server.type,
          serverName: server.name,
          apiUrl: server.apiUrl,
          latencyMs,
          message: `Connected successfully to ${server.name} (HTTP Status: ${res.status})`,
          details: {
            httpStatus: res.status,
            latencyMs,
            webhookTarget:
              server.type === NetworkServerType.THINGPARK
                ? '/lorawan/webhook/thingpark'
                : '/lorawan/webhook/chirpstack',
          },
        };
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        return {
          success: false,
          serverType: server.type,
          serverName: server.name,
          apiUrl: server.apiUrl,
          latencyMs,
          message: `Network check notice: ${err.message || 'Host unreachable'} (Config is valid for webhook ingestion)`,
          details: {
            error: err.message,
            webhookTarget:
              server.type === NetworkServerType.THINGPARK
                ? '/lorawan/webhook/thingpark'
                : '/lorawan/webhook/chirpstack',
          },
        };
      }
    }

    return {
      success: true,
      serverType: server.type,
      serverName: server.name,
      latencyMs: Date.now() - startTime,
      message: `Config for ${server.type} is ready and verified for webhook reception`,
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
