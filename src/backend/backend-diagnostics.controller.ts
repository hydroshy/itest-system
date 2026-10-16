import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  BackendSubsystem,
  DomainDiagnosticReport,
  SubsystemHealthStatus,
} from './common/subsystem.types';
import { DatabaseDiagnosticService } from './database/database-diagnostic.service';
import { IdentityDiagnosticService } from './identity/identity-diagnostic.service';
import { RealtimeDiagnosticService } from './realtime/realtime-diagnostic.service';
import { PluginManagerService } from './plugins/plugin-manager.service';

@ApiTags('Backend Architecture & Diagnostics')
@Controller('backend')
export class BackendDiagnosticsController {
  constructor(
    private readonly dbDiagnostic: DatabaseDiagnosticService,
    private readonly identityDiagnostic: IdentityDiagnosticService,
    private readonly realtimeDiagnostic: RealtimeDiagnosticService,
    private readonly pluginManager: PluginManagerService,
  ) {}

  @Get('diagnostics')
  @ApiOperation({ summary: 'Comprehensive health check and debug report for platform core subsystems' })
  async getDiagnostics(): Promise<DomainDiagnosticReport> {
    const [db, identity, realtime] = await Promise.all([
      this.dbDiagnostic.checkHealth(),
      this.identityDiagnostic.checkHealth(),
      this.realtimeDiagnostic.checkHealth(),
    ]);

    let pluginsStatus: SubsystemHealthStatus;
    try {
      const plugins = await this.pluginManager.listPlugins();
      pluginsStatus = {
        subsystem: BackendSubsystem.PLUGINS,
        status: 'UP',
        timestamp: new Date().toISOString(),
        details: { totalPlugins: plugins.length },
      };
    } catch (err: any) {
      pluginsStatus = {
        subsystem: BackendSubsystem.PLUGINS,
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }

    const subsystems: Record<BackendSubsystem, SubsystemHealthStatus> = {
      [BackendSubsystem.DATABASE]: db,
      [BackendSubsystem.IDENTITY]: identity,
      [BackendSubsystem.REALTIME]: realtime,
      [BackendSubsystem.PLUGINS]: pluginsStatus,
    };

    const hasDown = Object.values(subsystems).some((s) => s.status === 'DOWN');
    const hasDegraded = Object.values(subsystems).some((s) => s.status === 'DEGRADED');

    return {
      timestamp: new Date().toISOString(),
      overallStatus: hasDown ? 'DOWN' : hasDegraded ? 'DEGRADED' : 'UP',
      subsystems,
      debugGuidance: [
        'Check X-Daviteq-Subsystem in HTTP response headers to identify which domain handled the request.',
        'If DATABASE is DEGRADED: verify db-routing.config.json and connection string credentials.',
        'If IDENTITY errors: verify database user table and JWT secret configuration.',
        'If REALTIME errors: verify WebSocket gateway listening port and client connection limits.',
        'If PLUGINS errors: check core_plugins database table and plugin storage directory.',
      ],
    };
  }

  @Get('subsystems')
  @ApiOperation({ summary: 'List all registered backend subsystems and their route namespaces' })
  getSubsystemDirectory() {
    return {
      architecture: 'Platform Core Backbone & Dynamic Plugin Architecture',
      version: '3.0.0',
      subsystems: [
        {
          id: BackendSubsystem.DATABASE,
          name: 'Dynamic Database Subsystem',
          routes: ['/api/database/health', '/api/database/status', '/api/database/reload'],
          description: 'Multi-tenant database connection pool, dynamic routing & health.',
        },
        {
          id: BackendSubsystem.IDENTITY,
          name: 'Identity & Access Control Subsystem',
          routes: ['/auth/*', '/api/users/*', '/api/roles/*'],
          description: 'JWT authentication, RBAC authorization, and user administration.',
        },
        {
          id: BackendSubsystem.REALTIME,
          name: 'Realtime Streaming Subsystem',
          routes: ['/realtime/*', 'ws://*'],
          description: 'WebSocket telemetry and test packet streaming.',
        },
        {
          id: BackendSubsystem.PLUGINS,
          name: 'Plugin Management Engine',
          routes: ['/api/plugins/*'],
          description: 'Plugin lifecycle, storage, audit logs, and dynamic extension loading.',
        },
      ],
    };
  }
}
