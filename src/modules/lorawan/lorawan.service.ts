import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';
import { DeviceProvisioningService, ProvisioningResult } from './services/device-provisioning.service';
import { DeviceEntity } from './entities/device.entity';
import { ApplicationEntity } from './entities/application.entity';
import { GatewayEntity } from './entities/gateway.entity';
import { TelemetryEntity } from './entities/telemetry.entity';
import { NetworkServerEntity } from '../network-servers/entities/network-server.entity';
import { DecoderEntity } from '../c-modules/decoder-admin/entities/decoder.entity';
import { WebhookLogEntity } from '../c-modules/webhook-admin/entities/webhook-log.entity';
import { RegisterDeviceDto, RegisterGatewayDto } from './dto/lorawan.dto';

function isUserSuperAdmin(user?: any): boolean {
  if (!user) return false;
  if (user.username === 'admin') return true;
  if (user.userType === 'ADMIN' || String(user.userType).toUpperCase() === 'ADMIN') return true;
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some((r: any) => (r.code || r) === 'SUPER_ADMIN');
  }
  return false;
}

@Injectable()
export class LorawanService {
  private readonly logger = new Logger(LorawanService.name);

  constructor(
    private readonly dbService: DynamicDatabaseService,
    private readonly payloadFormatterService: PayloadFormatterService,
    private readonly provisioningService: DeviceProvisioningService,
    private readonly realtimeService: RealtimeService,
  ) {}

  private get deviceRepo() {
    return this.dbService.getRepositoryForTable('devices', DeviceEntity);
  }

  private get serverRepo() {
    return this.dbService.getRepositoryForTable('network_servers', NetworkServerEntity);
  }

  private get decoderRepo() {
    return this.dbService.getRepositoryForTable('decoder', DecoderEntity);
  }

  private get webhookLogRepo() {
    return this.dbService.getRepositoryForTable('webhook_logs', WebhookLogEntity);
  }

  private get appRepo() {
    return this.dbService.getRepositoryForTable('applications', ApplicationEntity);
  }

  private get gatewayRepo() {
    return this.dbService.getRepositoryForTable('gateways', GatewayEntity);
  }

  private get telemetryRepo() {
    return this.dbService.getRepositoryForTable('uplink_telemetry', TelemetryEntity);
  }

  /**
   * Register device and provision it to upstream Network Server
   * (ThingPark: 1-step, ChirpStack: 2-step with AppEUI and AppKey)
   */
  async registerDevice(dto: RegisterDeviceDto, user?: any): Promise<{
    success: boolean;
    device: DeviceEntity;
    provisioning?: ProvisioningResult;
    message: string;
  }> {
    const devEUI = dto.devEUI.trim().toUpperCase();
    const name = dto.name.trim();
    const appEUI = (dto.appEUI || '0102030405060708').trim().toUpperCase();
    const appKey = (dto.appKey || '0102030405060708090A0B0C0D0E0F10').trim().toUpperCase();
    const activationMode = dto.activationType || 'OTAA';
    const ownerId = user?.id || undefined;
    const isActive = dto.isActive !== undefined ? Boolean(dto.isActive) : true;
    const isLocal = dto.provisionTarget === 'LOCAL';

    if (!devEUI || devEUI.length < 16) {
      throw new BadRequestException('DevEUI must be at least 16 Hexadecimal characters.');
    }

    let networkServer: NetworkServerEntity | null = null;
    let regionProfile: any = null;

    if (dto.networkServerId) {
      networkServer = await this.serverRepo.findOne({ where: { id: dto.networkServerId } });
      if (networkServer && dto.regionProfileId && Array.isArray(networkServer.regionProfiles)) {
        regionProfile = networkServer.regionProfiles.find((rp) => rp.id === dto.regionProfileId);
      }
    }

    let provisioningResult: ProvisioningResult | undefined;
    let syncStatus = isLocal ? 'LOCAL' : 'SYNCED';
    let syncDetails: Record<string, any> = {
      registeredAt: new Date().toISOString(),
      networkServerName: networkServer?.name || 'Local Fleet',
      networkServerType: networkServer?.type || 'LOCAL',
    };

    // If online provisioning requested
    if (!isLocal) {
      if (!networkServer) {
        throw new BadRequestException('Please select a Network Server or choose Local Fleet mode.');
      }

      this.logger.log(
        `Provisioning device [${devEUI}] '${name}' to Network Server [${networkServer.name}] (${networkServer.type})`,
      );
      provisioningResult = await this.provisioningService.provisionDevice(
        networkServer,
        regionProfile,
        {
          ...dto,
          isActive,
        },
        false, // isEdit = false for registration
      );

      // STRICT RULE: If network server failed to provision, DO NOT create device in database!
      if (!provisioningResult.success) {
        throw new BadRequestException(provisioningResult.errorMessage || provisioningResult.summaryMessage);
      }

      syncStatus = 'SYNCED';
      syncDetails = {
        ...syncDetails,
        serverType: networkServer.type,
        serverUrl: networkServer.apiUrl,
        totalSteps: provisioningResult.totalSteps,
        summaryMessage: provisioningResult.summaryMessage,
        steps: provisioningResult.steps,
      };
    }

    let payloadFormatterScript = dto.payloadFormatterScript || undefined;
    const decoderId = dto.decoderId ? dto.decoderId.trim() : undefined;
    if (decoderId && !payloadFormatterScript) {
      try {
        const dec = await this.decoderRepo.findOne({ where: { id: decoderId } });
        if (dec && dec.decoderCode) {
          payloadFormatterScript = dec.decoderCode;
        }
      } catch (err) {
        this.logger.warn(`Could not resolve decoder '${decoderId}': ${err.message}`);
      }
    }

    // Check if device already exists in DB
    let device = await this.deviceRepo.findOne({ where: { devEUI } });
    if (!device) {
      device = this.deviceRepo.create({
        devEUI,
        name,
        appEUI,
        appKey,
        activationMode,
        ownerId,
        networkServerId: dto.networkServerId || undefined,
        regionProfileId: dto.regionProfileId || undefined,
        decoderId: decoderId || undefined,
        payloadFormatterScript,
        syncStatus,
        syncDetails,
        isActive,
      });
    } else {
      if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
        throw new ForbiddenException('You do not have permission to modify this device.');
      }
      device.name = name;
      device.appEUI = appEUI;
      device.appKey = appKey;
      device.activationMode = activationMode;
      if (!device.ownerId && ownerId) {
        device.ownerId = ownerId;
      }
      device.networkServerId = dto.networkServerId || undefined as any;
      device.regionProfileId = dto.regionProfileId || undefined as any;
      if (decoderId !== undefined) {
        device.decoderId = decoderId;
      }
      if (payloadFormatterScript !== undefined) {
        device.payloadFormatterScript = payloadFormatterScript;
      }
      device.syncStatus = syncStatus;
      device.syncDetails = syncDetails;
      device.isActive = isActive;
    }

    const saved = await this.deviceRepo.save(device);
    this.logger.log(`✅ Saved device [${saved.devEUI}] '${saved.name}' in database. Decoder=${saved.decoderId || 'none'}, SyncStatus=${syncStatus}`);

    return {
      success: true,
      device: saved,
      provisioning: provisioningResult,
      message: provisioningResult
        ? provisioningResult.summaryMessage
        : `Device ${saved.name} (${saved.devEUI}) registered successfully in Local Fleet.`,
    };
  }

  async updateDevice(devEUI: string, dto: Partial<RegisterDeviceDto>, user?: any): Promise<{
    success: boolean;
    device: DeviceEntity;
    provisioning?: ProvisioningResult;
    message: string;
  }> {
    const cleanDevEUI = devEUI.trim().toUpperCase();
    const device = await this.deviceRepo.findOne({
      where: { devEUI: cleanDevEUI },
      relations: ['networkServer'],
    });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${cleanDevEUI} not found`);
    }
    if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to modify this device.');
    }

    if (dto.name !== undefined) device.name = dto.name.trim();
    if (dto.appEUI !== undefined) device.appEUI = dto.appEUI.trim().toUpperCase();
    if (dto.appKey !== undefined) device.appKey = dto.appKey.trim().toUpperCase();
    if (dto.activationType !== undefined) device.activationMode = dto.activationType;
    if (dto.payloadFormatterScript !== undefined) device.payloadFormatterScript = dto.payloadFormatterScript;
    if (dto.isActive !== undefined) device.isActive = Boolean(dto.isActive);

    if (dto.decoderId !== undefined) {
      const cleanDecoderId = dto.decoderId ? dto.decoderId.trim() : null;
      device.decoderId = cleanDecoderId as any;
      if (cleanDecoderId && !dto.payloadFormatterScript) {
        try {
          const dec = await this.decoderRepo.findOne({ where: { id: cleanDecoderId } });
          if (dec && dec.decoderCode) {
            device.payloadFormatterScript = dec.decoderCode;
          }
        } catch (err) {
          this.logger.warn(`Could not resolve decoder '${cleanDecoderId}': ${err.message}`);
        }
      } else if (cleanDecoderId === null && dto.payloadFormatterScript === undefined) {
        device.payloadFormatterScript = null as any;
      }
    }

    if (dto.networkServerId !== undefined) {
      device.networkServerId = (dto.networkServerId ? dto.networkServerId : undefined) as any;
    }
    if (dto.regionProfileId !== undefined) {
      device.regionProfileId = (dto.regionProfileId ? dto.regionProfileId : undefined) as any;
    }

    let networkServer: NetworkServerEntity | null = null;
    let regionProfile: any = null;

    if (device.networkServerId) {
      networkServer = await this.serverRepo.findOne({ where: { id: device.networkServerId } });
      if (networkServer && device.regionProfileId && Array.isArray(networkServer.regionProfiles)) {
        regionProfile = networkServer.regionProfiles.find((rp) => rp.id === device.regionProfileId);
      }
    }

    let provisioningResult: ProvisioningResult | undefined;
    if (dto.provisionTarget !== 'LOCAL' && networkServer) {
      this.logger.log(
        `Auto-syncing updated device [${cleanDevEUI}] '${device.name}' to Network Server [${networkServer.name}] (${networkServer.type}) via PUT`,
      );
      const provDto: RegisterDeviceDto = {
        devEUI: cleanDevEUI,
        name: device.name,
        appEUI: device.appEUI,
        appKey: device.appKey,
        activationType: device.activationMode,
        networkServerId: device.networkServerId,
        regionProfileId: device.regionProfileId,
        isActive: device.isActive,
      };
      // isEdit = true -> always uses PUT
      provisioningResult = await this.provisioningService.provisionDevice(networkServer, regionProfile, provDto, true);
      if (!provisioningResult.success) {
        throw new BadRequestException(provisioningResult.errorMessage || provisioningResult.summaryMessage);
      }
      device.syncStatus = 'SYNCED';
      device.syncDetails = {
        ...device.syncDetails,
        lastUpdatedAndSyncedAt: new Date().toISOString(),
        serverType: networkServer.type,
        serverUrl: networkServer.apiUrl,
        totalSteps: provisioningResult.totalSteps,
        summaryMessage: provisioningResult.summaryMessage,
        steps: provisioningResult.steps,
      };
    }

    const saved = await this.deviceRepo.save(device);
    this.logger.log(`✅ Updated device [${saved.devEUI}] '${saved.name}'. SyncStatus=${saved.syncStatus}`);
    return {
      success: true,
      device: saved,
      provisioning: provisioningResult,
      message: provisioningResult
        ? provisioningResult.summaryMessage
        : `Device ${saved.name} (${saved.devEUI}) updated successfully.`,
    };
  }

  async deleteDevice(devEUI: string, user?: any): Promise<{ success: boolean; message: string }> {
    const device = await this.deviceRepo.findOne({
      where: { devEUI: devEUI.toUpperCase() },
      relations: ['networkServer'],
    });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${devEUI} not found`);
    }
    if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this device.');
    }

    if (device.networkServer) {
      await this.provisioningService.deprovisionDevice(device.networkServer, device.devEUI).catch(() => {});
    }

    await this.deviceRepo.remove(device);
    this.logger.log(`Deleted device [${devEUI}] from database and network server.`);
    return { success: true, message: `Device '${device.name}' (${devEUI}) deleted successfully` };
  }

  async syncDeviceToNetworkServer(devEUI: string, user?: any): Promise<{
    success: boolean;
    provisioning: ProvisioningResult;
    device: DeviceEntity;
  }> {
    const device = await this.deviceRepo.findOne({
      where: { devEUI: devEUI.toUpperCase() },
      relations: ['networkServer'],
    });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${devEUI} not found`);
    }
    if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to manage this device.');
    }
    if (!device.networkServer) {
      throw new BadRequestException(`Device ${devEUI} is not assigned to any Network Server.`);
    }

    let regionProfile: any = null;
    if (device.regionProfileId && Array.isArray(device.networkServer.regionProfiles)) {
      regionProfile = device.networkServer.regionProfiles.find((rp) => rp.id === device.regionProfileId);
    }

    const dto: RegisterDeviceDto = {
      devEUI: device.devEUI,
      name: device.name,
      appEUI: device.appEUI,
      appKey: device.appKey,
      activationType: device.activationMode,
      networkServerId: device.networkServerId,
      regionProfileId: device.regionProfileId,
      isActive: device.isActive,
    };

    const provisioning = await this.provisioningService.provisionDevice(device.networkServer, regionProfile, dto, true);
    device.syncStatus = provisioning.syncStatus;
    device.syncDetails = {
      ...device.syncDetails,
      lastSyncedAt: new Date().toISOString(),
      summaryMessage: provisioning.summaryMessage,
      steps: provisioning.steps,
    };

    const updated = await this.deviceRepo.save(device);
    return { success: true, provisioning, device: updated };
  }

  async checkDeviceHealth(devEUI: string, user?: any): Promise<{
    success: boolean;
    device: DeviceEntity;
    health: {
      isOnline: boolean;
      lastSeenAt: string | null;
      deviceStatus?: any;
      message: string;
    };
  }> {
    const cleanDevEUI = devEUI.trim().toUpperCase();
    const device = await this.deviceRepo.findOne({
      where: { devEUI: cleanDevEUI },
      relations: ['networkServer'],
    });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${cleanDevEUI} not found`);
    }
    if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
      throw new ForbiddenException('You do not have permission to inspect this device.');
    }

    let healthResult = {
      isOnline: false,
      lastSeenAt: device.lastSeenAt ? new Date(device.lastSeenAt).toISOString() : (device.syncDetails?.lastSeenAt || null),
      deviceStatus: device.syncDetails?.deviceStatus || null,
      message: device.lastSeenAt ? `Last seen: ${new Date(device.lastSeenAt).toLocaleString()}` : 'No packet activity recorded.',
    };

    if (device.networkServer) {
      const serverHealth = await this.provisioningService.checkDeviceHealth(device.networkServer, cleanDevEUI);
      healthResult = {
        isOnline: serverHealth.isOnline,
        lastSeenAt: serverHealth.lastSeenAt || healthResult.lastSeenAt,
        deviceStatus: serverHealth.deviceStatus || healthResult.deviceStatus,
        message: serverHealth.message,
      };

      if (serverHealth.lastSeenAt) {
        device.lastSeenAt = new Date(serverHealth.lastSeenAt);
      } else {
        device.lastSeenAt = null;
      }
      device.syncDetails = {
        ...device.syncDetails,
        lastHealthCheckAt: new Date().toISOString(),
        lastSeenAt: serverHealth.lastSeenAt || null,
        deviceStatus: serverHealth.deviceStatus || null,
      };
      await this.deviceRepo.save(device);
    }

    return {
      success: true,
      device,
      health: healthResult,
    };
  }

  async registerGateway(data: Partial<GatewayEntity>): Promise<GatewayEntity> {
    const gateway = this.gatewayRepo.create(data);
    return await this.gatewayRepo.save(gateway);
  }

  async updatePayloadFormatter(devEUI: string, script: string): Promise<DeviceEntity> {
    const device = await this.deviceRepo.findOne({ where: { devEUI: devEUI.toUpperCase() } });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${devEUI} not found`);
    }
    device.payloadFormatterScript = script;
    return await this.deviceRepo.save(device);
  }

  private async getDecoderScript(device: DeviceEntity): Promise<string | null> {
    if (device.payloadFormatterScript) return device.payloadFormatterScript;
    if (device.decoderId) {
      try {
        const dec = await this.decoderRepo.findOne({ where: { id: device.decoderId } });
        if (dec && dec.decoderCode) {
          return dec.decoderCode;
        }
      } catch (err: any) {
        this.logger.warn(`Could not load decoder '${device.decoderId}': ${err.message}`);
      }
    }
    return null;
  }

  private async recordWebhookLog(data: {
    serverType: string;
    devEUI: string;
    fPort: number;
    fCnt: number;
    payloadHex: string;
    decodedData?: any;
    rawPayload?: any;
    status?: string;
    errorMessage?: string;
  }) {
    try {
      const repo = this.webhookLogRepo;
      const log = repo.create({
        serverType: data.serverType,
        devEUI: (data.devEUI || 'UNKNOWN').toUpperCase(),
        fPort: Number(data.fPort) || 1,
        fCnt: Number(data.fCnt) || 0,
        payloadHex: (data.payloadHex || '').toUpperCase(),
        decodedData: data.decodedData || null,
        rawPayload: data.rawPayload || null,
        status: data.status || (data.decodedData?.error ? 'ERROR' : 'SUCCESS'),
        errorMessage: data.errorMessage || (data.decodedData?.error ? String(data.decodedData.error) : null),
      });
      await repo.save(log);

      // Auto-prune excess beyond 200 packets per server
      const count = await repo.count({ where: { serverType: data.serverType } });
      if (count > 200) {
        const excess = count - 200;
        const oldest = await repo.find({
          where: { serverType: data.serverType },
          order: { receivedAt: 'ASC' },
          take: excess,
          select: ['id'],
        });
        if (oldest.length > 0) {
          await repo.delete(oldest.map(r => r.id));
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to record webhook log: ${err.message}`);
    }
  }

  private extractBestGateway(rxInfo?: any[]): { gatewayId: string | null; rssi: number | null; snr: number | null; channel: number | null } {
    if (!Array.isArray(rxInfo) || rxInfo.length === 0) {
      return { gatewayId: null, rssi: null, snr: null, channel: null };
    }
    let best = rxInfo[0];
    for (let i = 1; i < rxInfo.length; i++) {
      const g = rxInfo[i];
      // Higher RSSI (closer to 0 dBm) indicates stronger signal, then higher SNR
      if (g.rssi != null && (best.rssi == null || Number(g.rssi) > Number(best.rssi) || (Number(g.rssi) === Number(best.rssi) && Number(g.snr) > Number(best.snr)))) {
        best = g;
      }
    }
    return {
      gatewayId: best.gatewayId ? String(best.gatewayId) : null,
      rssi: best.rssi != null ? Number(best.rssi) : null,
      snr: best.snr != null ? Number(best.snr) : null,
      channel: best.channel != null ? Number(best.channel) : null,
    };
  }

  async handleUplink(devEUI: string, payloadHex: string, fPort: number = 1, fCnt: number = 1) {
    const cleanDevEUI = devEUI.trim().toUpperCase();
    const device = await this.deviceRepo.findOne({ where: { devEUI: cleanDevEUI } });
    let decodedData = {};

    if (device) {
      const script = await this.getDecoderScript(device);
      if (script) {
        try {
          decodedData = this.payloadFormatterService.decodePayload(script, payloadHex, fPort);
        } catch (err: any) {
          decodedData = { error: err.message };
        }
      }
    }

    if (device) {
      device.lastSeenAt = new Date();
      if (device.syncDetails) {
        device.syncDetails.lastSeenAt = device.lastSeenAt.toISOString();
      }
      await this.deviceRepo.save(device);
    }

    const telemetry = this.telemetryRepo.create({
      timestamp: new Date(),
      devEui: cleanDevEUI,
      payloadHex,
      fPort,
      fCnt,
      decodedData,
      serverType: 'GENERIC',
    });

    await this.telemetryRepo.save(telemetry);

    // Broadcast Realtime Telemetry Uplink Event
    try {
      this.realtimeService.publishTelemetry(telemetry);
    } catch (e) {}

    // Save to Webhook Manager Log
    this.recordWebhookLog({
      serverType: 'GENERIC',
      devEUI: cleanDevEUI,
      fPort,
      fCnt,
      payloadHex,
      decodedData,
      rawPayload: { devEUI: cleanDevEUI, payloadHex, fPort, fCnt },
    }).catch(() => {});

    return {
      success: true,
      devEUI: cleanDevEUI,
      decodedData,
      telemetry,
    };
  }

  async handleChirpstackWebhook(body: any) {
    const timestamp = body.time ? new Date(body.time) : new Date();
    const devEUI = (
      body.deviceInfo?.devEui ||
      body.devEUI ||
      body.devEui ||
      body.deviceInfo?.devEUI ||
      body.devAddr ||
      'UNKNOWN_CHIRPSTACK_DEVICE'
    ).trim().toUpperCase();

    const fPort = Number(body.fPort ?? body.f_port ?? 1);
    const fCnt = Number(body.fCnt ?? body.f_cnt ?? 0);
    const dr = body.dr != null ? Number(body.dr) : undefined;
    const adr = body.adr != null ? Boolean(body.adr) : undefined;
    const data = body.data || body.payloadHex || undefined;

    let payloadHex = '';
    if (body.data) {
      try {
        payloadHex = Buffer.from(body.data, 'base64').toString('hex');
      } catch (e) {
        payloadHex = '';
      }
    } else if (body.payloadHex) {
      payloadHex = body.payloadHex;
    }

    const bestGw = this.extractBestGateway(body.rxInfo);

    const frequency = body.txInfo?.frequency ? Number(body.txInfo.frequency) : undefined;
    const bandwidth = body.txInfo?.modulation?.lora?.bandwidth != null ? Number(body.txInfo.modulation.lora.bandwidth) : undefined;
    const spreadingFactor = body.txInfo?.modulation?.lora?.spreadingFactor != null ? Number(body.txInfo.modulation.lora.spreadingFactor) : undefined;

    const tenantId = body.deviceInfo?.tenantId || undefined;
    const applicationId = body.deviceInfo?.applicationId || undefined;
    const deviceName = body.deviceInfo?.deviceName || undefined;
    const deviceProfileName = body.deviceInfo?.deviceProfileName || undefined;
    const devAddr = body.devAddr || undefined;

    let decodedData = body.object || (body.objectJSON ? (typeof body.objectJSON === 'string' ? JSON.parse(body.objectJSON) : body.objectJSON) : null);

    const device = await this.deviceRepo.findOne({ where: { devEUI } });
    if (device) {
      device.lastSeenAt = new Date();
      if (device.syncDetails) {
        device.syncDetails.lastSeenAt = device.lastSeenAt.toISOString();
      }
      await this.deviceRepo.save(device);
    }

    if (!decodedData || Object.keys(decodedData).length === 0) {
      if (device && payloadHex) {
        const script = await this.getDecoderScript(device);
        if (script) {
          try {
            decodedData = this.payloadFormatterService.decodePayload(script, payloadHex, fPort);
          } catch (e: any) {
            decodedData = { error: e.message };
          }
        }
      }
    }

    const telemetry = this.telemetryRepo.create({
      timestamp,
      devEui: devEUI,
      fPort,
      fCnt,
      dr,
      adr,
      data,
      payloadHex: payloadHex || '00',
      gatewayId: bestGw.gatewayId || undefined,
      rssi: bestGw.rssi != null ? bestGw.rssi : undefined,
      snr: bestGw.snr != null ? bestGw.snr : undefined,
      channel: bestGw.channel != null ? bestGw.channel : undefined,
      frequency,
      bandwidth,
      spreadingFactor,
      tenantId,
      applicationId,
      deviceName,
      deviceProfileName,
      devAddr,
      object: body.object || undefined,
      decodedData: decodedData || {},
      serverType: 'CHIRPSTACK',
    });

    await this.telemetryRepo.save(telemetry);

    // Broadcast Realtime Telemetry Uplink Event
    try {
      this.realtimeService.publishTelemetry(telemetry);
    } catch (e) {}

    // Save to Webhook Manager Log
    this.recordWebhookLog({
      serverType: 'CHIRPSTACK',
      devEUI,
      fPort,
      fCnt,
      payloadHex: payloadHex || '',
      decodedData: decodedData || {},
      rawPayload: body,
      status: decodedData?.error ? 'ERROR' : 'SUCCESS',
      errorMessage: decodedData?.error || undefined,
    }).catch(() => {});

    this.logger.log(`📥 Processed ChirpStack Webhook: DevEUI=${devEUI}, Port=${fPort}, FCnt=${fCnt}, RSSI=${bestGw.rssi}, SNR=${bestGw.snr}, Freq=${frequency}`);
    return {
      success: true,
      source: 'ChirpStack',
      devEUI,
      fPort,
      fCnt,
      dr,
      adr,
      data,
      payloadHex,
      gatewayId: bestGw.gatewayId,
      rssi: bestGw.rssi,
      snr: bestGw.snr,
      channel: bestGw.channel,
      frequency,
      bandwidth,
      spreadingFactor,
      decodedData,
      telemetryId: telemetry.id,
      timestamp: telemetry.timestamp,
      receivedAt: telemetry.receivedAt,
    };
  }

  async handleThingparkWebhook(body: any) {
    const uplink = body.DevEUI_uplink || body;
    const timestamp = uplink.Time ? new Date(uplink.Time) : new Date();
    const devEUI = (uplink.DevEUI || uplink.devEUI || uplink.devEui || 'UNKNOWN_THINGPARK_DEVICE').trim().toUpperCase();

    let payloadHex = '';
    if (uplink.payload_hex) {
      payloadHex = uplink.payload_hex;
    } else if (uplink.payload) {
      try {
        payloadHex = Buffer.from(uplink.payload, 'base64').toString('hex');
      } catch (e) {
        payloadHex = '';
      }
    }

    const fPort = Number(uplink.FPort || uplink.fPort || 1);
    const fCnt = Number(uplink.FCntUp || uplink.fCnt || 0);
    const dr = uplink.SpFact ? Number(uplink.SpFact) : undefined;
    const adr = uplink.ADRBit != null ? Boolean(uplink.ADRBit) : undefined;
    const data = uplink.payload || uplink.payload_hex || undefined;

    // ThingPark Best Gateway Extraction from Lrrs
    let bestGwId: string | null = null;
    let bestRssi: number | null = uplink.LrrRSSI != null ? Number(uplink.LrrRSSI) : null;
    let bestSnr: number | null = uplink.LrrSNR != null ? Number(uplink.LrrSNR) : null;
    let channel: number | null = uplink.Channel != null ? Number(uplink.Channel) : null;

    if (uplink.Lrrs && Array.isArray(uplink.Lrrs.Lrr)) {
      for (const lrr of uplink.Lrrs.Lrr) {
        const r = lrr.LrrRSSI != null ? Number(lrr.LrrRSSI) : null;
        const s = lrr.LrrSNR != null ? Number(lrr.LrrSNR) : null;
        if (r != null && (bestRssi == null || r > bestRssi)) {
          bestRssi = r;
          bestSnr = s;
          bestGwId = lrr.Lrrid ? String(lrr.Lrrid) : null;
        }
      }
    }

    const frequency = uplink.Frequency ? Math.round(Number(uplink.Frequency) * 1000000) : undefined;
    const spreadingFactor = uplink.SpFact != null ? Number(uplink.SpFact) : undefined;
    const bandwidth = uplink.Bandwidth ? Math.round(Number(uplink.Bandwidth) < 1000 ? Number(uplink.Bandwidth) * 1000 : Number(uplink.Bandwidth)) : undefined;
    const devAddr = uplink.DevAddr || undefined;

    let decodedData = uplink.DriverCfg || null;

    const device = await this.deviceRepo.findOne({ where: { devEUI } });
    if (device) {
      device.lastSeenAt = new Date();
      if (device.syncDetails) {
        device.syncDetails.lastSeenAt = device.lastSeenAt.toISOString();
      }
      await this.deviceRepo.save(device);
    }

    if (device && payloadHex) {
      const script = await this.getDecoderScript(device);
      if (script) {
        try {
          decodedData = this.payloadFormatterService.decodePayload(script, payloadHex, fPort);
        } catch (e: any) {
          decodedData = { error: e.message };
        }
      }
    }

    const telemetry = this.telemetryRepo.create({
      timestamp,
      devEui: devEUI,
      fPort,
      fCnt,
      dr,
      adr,
      data,
      payloadHex: payloadHex || '00',
      gatewayId: bestGwId || undefined,
      rssi: bestRssi != null ? bestRssi : undefined,
      snr: bestSnr != null ? bestSnr : undefined,
      channel: channel != null ? channel : undefined,
      frequency,
      bandwidth,
      spreadingFactor,
      devAddr,
      object: (decodedData && Object.keys(decodedData).length > 0 && !decodedData.error) ? decodedData : (uplink.object || undefined),
      decodedData: decodedData || {},
      serverType: 'THINGPARK',
    });

    await this.telemetryRepo.save(telemetry);

    // Broadcast Realtime Telemetry Uplink Event
    try {
      this.realtimeService.publishTelemetry(telemetry);
    } catch (e) {}

    // Save to Webhook Manager Log
    this.recordWebhookLog({
      serverType: 'THINGPARK',
      devEUI,
      fPort,
      fCnt,
      payloadHex: payloadHex || '',
      decodedData: decodedData || {},
      rawPayload: body,
      status: decodedData?.error ? 'ERROR' : 'SUCCESS',
      errorMessage: decodedData?.error || undefined,
    }).catch(() => {});

    this.logger.log(`📥 Processed ThingPark Webhook: DevEUI=${devEUI}, Port=${fPort}, FCnt=${fCnt}`);
    return {
      success: true,
      source: 'ThingPark',
      devEUI,
      fPort,
      fCnt,
      payloadHex,
      decodedData,
      telemetryId: telemetry.id,
      timestamp: telemetry.timestamp,
      receivedAt: telemetry.receivedAt,
    };
  }

  testPayloadFormatter(script: string, bytesHex: string, fPort: number = 1) {
    return this.payloadFormatterService.decodePayload(script, bytesHex, fPort);
  }

  async listDevices(user?: any): Promise<any[]> {
    const isSuperAdmin = isUserSuperAdmin(user);

    let devices: DeviceEntity[];
    if (isSuperAdmin || !user || !user.id) {
      devices = await this.deviceRepo.find({
        relations: ['networkServer', 'owner'],
        order: { createdAt: 'DESC' },
      });
    } else {
      devices = await this.deviceRepo.find({
        where: { ownerId: user.id },
        relations: ['networkServer', 'owner'],
        order: { createdAt: 'DESC' },
      });
    }

    const activeThreshold = 24 * 60 * 60 * 1000;
    const now = Date.now();

    return devices.map((d) => {
      let regionProfileName = '';
      if (d.networkServer && d.regionProfileId && Array.isArray(d.networkServer.regionProfiles)) {
        const rp = d.networkServer.regionProfiles.find((p) => p.id === d.regionProfileId);
        if (rp) {
          regionProfileName = `${rp.name} (${rp.region})`;
        }
      }

      const lastSeen = d.lastSeenAt || (d.syncDetails?.lastSeenAt ? new Date(d.syncDetails.lastSeenAt) : null);
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
      const isOnline = Boolean(
        d.isActive &&
        lastSeenTime > 0 &&
        (now - lastSeenTime < activeThreshold)
      );

      return {
        ...d,
        isOnline,
        neverJoined: lastSeenTime === 0,
        regionProfileName: regionProfileName || d.regionProfileId || '',
        owner: d.owner ? {
          id: d.owner.id,
          username: d.owner.username,
          fullName: d.owner.fullName || d.owner.username,
          email: d.owner.email,
        } : null,
      };
    });
  }

  async findOneDevice(devEUI: string, user?: any): Promise<DeviceEntity> {
    const device = await this.deviceRepo.findOne({
      where: { devEUI: devEUI.toUpperCase() },
      relations: ['networkServer', 'owner'],
    });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${devEUI} not found`);
    }
    if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
      throw new ForbiddenException('Device not found or not owned by you.');
    }
    return device;
  }

  async getDevice(id: string): Promise<DeviceEntity | null> {
    const device = await this.deviceRepo.findOne({
      where: { id },
      relations: ['networkServer'],
    });
    if (device) {
      const lastSeen = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : 0;
      const now = Date.now();
      (device as any).isOnline = Boolean(device.isActive && lastSeen > 0 && (now - lastSeen) < (24 * 60 * 60 * 1000));
      (device as any).neverJoined = lastSeen === 0;
    }
    return device;
  }

  async listGateways(): Promise<GatewayEntity[]> {
    return await this.gatewayRepo.find({
      relations: ['networkServer'],
    });
  }

  async getTelemetry(devEUI?: string, limit: number = 50): Promise<TelemetryEntity[]> {
    const qb = this.telemetryRepo.createQueryBuilder('telemetry')
      .orderBy('telemetry.timestamp', 'DESC');

    if (limit && limit > 0) {
      qb.take(limit);
    }

    if (devEUI) {
      qb.where('UPPER(telemetry.devEui) = :devEUI', { devEUI: devEUI.toUpperCase() });
    }

    return await qb.getMany();
  }

  async getDeviceTelemetryFields(devEUI: string): Promise<{
    devEUI: string;
    fields: Array<{
      key: string;
      label: string;
      latestValue: any;
      dataType: string;
      unit?: string;
      source: 'decoded_payload' | 'lora_metric' | 'default';
      lastSeen?: Date | string;
    }>;
    lastTelemetryAt?: Date | string;
    totalRecordsScanned: number;
  }> {
    const normEUI = (devEUI || '').trim().toUpperCase();
    const records = await this.telemetryRepo.createQueryBuilder('telemetry')
      .where('UPPER(telemetry.devEui) = :devEUI', { devEUI: normEUI })
      .orderBy('telemetry.timestamp', 'DESC')
      .take(30)
      .getMany();

    const fieldMap = new Map<string, {
      key: string;
      label: string;
      latestValue: any;
      dataType: string;
      unit?: string;
      source: 'decoded_payload' | 'lora_metric' | 'default';
      lastSeen?: Date | string;
    }>();

    // Standard LoRaWAN RF metrics
    const standardLoraFields = [
      { key: 'battery', label: 'Battery Level', unit: '%', def: 100 },
      { key: 'rssi', label: 'Signal RSSI', unit: 'dBm', def: -75 },
      { key: 'snr', label: 'Signal SNR', unit: 'dB', def: 9.5 },
      { key: 'fCnt', label: 'Frame Counter (fCnt)', unit: '', def: 1 },
      { key: 'dr', label: 'Data Rate (DR)', unit: '', def: 3 },
      { key: 'fPort', label: 'fPort', unit: '', def: 1 },
      { key: 'frequency', label: 'Frequency', unit: 'Hz', def: 868300000 },
    ];

    for (const sf of standardLoraFields) {
      fieldMap.set(sf.key, {
        key: sf.key,
        label: sf.label,
        latestValue: sf.def,
        dataType: 'number',
        unit: sf.unit,
        source: 'lora_metric',
      });
    }

    let lastTelemetryAt: Date | undefined;

    if (records && records.length > 0) {
      lastTelemetryAt = records[0].timestamp;

      for (const rec of records) {
        if (rec.rssi !== undefined && rec.rssi !== null) {
          fieldMap.set('rssi', { key: 'rssi', label: 'Signal RSSI', latestValue: rec.rssi, dataType: 'number', unit: 'dBm', source: 'lora_metric', lastSeen: rec.timestamp });
        }
        if (rec.snr !== undefined && rec.snr !== null) {
          fieldMap.set('snr', { key: 'snr', label: 'Signal SNR', latestValue: rec.snr, dataType: 'number', unit: 'dB', source: 'lora_metric', lastSeen: rec.timestamp });
        }
        if (rec.fCnt !== undefined && rec.fCnt !== null) {
          fieldMap.set('fCnt', { key: 'fCnt', label: 'Frame Counter', latestValue: rec.fCnt, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
        }
        if (rec.dr !== undefined && rec.dr !== null) {
          fieldMap.set('dr', { key: 'dr', label: 'Data Rate', latestValue: rec.dr, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
        }
        if (rec.fPort !== undefined && rec.fPort !== null) {
          fieldMap.set('fPort', { key: 'fPort', label: 'fPort', latestValue: rec.fPort, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
        }

        // Scan object and decodedData (supports recursive flattening for inner tags e.g. data.HUMIDITY)
        const parseIfString = (val: any) => {
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return null; }
          }
          return val;
        };

        const detectUnit = (key: string): string => {
          const lowerK = key.toLowerCase();
          if (lowerK.includes('temp')) return '°C';
          if (lowerK.includes('hum')) return '%RH';
          if (lowerK.includes('press') || lowerK.includes('bar') || lowerK.includes('kpa')) return 'bar';
          if (lowerK.includes('volt')) return 'V';
          if (lowerK.includes('curr') || lowerK.includes('amp')) return 'A';
          if (lowerK.includes('kwh') || lowerK.includes('energy')) return 'kWh';
          if (lowerK.includes('kvarh')) return 'kVARh';
          if (lowerK.includes('level') || lowerK.includes('tank')) return '%';
          if (lowerK.includes('flow') || lowerK.includes('speed')) return 'm³/h';
          if (lowerK.includes('power') && !lowerK.includes('source') && !lowerK.includes('level')) return 'W';
          if (lowerK.includes('ppm') || lowerK.includes('co2')) return 'ppm';
          if (lowerK.includes('lux') || lowerK.includes('light')) return 'lux';
          if (lowerK.includes('freq') || lowerK.includes('hz')) return 'Hz';
          if (lowerK.includes('ph')) return 'pH';
          if (lowerK.includes('conductivity') || lowerK.includes('ec')) return 'µS/cm';
          return '';
        };

        const formatLabel = (key: string): string => {
          return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
        };

        const registerField = (tagKey: string, val: any, timestamp?: Date) => {
          if (val === undefined || val === null) return;
          const label = formatLabel(tagKey);
          const unit = detectUnit(tagKey);
          const dataType = typeof val;

          const existing = fieldMap.get(tagKey);
          if (!existing || existing.source === 'default' || existing.source === 'lora_metric') {
            fieldMap.set(tagKey, {
              key: tagKey,
              label: label || tagKey,
              latestValue: val,
              dataType: typeof val === 'object' ? 'json' : dataType,
              unit,
              source: 'decoded_payload',
              lastSeen: timestamp,
            });
          }
        };

        const scanRecursive = (obj: any, prefix = '', timestamp?: Date) => {
          if (!obj || typeof obj !== 'object') return;
          for (const [k, v] of Object.entries(obj)) {
            if (k === 'error' || k === 'errors' || k === 'warnings') continue;
            const fullKey = prefix ? `${prefix}.${k}` : k;
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
              scanRecursive(v, fullKey, timestamp);
            } else if (v !== undefined && v !== null) {
              let cleanKey = fullKey;
              if (cleanKey.startsWith('data.')) {
                cleanKey = cleanKey.substring(5);
              }
              registerField(cleanKey, v, timestamp);
              if (cleanKey !== k && !fieldMap.has(k)) {
                registerField(k, v, timestamp);
              }
            }
          }
        };

        const objectsToScan = [rec.object, rec.decodedData].filter(Boolean);
        for (const raw of objectsToScan) {
          const parsed = parseIfString(raw);
          if (parsed && typeof parsed === 'object') {
            scanRecursive(parsed, '', rec.timestamp);
          }
        }
      }
    }

    const fields = Array.from(fieldMap.values()).sort((a, b) => {
      if (a.source === 'decoded_payload' && b.source !== 'decoded_payload') return -1;
      if (a.source !== 'decoded_payload' && b.source === 'decoded_payload') return 1;
      return a.key.localeCompare(b.key);
    });

    return {
      devEUI: normEUI,
      fields,
      lastTelemetryAt,
      totalRecordsScanned: records.length,
    };
  }
}

