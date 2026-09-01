import { Injectable } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';

@Injectable()
export class AdminPanelService {
  constructor(private readonly dbService: DynamicDatabaseService) {}

  async getDashboardStats() {
    const dbStatus = this.dbService.getConnectionStatus();
    return {
      systemStatus: 'ONLINE',
      uptime: process.uptime(),
      dbConnections: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }

  async reloadDbConfig() {
    await this.dbService.loadConfigAndInitializeDataSources();
    return {
      message: 'Dynamic database configuration reloaded successfully',
      dbStatus: this.dbService.getConnectionStatus(),
    };
  }
}
