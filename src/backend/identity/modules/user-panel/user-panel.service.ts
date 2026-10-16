import { Injectable } from '@nestjs/common';
import { DynamicDatabaseService } from '../../../database/modules/database/dynamic-database.service';
import { UnifiedDeviceEntity } from '../../../core-models/unified-device.entity';

@Injectable()
export class UserPanelService {
  constructor(private readonly dbService: DynamicDatabaseService) {}

  async getUserDashboard(userId: string) {
    try {
      const deviceRepo = this.dbService.getRepositoryForTable('unified_devices', UnifiedDeviceEntity);
      const devices = await deviceRepo.find();
      return {
        userId,
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.status === 'ONLINE').length,
        devicesSummary: devices.map(d => ({ deviceId: d.deviceId, name: d.name, status: d.status, protocolType: d.protocolType })),
      };
    } catch {
      return {
        userId,
        totalDevices: 0,
        activeDevices: 0,
        devicesSummary: [],
      };
    }
  }
}
