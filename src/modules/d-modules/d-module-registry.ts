/**
 * Standardized Dashboard Module (D-Module) Registry
 * Represents user-facing modules appearing on the User Portal (/dashboard)
 */
export interface DModule {
  id: string; // e.g. 'd-device-manager' or 'device-fleet'
  code: string; // e.g. 'D_MOD_DEVICE_MANAGER'
  title: string; // e.g. 'DEVICE MANAGER'
  description: string;
  icon: string; // FontAwesome icon class
  color: string; // Tailwind gradient color class
  badge?: string;
  category: 'Monitoring' | 'Fleet' | 'Analytics' | 'System' | 'Reports' | 'Custom';
  requiredPermission?: string;
  allowedRoleCodes?: string[];
  status?: 'active' | 'ready' | 'beta';
  isActive?: boolean;
}

export const DEFAULT_D_MODULES: DModule[] = [
  {
    id: 'device-fleet',
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
    id: 'telemetry-monitor',
    code: 'D_MOD_TELEMETRY',
    title: 'Live Telemetry Monitor',
    description: 'Real-time stream of incoming LoRaWAN uplink packets, SNR/RSSI signal quality, and sensor readings.',
    icon: 'fa-solid fa-wave-square',
    color: 'from-cyan-500 to-blue-600',
    badge: 'Real-time',
    category: 'Monitoring',
    requiredPermission: 'lorawan:telemetry:read',
    status: 'active',
    isActive: true,
  },
  {
    id: 'data-analytics',
    code: 'D_MOD_ANALYTICS',
    title: 'Sensor Data Analytics',
    description: 'Visual charts, historical trends, temperature & humidity metrics, and statistical aggregations.',
    icon: 'fa-solid fa-chart-line',
    color: 'from-indigo-500 to-purple-600',
    badge: 'Analytics',
    category: 'Analytics',
    requiredPermission: 'lorawan:telemetry:read',
    status: 'active',
    isActive: true,
  },
  {
    id: 'alarm-events',
    code: 'D_MOD_ALARMS',
    title: 'Alarms & Event Log',
    description: 'Threshold trigger alerts, battery level warnings, offline sensor notifications, and event logs.',
    icon: 'fa-solid fa-triangle-exclamation',
    color: 'from-amber-500 to-orange-600',
    badge: 'Alerts',
    category: 'Monitoring',
    status: 'active',
    isActive: true,
  },
  {
    id: 'report-generator',
    code: 'D_MOD_REPORTS',
    title: 'Report Generator',
    description: 'Export operational metrics, raw telemetry logs, and sensor summary datasets in CSV / Excel format.',
    icon: 'fa-solid fa-file-excel',
    color: 'from-rose-500 to-pink-600',
    badge: 'Export',
    category: 'Reports',
    status: 'active',
    isActive: true,
  },
  {
    id: 'gateway-status',
    code: 'D_MOD_GATEWAYS',
    title: 'Gateway Network Status',
    description: 'Monitor LoRaWAN outdoor and indoor base station connectivity, backhaul status, and packet rates.',
    icon: 'fa-solid fa-tower-cell',
    color: 'from-sky-500 to-cyan-600',
    badge: 'Network',
    category: 'Fleet',
    status: 'active',
    isActive: true,
  },
  {
    id: 'payload-decoder',
    code: 'D_MOD_DECODER',
    title: 'Payload Formatter Sandbox',
    description: 'Interactive JavaScript payload decoder tester for raw hex sensor data transformation.',
    icon: 'fa-solid fa-code',
    color: 'from-fuchsia-500 to-purple-600',
    badge: 'Developer',
    category: 'System',
    requiredPermission: 'lorawan:decoder:read',
    status: 'active',
    isActive: true,
  },
  {
    id: 'webhook-integrations',
    code: 'D_MOD_WEBHOOKS',
    title: 'Webhook Integrations',
    description: 'ChirpStack v4 and Actility ThingPark Wireless uplink ingestion endpoints and data routing.',
    icon: 'fa-solid fa-satellite-dish',
    color: 'from-teal-500 to-emerald-600',
    badge: 'Integration',
    category: 'System',
    requiredPermission: 'lorawan:webhooks:read',
    status: 'active',
    isActive: true,
  },
];
