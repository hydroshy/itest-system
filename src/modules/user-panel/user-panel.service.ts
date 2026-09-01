import { Injectable } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { DeviceEntity } from '../lorawan/entities/device.entity';

@Injectable()
export class UserPanelService {
  constructor(private readonly dbService: DynamicDatabaseService) {}

  async getUserDashboard(userId: string) {
    const deviceRepo = this.dbService.getRepositoryForTable('devices', DeviceEntity);
    const devices = await deviceRepo.find();
    return {
      userId,
      totalDevices: devices.length,
      activeDevices: devices.filter(d => d.isActive).length,
      devicesSummary: devices.map(d => ({ devEUI: d.devEUI, name: d.name, active: d.isActive })),
    };
  }
}
