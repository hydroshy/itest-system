/**
 * Subsystem Domain Classification & Diagnostics
 * Used for pinpointing error sources across Frontend and Backend domains.
 */

export enum BackendSubsystem {
  DATABASE = 'DATABASE',
  LORAWAN = 'LORAWAN_NETWORK_SERVER',
  ORDER_MANAGEMENT = 'ORDER_MANAGEMENT',
  TEST_AUTOMATION = 'TEST_AUTOMATION',
  IDENTITY = 'IDENTITY_AUTH',
  INDUSTRIAL_IOT = 'INDUSTRIAL_IOT',
  REALTIME = 'REALTIME_STREAM',
}

export enum FrontendSubsystem {
  PAGES = 'FRONTEND_PAGES',
  CONTROL_PANEL = 'FRONTEND_CONTROL_PANEL',
  DASHBOARD = 'FRONTEND_DASHBOARD',
}

export interface SubsystemHealthStatus {
  subsystem: BackendSubsystem;
  status: 'UP' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  details?: Record<string, any>;
  error?: string | null;
}

export interface DomainDiagnosticReport {
  timestamp: string;
  overallStatus: 'UP' | 'DEGRADED' | 'DOWN';
  subsystems: Record<BackendSubsystem, SubsystemHealthStatus>;
  debugGuidance: string[];
}
