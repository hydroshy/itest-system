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
    id: 'telemetry-decoder',
    code: 'D_MOD_TELEMETRY_DECODER',
    title: 'LIVE TELEMETRY & DECODER',
    description: 'Inspect live LoRaWAN uplink packets, select created devices via dropdown, and view decoded sensor attributes in tabular format.',
    icon: 'fa-solid fa-table-list',
    color: 'from-purple-500 to-indigo-600',
    badge: 'Telemetry',
    category: 'Monitoring',
    requiredPermission: 'lorawan:telemetry:read',
    status: 'active',
    isActive: true,
  },
  {
    id: 'hmi-scada-viewer',
    code: 'D_MOD_HMI_SCADA',
    title: 'HMI SCADA MONITOR',
    description: 'Interactive Wecon-style industrial HMI SCADA mimic diagrams, live tank levels, gauge meters, and downlink actuator switches.',
    icon: 'fa-solid fa-palette',
    color: 'from-amber-500 to-orange-600',
    badge: 'SCADA',
    category: 'Monitoring',
    requiredPermission: 'lorawan:telemetry:read',
    status: 'active',
    isActive: true,
  },
];


