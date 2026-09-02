import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';
import { DeviceProvisioningService, ProvisioningResult } from './services/device-provisioning.service';
import { DeviceEntity } from './entities/device.entity';
import { ApplicationEntity } from './entities/application.entity';
import { GatewayEntity } from './entities/gateway.entity';
import { TelemetryEntity } from './entities/telemetry.entity';
import { NetworkServerEntity } from '../network-servers/entities/network-server.entity';
import { RegisterDeviceDto, RegisterGatewayDto } from './dto/lorawan.dto';

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
  async registerDevice(dto: RegisterDeviceDto): Promise<{
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
    let syncStatus = 'SYNCED';
    let syncDetails: Record<string, any> = {
      registeredAt: new Date().toISOString(),
      networkServerName: networkServer?.name || 'Unassigned',
      networkServerType: networkServer?.type || 'LOCAL',
    };

    // If a Network Server is assigned, execute the provisioning pipeline
    if (networkServer) {
      this.logger.log(
        `Provisioning device [${devEUI}] '${name}' to Network Server [${networkServer.name}] (${networkServer.type})`,
      );
      provisioningResult = await this.provisioningService.provisionDevice(networkServer, regionProfile, dto);
      syncStatus = provisioningResult.syncStatus;
      syncDetails = {
        ...syncDetails,
        serverType: networkServer.type,
        serverUrl: networkServer.apiUrl,
        totalSteps: provisioningResult.totalSteps,
        summaryMessage: provisioningResult.summaryMessage,
        steps: provisioningResult.steps,
      };
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
        networkServerId: dto.networkServerId || undefined,
        regionProfileId: dto.regionProfileId || undefined,
        payloadFormatterScript: dto.payloadFormatterScript || undefined,
        syncStatus,
        syncDetails,
        isActive: true,
      });
    } else {
      device.name = name;
      device.appEUI = appEUI;
      device.appKey = appKey;
      device.activationMode = activationMode;
      device.networkServerId = dto.networkServerId || undefined as any;
      device.regionProfileId = dto.regionProfileId || undefined as any;
      if (dto.payloadFormatterScript !== undefined) {
        device.payloadFormatterScript = dto.payloadFormatterScript;
      }
      device.syncStatus = syncStatus;
      device.syncDetails = syncDetails;
      device.isActive = true;
    }

    const saved = await this.deviceRepo.save(device);
    this.logger.log(`✅ Saved device [${saved.devEUI}] '${saved.name}' in database. SyncStatus=${syncStatus}`);

    return {
      success: true,
      device: saved,
      provisioning: provisioningResult,
      message: provisioningResult
        ? provisioningResult.summaryMessage
        : `Device ${saved.name} (${saved.devEUI}) registered successfully.`,
    };
  }

  async updateDevice(devEUI: string, dto: Partial<RegisterDeviceDto>): Promise<DeviceEntity> {
    const device = await this.deviceRepo.findOne({ where: { devEUI: devEUI.toUpperCase() } });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${devEUI} not found`);
    }

    if (dto.name !== undefined) device.name = dto.name.trim();
    if (dto.appEUI !== undefined) device.appEUI = dto.appEUI.trim().toUpperCase();
    if (dto.appKey !== undefined) device.appKey = dto.appKey.trim().toUpperCase();
    if (dto.activationType !== undefined) device.activationMode = dto.activationType;
    if (dto.networkServerId !== undefined) device.networkServerId = dto.networkServerId;
    if (dto.regionProfileId !== undefined) device.regionProfileId = dto.regionProfileId;
    if (dto.payloadFormatterScript !== undefined) device.payloadFormatterScript = dto.payloadFormatterScript;

    return await this.deviceRepo.save(device);
  }

  async deleteDevice(devEUI: string): Promise<{ success: boolean; message: string }> {
    const device = await this.deviceRepo.findOne({
      where: { devEUI: devEUI.toUpperCase() },
      relations: ['networkServer'],
    });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${devEUI} not found`);
    }

    if (device.networkServer) {
      await this.provisioningService.deprovisionDevice(device.networkServer, device.devEUI).catch(() => {});
    }

    await this.deviceRepo.remove(device);
    this.logger.log(`Deleted device [${devEUI}] from database and network server.`);
    return { success: true, message: `Device '${device.name}' (${devEUI}) deleted successfully` };
  }

  async syncDeviceToNetworkServer(devEUI: string): Promise<{
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
    };

    const provisioning = await this.provisioningService.provisionDevice(device.networkServer, regionProfile, dto);
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

  async handleUplink(devEUI: string, payloadHex: string, fPort: number = 1, fCnt: number = 1) {
    const device = await this.deviceRepo.findOne({ where: { devEUI: devEUI.toUpperCase() } });
    let decodedData = {};

    if (device && device.payloadFormatterScript) {
      try {
        decodedData = this.payloadFormatterService.decodePayload(device.payloadFormatterScript, payloadHex, fPort);
      } catch (err: any) {
        decodedData = { error: err.message };
      }
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

    if (!decodedData || Object.keys(decodedData).length === 0) {
      const device = await this.deviceRepo.findOne({ where: { devEUI: devEUI.toUpperCase() } });
      if (device && device.payloadFormatterScript && payloadHex) {
        try {
          decodedData = this.payloadFormatterService.decodePayload(device.payloadFormatterScript, payloadHex, fPort);
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
    if (device && device.payloadFormatterScript && payloadHex) {
      try {
        decodedData = this.payloadFormatterService.decodePayload(device.payloadFormatterScript, payloadHex, fPort);
      } catch (e: any) {
        decodedData = { error: e.message };
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

  async listDevices(): Promise<any[]> {
    const devices = await this.deviceRepo.find({
      relations: ['networkServer'],
      order: { createdAt: 'DESC' },
    });

    return devices.map((d) => {
      let regionProfileName = '';
      if (d.networkServer && d.regionProfileId && Array.isArray(d.networkServer.regionProfiles)) {
        const rp = d.networkServer.regionProfiles.find((p) => p.id === d.regionProfileId);
        if (rp) {
          regionProfileName = `${rp.name} (${rp.region})`;
        }
      }

      return {
        ...d,
        regionProfileName: regionProfileName || d.regionProfileId || '',
      };
    });
  }

  async findOneDevice(devEUI: string): Promise<DeviceEntity> {
    const device = await this.deviceRepo.findOne({
      where: { devEUI: devEUI.toUpperCase() },
      relations: ['networkServer'],
    });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${devEUI} not found`);
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

