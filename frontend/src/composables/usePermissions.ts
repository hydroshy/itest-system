import { useAuthStore } from '../stores/auth';

export function usePermissions() {
  const authStore = useAuthStore();

  return {
    hasPermission: (permission: string | string[], matchMode: 'all' | 'any' = 'all') =>
      authStore.hasPermission(permission, matchMode),
    hasRole: (role: string | string[]) => authStore.hasRole(role),
  };
}
