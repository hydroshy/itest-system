import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  userType?: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
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

  const getStoredUser = (): UserProfile | null => {
    try {
      const stored = typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('auth_user')
        : null;
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  };

  const token = ref<string | null>(getStoredToken());
  const user = ref<UserProfile | null>(getStoredUser());

  const isAuthenticated = computed(() => !!token.value);
  const currentTenant = computed(() => ({
    id: user.value?.tenantId || 'system-core',
    name: user.value?.tenantName || 'ITEST System',
  }));

  function setAuth(newToken: string, newUser: UserProfile) {
    token.value = newToken;
    user.value = newUser;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('access_token', newToken);
        window.localStorage.setItem('auth_user', JSON.stringify(newUser));
      }
    } catch (_) {}
  }

  function logout() {
    token.value = null;
    user.value = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('access_token');
        window.localStorage.removeItem('auth_user');
      }
    } catch (_) {}
  }

  function switchTenant(tenantId: string, tenantName: string) {
    if (user.value) {
      user.value.tenantId = tenantId;
      user.value.tenantName = tenantName;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('auth_user', JSON.stringify(user.value));
        }
      } catch (_) {}
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
