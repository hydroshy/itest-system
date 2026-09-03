import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';
import { DeviceProvisioningService, ProvisioningResult } from './services/device-provisioning.service';
import { DeviceEntity } from './entities/device.entity';
import { ApplicationEntity } from './entities/application.entity';
import { GatewayEntity } from './entities/gateway.entity';
import { TelemetryEntity } from './entities/telemetry.entity';
import { NetworkServerEntity } from '../network-servers/entities/network-server.entity';
import { DecoderEntity } from '../c-modules/decoder-admin/entities/decoder.entity';
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

  async handleUplink(devEUI: string, payloadHex: string, fPort: number = 1, fCnt: number = 1) {
    const device = await this.deviceRepo.findOne({ where: { devEUI: devEUI.toUpperCase() } });
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
      devEUI: devEUI.toUpperCase(),
      payloadHex,
      fPort,
      fCnt,
      decodedData,
    });

    await this.telemetryRepo.save(telemetry);
    return {
      success: true,
      devEUI: devEUI.toUpperCase(),
      decodedData,
      telemetry,
    };
  }

  async handleChirpstackWebhook(body: any) {
    const devEUI =
      body.deviceInfo?.devEui ||
      body.devEUI ||
      body.devEui ||
      body.deviceInfo?.devEUI ||
      body.devAddr ||
      'UNKNOWN_CHIRPSTACK_DEVICE';

    let payloadHex = '';
    if (body.data) {
      payloadHex = Buffer.from(body.data, 'base64').toString('hex');
    } else if (body.payloadHex) {
      payloadHex = body.payloadHex;
    }

    const fPort = Number(body.fPort || body.f_port || 1);
    const fCnt = Number(body.fCnt || body.f_cnt || 0);

    let decodedData = body.object || (body.objectJSON ? (typeof body.objectJSON === 'string' ? JSON.parse(body.objectJSON) : body.objectJSON) : null);

    const device = await this.deviceRepo.findOne({ where: { devEUI: devEUI.toUpperCase() } });
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
      devEUI: devEUI.toUpperCase(),
      payloadHex: payloadHex || '00',
      fPort,
      fCnt,
      decodedData: decodedData || {},
    });

    await this.telemetryRepo.save(telemetry);
    this.logger.log(`📥 Processed ChirpStack Webhook: DevEUI=${devEUI}, Port=${fPort}, FCnt=${fCnt}`);
    return {
      success: true,
      source: 'ChirpStack',
      devEUI: devEUI.toUpperCase(),
      fPort,
      fCnt,
      payloadHex,
      decodedData,
      telemetryId: telemetry.id,
      receivedAt: telemetry.receivedAt,
    };
  }

  async handleThingparkWebhook(body: any) {
    const uplink = body.DevEUI_uplink || body;
    const devEUI = uplink.DevEUI || uplink.devEUI || uplink.devEui || 'UNKNOWN_THINGPARK_DEVICE';

    let payloadHex = '';
    if (uplink.payload_hex) {
      payloadHex = uplink.payload_hex;
    } else if (uplink.payload) {
      payloadHex = Buffer.from(uplink.payload, 'base64').toString('hex');
    }

    const fPort = Number(uplink.FPort || uplink.fPort || 1);
    const fCnt = Number(uplink.FCntUp || uplink.fCnt || 0);

    let decodedData = uplink.DriverCfg || null;

    const device = await this.deviceRepo.findOne({ where: { devEUI: devEUI.toUpperCase() } });
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
      devEUI: devEUI.toUpperCase(),
      payloadHex: payloadHex || '00',
      fPort,
      fCnt,
      decodedData: decodedData || {},
    });

    await this.telemetryRepo.save(telemetry);
    this.logger.log(`📥 Processed ThingPark Webhook: DevEUI=${devEUI}, Port=${fPort}, FCnt=${fCnt}`);
    return {
      success: true,
      source: 'ThingPark',
      devEUI: devEUI.toUpperCase(),
      fPort,
      fCnt,
      payloadHex,
      decodedData,
      telemetryId: telemetry.id,
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

    return devices.map((d) => {
      let regionProfileName = '';
      if (d.networkServer && d.regionProfileId && Array.isArray(d.networkServer.regionProfiles)) {
        const rp = d.networkServer.regionProfiles.find((p) => p.id === d.regionProfileId);
        if (rp) {
          regionProfileName = `${rp.name} (${rp.region})`;
        }
      }

      const lastSeen = d.lastSeenAt || (d.syncDetails?.lastSeenAt ? new Date(d.syncDetails.lastSeenAt) : null);
      const isOnline = Boolean(
        d.isActive &&
        lastSeen &&
        !isNaN(new Date(lastSeen).getTime()) &&
        (Date.now() - new Date(lastSeen).getTime() < 24 * 60 * 60 * 1000)
      );

      return {
        ...d,
        isOnline,
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

  async listGateways(): Promise<GatewayEntity[]> {
    return await this.gatewayRepo.find({
      relations: ['networkServer'],
    });
  }

  async getTelemetry(devEUI?: string, limit: number = 50): Promise<TelemetryEntity[]> {
    const qb = this.telemetryRepo.createQueryBuilder('telemetry')
      .orderBy('telemetry.receivedAt', 'DESC')
      .take(limit);

    if (devEUI) {
      qb.where('telemetry.devEUI = :devEUI', { devEUI: devEUI.toUpperCase() });
    }

    return await qb.getMany();
  }
}

