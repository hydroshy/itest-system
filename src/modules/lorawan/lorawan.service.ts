import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';
import { DeviceEntity } from './entities/device.entity';
import { ApplicationEntity } from './entities/application.entity';
import { GatewayEntity } from './entities/gateway.entity';
import { TelemetryEntity } from './entities/telemetry.entity';

@Injectable()
export class LorawanService {
  private readonly logger = new Logger(LorawanService.name);

  constructor(
    private readonly dbService: DynamicDatabaseService,
    private readonly payloadFormatterService: PayloadFormatterService,
  ) {}

  private get deviceRepo() {
    return this.dbService.getRepositoryForTable('devices', DeviceEntity);
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

  async registerDevice(data: Partial<DeviceEntity>): Promise<DeviceEntity> {
    const device = this.deviceRepo.create(data);
    return await this.deviceRepo.save(device);
  }

  async updatePayloadFormatter(devEUI: string, script: string): Promise<DeviceEntity> {
    const device = await this.deviceRepo.findOne({ where: { devEUI } });
    if (!device) {
      throw new NotFoundException(`Device with DevEUI ${devEUI} not found`);
    }
    device.payloadFormatterScript = script;
    return await this.deviceRepo.save(device);
  }

  async handleUplink(devEUI: string, payloadHex: string, fPort: number = 1, fCnt: number = 1) {
    const device = await this.deviceRepo.findOne({ where: { devEUI } });
    let decodedData = {};

    if (device && device.payloadFormatterScript) {
      try {
        decodedData = this.payloadFormatterService.decodePayload(device.payloadFormatterScript, payloadHex, fPort);
      } catch (err: any) {
        decodedData = { error: err.message };
      }
    }

    const telemetry = this.telemetryRepo.create({
      devEUI,
      payloadHex,
      fPort,
      fCnt,
      decodedData,
    });

    await this.telemetryRepo.save(telemetry);
    return {
      success: true,
      devEUI,
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
      // ChirpStack provides payload as Base64 in data
      payloadHex = Buffer.from(body.data, 'base64').toString('hex');
    } else if (body.payloadHex) {
      payloadHex = body.payloadHex;
    }

    const fPort = Number(body.fPort || body.f_port || 1);
    const fCnt = Number(body.fCnt || body.f_cnt || 0);

    let decodedData = body.object || (body.objectJSON ? (typeof body.objectJSON === 'string' ? JSON.parse(body.objectJSON) : body.objectJSON) : null);

    if (!decodedData || Object.keys(decodedData).length === 0) {
      const device = await this.deviceRepo.findOne({ where: { devEUI } });
      if (device && device.payloadFormatterScript && payloadHex) {
        try {
          decodedData = this.payloadFormatterService.decodePayload(device.payloadFormatterScript, payloadHex, fPort);
        } catch (e: any) {
          decodedData = { error: e.message };
        }
      }
    }

    const telemetry = this.telemetryRepo.create({
      devEUI,
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
      devEUI,
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

    const device = await this.deviceRepo.findOne({ where: { devEUI } });
    if (device && device.payloadFormatterScript && payloadHex) {
      try {
        decodedData = this.payloadFormatterService.decodePayload(device.payloadFormatterScript, payloadHex, fPort);
      } catch (e: any) {
        decodedData = { error: e.message };
      }
    }

    const telemetry = this.telemetryRepo.create({
      devEUI,
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
      devEUI,
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

  async listDevices(): Promise<DeviceEntity[]> {
    return await this.deviceRepo.find();
  }

  async listGateways(): Promise<GatewayEntity[]> {
    return await this.gatewayRepo.find();
  }

  async getTelemetry(devEUI?: string, limit: number = 50): Promise<TelemetryEntity[]> {
    const qb = this.telemetryRepo.createQueryBuilder('telemetry')
      .orderBy('telemetry.receivedAt', 'DESC')
      .take(limit);

    if (devEUI) {
      qb.where('telemetry.devEUI = :devEUI', { devEUI });
    }

    return await qb.getMany();
  }
}
