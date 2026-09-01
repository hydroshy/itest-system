import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';
import { DeviceEntity } from './entities/device.entity';
import { ApplicationEntity } from './entities/application.entity';
import { GatewayEntity } from './entities/gateway.entity';
import { TelemetryEntity } from './entities/telemetry.entity';

@Injectable()
export class LorawanService {
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
      decodedData = this.payloadFormatterService.decodePayload(device.payloadFormatterScript, payloadHex, fPort);
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

  testPayloadFormatter(script: string, bytesHex: string, fPort: number = 1) {
    return this.payloadFormatterService.decodePayload(script, bytesHex, fPort);
  }

  async listDevices(): Promise<DeviceEntity[]> {
    return await this.deviceRepo.find();
  }

  async listGateways(): Promise<GatewayEntity[]> {
    return await this.gatewayRepo.find();
  }
}
