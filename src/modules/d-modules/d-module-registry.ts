/**
 * Standardized Dashboard Module (D-Module) Registry
 * Represents user-facing modules appearing on the User Portal (/dashboard)
 */
export interface DModule {
  id: string; // e.g. 'device-manager'
  code: string; // e.g. 'D_MOD_DEVICE_MANAGER'
  title: string; // e.g. 'DEVICE MANAGER'
  description: string;
  icon: string; // FontAwesome icon class
  color: string; // Tailwind gradient color class
  badge?: string;
  category: 'Monitoring' | 'Fleet' | 'Analytics' | 'System' | 'Reports' | 'Infrastructure' | 'Custom';
  requiredPermission?: string;
  allowedRoleCodes?: string[];
  status?: 'active' | 'ready' | 'beta';
  isActive?: boolean;
  order?: number;
  span?: number; // Tile width span: 1 (standard) or 2 (wide)
}

export interface RoleLayoutConfig {
  roleCode: string;
  moduleOrder: string[]; // array of module IDs in display order
  moduleSpans?: Record<string, number>; // custom width span per module (1 or 2)
  disabledModuleIds: string[]; // module IDs hidden specifically for this role
  updatedAt?: string;
}

export const DEFAULT_D_MODULES: DModule[] = [
  {
    id: 'device-manager',
    code: 'D_MOD_DEVICE_MANAGER',
    title: 'DEVICE MANAGER',
    description: 'Manage registered end-devices, DevEUIs, activation keys (OTAA/ABP), and battery status with Card Grid.',
    icon: 'fa-solid fa-microchip',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Fleet',
    category: 'Fleet',
    requiredPermission: 'lorawan:device:read',
    status: 'active',
    isActive: true,
  },
  {
    id: 'telemetry-live',
    code: 'D_MOD_TELEMETRY',
    title: 'LIVE TELEMETRY',
    description: 'Real-time LoRaWAN uplink stream, signal quality metrics (RSSI, SNR), and payload decoder inspector.',
    icon: 'fa-solid fa-satellite-dish',
    color: 'from-cyan-500 to-blue-600',
    badge: 'Real-time',
    category: 'Monitoring',
    requiredPermission: 'lorawan:telemetry:read',
    status: 'active',
    isActive: true,
  },
  {
    id: 'gateway-monitor',
    code: 'D_MOD_GATEWAYS',
    title: 'GATEWAY MONITOR',
    description: 'Monitor LoRaWAN gateways, signal coverage, regional frequencies, and connection health.',
    icon: 'fa-solid fa-tower-broadcast',
    color: 'from-indigo-500 to-purple-600',
    badge: 'Network',
    category: 'Infrastructure',
    requiredPermission: 'lorawan:device:read',
    status: 'active',
    isActive: true,
  },
  {
    id: 'sensor-analytics',
    code: 'D_MOD_ANALYTICS',
    title: 'SENSOR ANALYTICS',
    description: 'Historical telemetry charts, sensor trend visualizations, and threshold monitoring.',
    icon: 'fa-solid fa-chart-line',
    color: 'from-amber-500 to-orange-600',
    badge: 'Metrics',
    category: 'Analytics',
    requiredPermission: 'lorawan:telemetry:read',
    status: 'active',
    isActive: true,
  },
  {
    id: 'dynamic-reports',
    code: 'D_MOD_REPORTS',
    title: 'DYNAMIC DATA REPORTS',
    description: 'Customizable 12-column drag-and-drop grid data reports, sensor aggregation, and CSV exports.',
    icon: 'fa-solid fa-file-lines',
    color: 'from-violet-500 to-fuchsia-600',
    badge: 'Reports',
    category: 'Reports',
    status: 'ready',
    isActive: true,
  },
];

