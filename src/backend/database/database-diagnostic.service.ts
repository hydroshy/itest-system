import { Injectable, Logger } from '@nestjs/common';
import { SubsystemHealthStatus, BackendSubsystem } from '../common/subsystem.types';
import { DynamicDatabaseService } from './dynamic-database.service';

@Injectable()
export class DatabaseDiagnosticService {
  private readonly logger = new Logger('DatabaseSubsystem');

  constructor(private readonly dbService: DynamicDatabaseService) {}

  async checkHealth(): Promise<SubsystemHealthStatus> {
    try {
      const health = await this.dbService.getDatabaseHealth();
      const status = this.dbService.getConnectionStatus();

      return {
        subsystem: BackendSubsystem.DATABASE,
        status: health.status === 'HEALTHY' ? 'UP' : health.status === 'DEGRADED' ? 'DEGRADED' : 'DOWN',
        timestamp: new Date().toISOString(),
        details: {
          totalConnections: health.totalConnections,
          tableStatsCount: Object.keys(health.tableStats || {}).length,
          activeRoutesCount: Object.keys(status.table_routes || {}).length,
          subsystemScope: [
            'Dynamic multi-tenant database routing',
            'Connection pool lifecycle',
            'Schema migration & entity registry',
          ],
        },
        error: null,
      };
    } catch (err: any) {
      this.logger.error(`Database diagnostic failed: ${err.message}`, err.stack);
      return {
        subsystem: BackendSubsystem.DATABASE,
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }
}
