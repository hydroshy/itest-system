import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  tenantName?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const getStoredToken = () => {
    try {
      return typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('access_token')
        : null;
    } catch (_) {
      return null;
    }
  };

  const token = ref<string | null>(getStoredToken() || 'mock-admin-jwt-token');
  const user = ref<UserProfile | null>({
    id: 'user-001',
    username: 'admin',
    email: 'admin@universal-iot.local',
    roles: ['admin', 'engineer'],
    permissions: [
      '*',
      'device:read',
      'device:write',
      'telemetry:read',
      'dashboard:view',
      'dashboard:edit',
      'plugin:manage',
      'serial:access',
    ],
    tenantId: 'tenant-default',
    tenantName: 'Default Production Plant',
  });

  const isAuthenticated = computed(() => !!token.value);
  const currentTenant = computed(() => ({
    id: user.value?.tenantId || 'tenant-default',
    name: user.value?.tenantName || 'Default Plant',
  }));

  function setAuth(newToken: string, newUser: UserProfile) {
    token.value = newToken;
    user.value = newUser;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('access_token', newToken);
      }
    } catch (_) {}
  }

  function logout() {
    token.value = null;
    user.value = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('access_token');
      }
    } catch (_) {}
  }

  function switchTenant(tenantId: string, tenantName: string) {
    if (user.value) {
      user.value.tenantId = tenantId;
      user.value.tenantName = tenantName;
    }
  }

  function hasPermission(permission: string | string[], matchMode: 'all' | 'any' = 'all'): boolean {
    if (!user.value) return false;
    if (user.value.roles.includes('admin') || user.value.roles.includes('superadmin') || user.value.permissions.includes('*')) {
      return true;
    }
    const perms = Array.isArray(permission) ? permission : [permission];
    if (perms.length === 0) return true;
    if (matchMode === 'any') {
      return perms.some((p) => user.value!.permissions.includes(p));
    }
    return perms.every((p) => user.value!.permissions.includes(p));
  }

  function hasRole(role: string | string[]): boolean {
    if (!user.value) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some((r) => user.value!.roles.includes(r));
  }

  return {
    token,
    user,
    isAuthenticated,
    currentTenant,
    setAuth,
    logout,
    switchTenant,
    hasPermission,
    hasRole,
  };
});
