import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

export function useTenant() {
  const authStore = useAuthStore();

  return {
    tenant: computed(() => authStore.currentTenant),
    switchTenant: authStore.switchTenant,
  };
}
