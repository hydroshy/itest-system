export declare enum BackendSubsystem {
    DATABASE = "DATABASE",
    IDENTITY = "IDENTITY_AUTH",
    REALTIME = "REALTIME_STREAM",
    PLUGINS = "PLUGINS_CORE"
}
export declare enum FrontendSubsystem {
    PAGES = "FRONTEND_PAGES",
    CONTROL_PANEL = "FRONTEND_CONTROL_PANEL",
    DASHBOARD = "FRONTEND_DASHBOARD"
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
