import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  BackendSubsystem,
  DomainDiagnosticReport,
  SubsystemHealthStatus,
} from './common/subsystem.types';
import { DatabaseDiagnosticService } from './database/database-diagnostic.service';
import { LorawanDiagnosticService } from './lorawan/lorawan-diagnostic.service';
import { OrderManagementDiagnosticService } from './order-management/order-management-diagnostic.service';
import { TestAutomationDiagnosticService } from './test-automation/test-automation-diagnostic.service';
import { IdentityDiagnosticService } from './identity/identity-diagnostic.service';
import { IndustrialIotDiagnosticService } from './industrial-iot/industrial-iot-diagnostic.service';
import { RealtimeDiagnosticService } from './realtime/realtime-diagnostic.service';

@ApiTags('Backend Architecture & Diagnostics')
@Controller('backend')
export class BackendDiagnosticsController {
  constructor(
    private readonly dbDiagnostic: DatabaseDiagnosticService,
    private readonly lorawanDiagnostic: LorawanDiagnosticService,
    private readonly orderManagementDiagnostic: OrderManagementDiagnosticService,
    private readonly testAutomationDiagnostic: TestAutomationDiagnosticService,
    private readonly identityDiagnostic: IdentityDiagnosticService,
    private readonly industrialIotDiagnostic: IndustrialIotDiagnosticService,
    private readonly realtimeDiagnostic: RealtimeDiagnosticService,
  ) {}

  @Get('diagnostics')
  @ApiOperation({ summary: 'Comprehensive health check and debug report for all 7 backend subsystems' })
  async getDiagnostics(): Promise<DomainDiagnosticReport> {
    const [db, lora, order, testAuto, identity, iot, realtime] = await Promise.all([
      this.dbDiagnostic.checkHealth(),
      this.lorawanDiagnostic.checkHealth(),
      this.orderManagementDiagnostic.checkHealth(),
      this.testAutomationDiagnostic.checkHealth(),
      this.identityDiagnostic.checkHealth(),
      this.industrialIotDiagnostic.checkHealth(),
      this.realtimeDiagnostic.checkHealth(),
    ]);

    const subsystems: Record<BackendSubsystem, SubsystemHealthStatus> = {
      [BackendSubsystem.DATABASE]: db,
      [BackendSubsystem.LORAWAN]: lora,
      [BackendSubsystem.ORDER_MANAGEMENT]: order,
      [BackendSubsystem.TEST_AUTOMATION]: testAuto,
      [BackendSubsystem.IDENTITY]: identity,
      [BackendSubsystem.INDUSTRIAL_IOT]: iot,
      [BackendSubsystem.REALTIME]: realtime,
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
        'If LORAWAN_NETWORK_SERVER errors: check ChirpStack/TTN API key and gRPC/REST gateway connection.',
        'If ORDER_MANAGEMENT errors: check SO item mapping and SKU regex rule in item-code-utils.',
        'If TEST_AUTOMATION errors: inspect TestSession packet log and flow-graph assertion definitions.',
      ],
    };
  }

  @Get('subsystems')
  @ApiOperation({ summary: 'List all registered backend subsystems and their route namespaces' })
  getSubsystemDirectory() {
    return {
      architecture: 'Daviteq Domain-Subsystem Modular Architecture',
      version: '2.0.0',
      subsystems: [
        {
          id: BackendSubsystem.DATABASE,
          name: 'Dynamic Database Subsystem',
          routes: ['/api/database/health', '/api/database/status', '/api/database/reload'],
          description: 'Multi-tenant database connection pool, dynamic routing & health.',
        },
        {
          id: BackendSubsystem.LORAWAN,
          name: 'LoRaWAN Network Server Subsystem',
          routes: ['/api/lorawan/*', '/api/network-servers/*', '/api/webhook/*'],
          description: 'ChirpStack/TTN connectivity, device keys, downlinks, webhooks.',
        },
        {
          id: BackendSubsystem.ORDER_MANAGEMENT,
          name: 'Order Management Subsystem (SO / Item / SKU)',
          routes: ['/api/sales-orders/*', '/api/item-codes/*', '/api/sensor-types/*'],
          description: 'Sales Orders, Item Codes/SKU catalog, and sensor type mapping.',
        },
        {
          id: BackendSubsystem.TEST_AUTOMATION,
          name: 'Test Automation Subsystem',
          routes: ['/api/d-modules/test-run/*', '/api/test-builder/*', '/api/decoder/*'],
          description: 'D-Module test workbench, C-Module test builder flow engine, decoders.',
        },
        {
          id: BackendSubsystem.IDENTITY,
          name: 'Identity & Access Control Subsystem',
          routes: ['/auth/*', '/api/users/*', '/api/roles/*'],
          description: 'JWT authentication, RBAC authorization, and user administration.',
        },
        {
          id: BackendSubsystem.INDUSTRIAL_IOT,
          name: 'Industrial IoT Subsystem',
          routes: ['/api/c-modules/modbus-presets/*', '/api/c-modules/hmi-studio/*', '/api/c-modules/overview-hub/*'],
          description: 'Modbus registers, HMI SCADA studio, and system overview.',
        },
        {
          id: BackendSubsystem.REALTIME,
          name: 'Realtime Streaming Subsystem',
          routes: ['/realtime/*', 'ws://*'],
          description: 'WebSocket telemetry and test packet streaming.',
        },
      ],
    };
  }
}
