export interface FeatureModule {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  category: 'Monitoring' | 'Fleet' | 'Analytics' | 'System' | 'Reports' | 'Custom';
  requiredPermission?: string;
  allowedRoleCodes?: string[];
  status?: 'active' | 'ready' | 'beta';
  isActive?: boolean;
}

export const FEATURE_MODULES_REGISTRY: FeatureModule[] = [
  {
    id: 'telemetry-monitor',
    code: 'FEATURE_TELEMETRY',
    title: 'Live Telemetry Monitor',
    description: 'Real-time stream of incoming LoRaWAN uplink packets, SNR/RSSI signal quality, and sensor readings.',
    icon: 'fa-solid fa-wave-square',
    color: 'from-cyan-500 to-blue-600',
    badge: 'Real-time',
    category: 'Monitoring',
    requiredPermission: 'lorawan:telemetry:read',
    status: 'active',
  },
  {
    id: 'device-fleet',
    code: 'FEATURE_DEVICES',
    title: 'Device Fleet Manager',
    description: 'Manage registered end-devices, DevEUIs, activation keys (OTAA/ABP), and battery status.',
    icon: 'fa-solid fa-microchip',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Fleet',
    category: 'Fleet',
    requiredPermission: 'lorawan:device:read',
    status: 'active',
  },
  {
    id: 'data-analytics',
    code: 'FEATURE_ANALYTICS',
    title: 'Sensor Data Analytics',
    description: 'Visual charts, historical trends, temperature & humidity metrics, and statistical aggregations.',
    icon: 'fa-solid fa-chart-line',
    color: 'from-indigo-500 to-purple-600',
    badge: 'Analytics',
    category: 'Analytics',
    requiredPermission: 'lorawan:telemetry:read',
    status: 'active',
  },
  {
    id: 'alarm-events',
    code: 'FEATURE_ALARMS',
    title: 'Alarms & Event Log',
    description: 'Threshold trigger alerts, battery level warnings, offline sensor notifications, and event logs.',
    icon: 'fa-solid fa-triangle-exclamation',
    color: 'from-amber-500 to-orange-600',
    badge: 'Alerts',
    category: 'Monitoring',
    status: 'active',
  },
  {
    id: 'report-generator',
    code: 'FEATURE_REPORTS',
    title: 'Report Generator',
    description: 'Export operational metrics, raw telemetry logs, and sensor summary datasets in CSV / Excel format.',
    icon: 'fa-solid fa-file-excel',
    color: 'from-rose-500 to-pink-600',
    badge: 'Export',
    category: 'Analytics',
    status: 'active',
  },
  {
    id: 'gateway-status',
    code: 'FEATURE_GATEWAYS',
    title: 'Gateway Network Status',
    description: 'Monitor LoRaWAN outdoor and indoor base station connectivity, backhaul status, and packet rates.',
    icon: 'fa-solid fa-tower-cell',
    color: 'from-sky-500 to-cyan-600',
    badge: 'Network',
    category: 'Fleet',
    status: 'active',
  },
  {
    id: 'payload-decoder',
    code: 'FEATURE_DECODER',
    title: 'Payload Formatter Sandbox',
    description: 'Interactive JavaScript payload decoder tester for raw hex sensor data transformation.',
    icon: 'fa-solid fa-code',
    color: 'from-fuchsia-500 to-purple-600',
    badge: 'Developer',
    category: 'System',
    requiredPermission: 'lorawan:decoder:read',
    status: 'active',
  },
  {
    id: 'webhook-integrations',
    code: 'FEATURE_WEBHOOKS',
    title: 'Webhook Integrations',
    description: 'ChirpStack v4 and Actility ThingPark Wireless uplink ingestion endpoints and data routing.',
    icon: 'fa-solid fa-satellite-dish',
    color: 'from-teal-500 to-emerald-600',
    badge: 'Integration',
    category: 'System',
    requiredPermission: 'lorawan:webhooks:read',
    status: 'active',
  },
];
