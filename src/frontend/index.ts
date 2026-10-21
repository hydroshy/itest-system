/**
 * Daviteq Frontend Application Layer
 * Contains all client-side pages, SPA templates, and feature modules.
 */

// Pages
export { LOGIN_HTML } from './pages/login.page';
export { DASHBOARD_HTML } from './pages/dashboard.page';
export { CONTROL_PANEL_HTML } from './pages/control-panel.page';

// Dashboard User Feature Modules
export * from './modules/dashboard/device-manager.module';
export * from './modules/dashboard/test-automation.module';
export * from './modules/dashboard/telemetry.module';
export * from './modules/dashboard/hmi-scada.module';
export {
  DOWNLINK_TEMPLATE as DASHBOARD_DOWNLINK_TEMPLATE,
  DOWNLINK_MODALS as DASHBOARD_DOWNLINK_MODALS,
  DOWNLINK_SCRIPT as DASHBOARD_DOWNLINK_SCRIPT,
} from './modules/dashboard/downlink.module';
export * from './modules/dashboard/serial-uart.module';
export * from './modules/dashboard/traceability.module';
export * from './modules/dashboard/final-config-device.module';

