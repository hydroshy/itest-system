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
  category: 'Monitoring' | 'Fleet' | 'Analytics' | 'System' | 'Reports' | 'Custom';
  requiredPermission?: string;
  allowedRoleCodes?: string[];
  status?: 'active' | 'ready' | 'beta';
  isActive?: boolean;
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
];
