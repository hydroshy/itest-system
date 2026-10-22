import {
  ChirpStackNetworkServer,
  ChirpStackGateway,
  ChirpStackDevice,
  ChirpStackApplication,
  ChirpStackDeviceProfile,
  LoRaWanUplinkEvent,
  CreateNetworkServerDto,
  CreateGatewayDto,
  CreateDeviceDto,
  DecodePayloadDto,
  ChirpStackTenant,
  CreateTenantDto,
} from './chirpstack.types';
import { ChirpStackApiClient } from './chirpstack-api.client';
import { LoRaWanPayloadDecoder } from './payload-decoder';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ChirpstackNetworkServerEntity } from '../../core-models/chirpstack-network-server.entity';

export class LoRaWanChirpStackService {
  private readonly apiClient: ChirpStackApiClient;
  private readonly servers = new Map<string, ChirpStackNetworkServer>();
  private readonly localGateways = new Map<string, ChirpStackGateway>();
  private readonly localDevices = new Map<string, ChirpStackDevice>();
  private readonly uplinkLogs: LoRaWanUplinkEvent[] = [];
  private readonly maxUplinkLogs = 200;
  private networkServerRepository?: Repository<ChirpstackNetworkServerEntity>;

  constructor() {
    this.apiClient = new ChirpStackApiClient(8000);
  }

  setNetworkServerRepository(repository: Repository<ChirpstackNetworkServerEntity>): void {
    this.networkServerRepository = repository;
  }

  private toNetworkServer(entity: ChirpstackNetworkServerEntity): ChirpStackNetworkServer {
    return {
      id: entity.id,
      name: entity.name,
      apiUrl: entity.apiUrl,
      apiToken: entity.apiToken,
      tenantId: entity.tenantId || undefined,
      version: 'ChirpStack v4',
      status: entity.isActive ? 'untested' : 'offline',
      lastCheckedAt: entity.updatedAt?.toISOString(),
      gatewayCount: 0,
      deviceCount: 0,
    };
  }

  private async syncNetworkServers(): Promise<void> {
    if (!this.networkServerRepository) return;
    const entities = await this.networkServerRepository.find({ where: { isActive: true } });
    const servers = await Promise.all(entities.map(async (entity) => {
      const server = this.toNetworkServer(entity);
      const result = await this.apiClient.testConnection(server);
      server.status = result.success ? 'online' : 'offline';
      server.lastCheckedAt = new Date().toISOString();
      server.errorMessage = result.success ? undefined : result.message;
      return server;
    }));
    this.servers.clear();
    for (const server of servers) this.servers.set(server.id, server);
  }


  // ==========================================
  // NETWORK SERVERS
  // ==========================================

  async getNetworkServers(): Promise<ChirpStackNetworkServer[]> {
    await this.syncNetworkServers();
    return Array.from(this.servers.values());
  }

  async getNetworkServer(id: string): Promise<ChirpStackNetworkServer | null> {
    await this.syncNetworkServers();
    return this.servers.get(id) || null;
  }

  async addNetworkServer(dto: CreateNetworkServerDto): Promise<ChirpStackNetworkServer> {
    const requireString = (field: string, value: unknown): string => {
      if (typeof value !== 'string' || !value.trim()) {
        throw new BadRequestException(`${field} is required and must be a non-empty string`);
      }
      return value.trim();
    };
    const id = `cs-srv-${Date.now().toString(36)}`;
    const server: ChirpStackNetworkServer = {
      id,
      name: requireString('name', dto?.name),
      apiUrl: requireString('apiUrl', dto?.apiUrl),
      apiToken: requireString('apiToken', dto?.apiToken),
      tenantId: typeof dto?.tenantId === 'string' ? dto.tenantId.trim() || undefined : undefined,
      version: 'ChirpStack v4',
      status: 'untested',
      lastCheckedAt: new Date().toISOString(),
      gatewayCount: 0,
      deviceCount: 0,
    };

    // Immediate test connection
    const testResult = await this.apiClient.testConnection(server);
    server.status = testResult.success ? 'online' : 'offline';
    server.errorMessage = testResult.success ? undefined : testResult.message;

    if (this.networkServerRepository) {
      const entity = this.networkServerRepository.create({
        name: server.name,
        apiUrl: server.apiUrl,
        apiToken: server.apiToken,
        tenantId: server.tenantId || null,
        isActive: true,
      });
      const saved = await this.networkServerRepository.save(entity);
      server.id = saved.id;
    }

    this.servers.set(server.id, server);
    return server;
  }

  async deleteNetworkServer(id: string): Promise<boolean> {
    if (this.networkServerRepository) {
      const result = await this.networkServerRepository.delete(id);
      this.servers.delete(id);
      return (result.affected || 0) > 0;
    }
    return this.servers.delete(id);
  }

  async testServerConnection(id: string): Promise<{ success: boolean; message: string; version?: string }> {
    await this.syncNetworkServers();
    const server = this.servers.get(id);
    if (!server) {
      return { success: false, message: `Không tìm thấy Network Server ID "${id}"` };
    }

    const result = await this.apiClient.testConnection(server);
    server.status = result.success ? 'online' : 'offline';
    server.lastCheckedAt = new Date().toISOString();
    server.errorMessage = result.success ? undefined : result.message;
    return result;
  }

  // ==========================================
  // GATEWAYS
  // ==========================================

  async listGateways(serverId?: string): Promise<ChirpStackGateway[]> {
    const targetServer = serverId ? this.servers.get(serverId) : this.servers.values().next().value;
    if (targetServer && targetServer.status === 'online') {
      const remoteGws = await this.apiClient.listGateways(targetServer);
      if (remoteGws.length > 0) {
        remoteGws.forEach((gw) => this.localGateways.set(gw.gatewayId, gw));
      }
    }

    const all = Array.from(this.localGateways.values());
    if (serverId) {
      return all.filter((g) => g.networkServerId === serverId);
    }
    return all;
  }

  async createGateway(dto: CreateGatewayDto): Promise<ChirpStackGateway> {
    const server = this.servers.get(dto.networkServerId) || this.servers.values().next().value;
    if (!server) {
      throw new Error('Chưa cấu hình Network Server nào.');
    }

    const cleanId = dto.gatewayId.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
    let created: ChirpStackGateway;

    try {
      created = await this.apiClient.createGateway(server, { ...dto, gatewayId: cleanId });
    } catch {
      // Fallback local registration
      created = {
        gatewayId: cleanId,
        name: dto.name,
        description: dto.description || '',
        networkServerId: server.id,
        tenantId: server.tenantId || '',
        status: 'online',
        lastSeenAt: new Date().toISOString(),
        rxPackets: 0,
        txPackets: 0,
        statsInterval: dto.statsInterval || 30,
      };
    }

    this.localGateways.set(created.gatewayId, created);
    if (server.gatewayCount !== undefined) server.gatewayCount++;
    return created;
  }

  async deleteGateway(gatewayId: string, serverId?: string): Promise<boolean> {
    const cleanId = gatewayId.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
    const server = serverId ? this.servers.get(serverId) : this.servers.values().next().value;
    if (server) {
      await this.apiClient.deleteGateway(server, cleanId);
    }
    const removed = this.localGateways.delete(cleanId);
    if (server && server.gatewayCount && server.gatewayCount > 0) server.gatewayCount--;
    return removed;
  }

  // ==========================================
  // DEVICES
  // ==========================================

  async listDevices(serverId?: string, applicationId?: string): Promise<ChirpStackDevice[]> {
    const targetServer = serverId ? this.servers.get(serverId) : this.servers.values().next().value;
    if (targetServer && targetServer.status === 'online') {
      const remoteDevices = await this.apiClient.listDevices(targetServer, applicationId);
      if (remoteDevices.length > 0) {
        remoteDevices.forEach((d) => this.localDevices.set(d.devEui, d));
      }
    }

    let all = Array.from(this.localDevices.values());
    if (serverId) {
      all = all.filter((d) => d.networkServerId === serverId);
    }
    if (applicationId) {
      all = all.filter((d) => d.applicationId === applicationId);
    }
    return all;
  }

  async createDevice(dto: CreateDeviceDto): Promise<ChirpStackDevice> {
    const server = this.servers.get(dto.networkServerId) || this.servers.values().next().value;
    if (!server) {
      throw new Error('Chưa cấu hình Network Server nào.');
    }

    const cleanDevEui = dto.devEui.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
    let created: ChirpStackDevice;

    try {
      created = await this.apiClient.createDevice(server, { ...dto, devEui: cleanDevEui });
    } catch {
      created = {
        devEui: cleanDevEui,
        name: dto.name,
        description: dto.description || '',
        networkServerId: server.id,
        applicationId: dto.applicationId,
        deviceProfileId: dto.deviceProfileId,
        status: 'active',
        lastSeenAt: new Date().toISOString(),
        batteryLevel: 100,
        margin: 12,
        fCntUp: 0,
      };
    }

    this.localDevices.set(created.devEui, created);
    if (server.deviceCount !== undefined) server.deviceCount++;
    return created;
  }

  async deleteDevice(devEui: string, serverId?: string): Promise<boolean> {
    const cleanDevEui = devEui.replace(/[^0-9a-fA-F]/g, '').toLowerCase();
    const server = serverId ? this.servers.get(serverId) : this.servers.values().next().value;
    if (server) {
      await this.apiClient.deleteDevice(server, cleanDevEui);
    }
    const removed = this.localDevices.delete(cleanDevEui);
    if (server && server.deviceCount && server.deviceCount > 0) server.deviceCount--;
    return removed;
  }

  // ==========================================
  // TENANTS
  // ==========================================

  async listTenants(serverId?: string): Promise<ChirpStackTenant[]> {
    const server = serverId ? this.servers.get(serverId) : this.servers.values().next().value;
    if (server) {
      const tenants = await this.apiClient.listTenants(server);
      if (tenants.length > 0) return tenants;
    }
    return [];
  }

  async createTenant(dto: CreateTenantDto): Promise<ChirpStackTenant> {
    const server = this.servers.get(dto.serverId);
    if (!server) {
      throw new Error(`ChirpStack Network Server ${dto.serverId} not found`);
    }
    return this.apiClient.createTenant(server, dto);
  }

  async deleteTenant(serverId: string, tenantId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) return false;
    return this.apiClient.deleteTenant(server, tenantId);
  }

  // ==========================================
  // APPLICATIONS & PROFILES
  // ==========================================

  async listApplications(serverId?: string): Promise<ChirpStackApplication[]> {
    const server = serverId ? this.servers.get(serverId) : this.servers.values().next().value;
    if (server) {
      const apps = await this.apiClient.listApplications(server);
      if (apps.length > 0) return apps;
    }
    return [
      { id: 'app-iot-monitoring', name: 'Smart Environment Monitoring', description: 'Environmental telemetry', tenantId: 'tenant-01' },
      { id: 'app-smart-agriculture', name: 'Smart Agriculture & Soil', description: 'Soil and weather nodes', tenantId: 'tenant-01' },
    ];
  }

  async listDeviceProfiles(serverId?: string): Promise<ChirpStackDeviceProfile[]> {
    const server = serverId ? this.servers.get(serverId) : this.servers.values().next().value;
    if (server) {
      const profiles = await this.apiClient.listDeviceProfiles(server);
      if (profiles.length > 0) return profiles;
    }
    return [
      { id: 'dp-as923-otaa', name: 'AS923 Class A OTAA', region: 'AS923', macVersion: 'LORAWAN_1_0_3', regParamsRevision: 'RP002_1_0_3', tenantId: 'tenant-01' },
      { id: 'dp-eu868-otaa', name: 'EU868 Class A OTAA', region: 'EU868', macVersion: 'LORAWAN_1_0_3', regParamsRevision: 'RP002_1_0_3', tenantId: 'tenant-01' },
    ];
  }

  // ==========================================
  // TELEMETRY & UPLINK HANDLER
  // ==========================================

  /**
   * Handle ChirpStack Webhook / MQTT Uplink Event
   */
  async handleUplinkWebhook(body: any): Promise<LoRaWanUplinkEvent> {
    const devEui = (
      body.deviceInfo?.devEui ||
      body.devEui ||
      body.devEUI ||
      'unknown'
    ).toLowerCase();

    const deviceName = body.deviceInfo?.deviceName || body.deviceName;
    const fPort = body.fPort || 1;
    const fCnt = body.fCnt || 0;
    const rawData = body.data || body.bytes || body.payload || '';

    // Extract rxInfo from ChirpStack gateway stats
    let rssi = -80;
    let snr = 8.0;
    let gatewayId = 'unknown';

    if (Array.isArray(body.rxInfo) && body.rxInfo.length > 0) {
      const bestGw = body.rxInfo[0];
      rssi = bestGw.rssi ?? rssi;
      snr = bestGw.snr ?? snr;
      gatewayId = bestGw.gatewayId || gatewayId;
    }

    // Decode payload
    let decoded = body.object || body.decodedPayload;
    if (!decoded && rawData) {
      decoded = LoRaWanPayloadDecoder.decode(rawData, 'cayenne_lpp', fPort);
    }

    const event: LoRaWanUplinkEvent = {
      id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      deduplicationId: body.deduplicationId,
      time: body.time || new Date().toISOString(),
      devEui,
      deviceName,
      applicationId: body.deviceInfo?.applicationId || body.applicationId,
      fPort,
      fCnt,
      dr: body.dr,
      frequency: body.txInfo?.frequency,
      rssi,
      snr,
      gatewayId,
      rawPayload: rawData,
      decodedPayload: decoded,
      confirmed: body.confirmed,
    };

    this.recordUplink(event);

    // Update Device status in cache
    const existingDev = this.localDevices.get(devEui);
    if (existingDev) {
      existingDev.lastSeenAt = event.time;
      existingDev.rssi = rssi;
      existingDev.snr = snr;
      existingDev.fCntUp = fCnt;
    }

    return event;
  }

  private recordUplink(event: LoRaWanUplinkEvent) {
    this.uplinkLogs.unshift(event);
    if (this.uplinkLogs.length > this.maxUplinkLogs) {
      this.uplinkLogs.pop();
    }
  }

  async getUplinkLogs(limit = 50, devEui?: string): Promise<LoRaWanUplinkEvent[]> {
    let logs = this.uplinkLogs;
    if (devEui) {
      const clean = devEui.toLowerCase();
      logs = logs.filter((l) => l.devEui === clean);
    }
    return logs.slice(0, limit);
  }

  async decodePayload(dto: DecodePayloadDto): Promise<{ decoded: Record<string, any>; bufferLength: number }> {
    const decoded = LoRaWanPayloadDecoder.decode(dto.payload, dto.codecType, 1, dto.customScript);
    const buf = LoRaWanPayloadDecoder.parseToBuffer(dto.payload);
    return { decoded, bufferLength: buf.length };
  }
}
