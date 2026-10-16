import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

export function useAuth() {
  const authStore = useAuthStore();

  return {
    user: computed(() => authStore.user),
    token: computed(() => authStore.token),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    login: authStore.setAuth,
    logout: authStore.logout,
  };
}
