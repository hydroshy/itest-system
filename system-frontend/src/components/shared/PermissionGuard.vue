<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback">
    <div v-if="showDeniedMessage" class="permission-denied-message">
      <el-alert
        title="Access Denied"
        type="error"
        description="You do not have the required permissions to view this section."
        show-icon
        :closable="false"
      />
    </div>
  </slot>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../../stores/auth';

const props = withDefaults(
  defineProps<{
    permission?: string | string[];
    role?: string | string[];
    matchMode?: 'all' | 'any';
    showDeniedMessage?: boolean;
  }>(),
  {
    matchMode: 'all',
    showDeniedMessage: false,
  }
);

const authStore = useAuthStore();

const allowed = computed(() => {
  let hasPerm = true;
  let hasR = true;

  if (props.permission) {
    hasPerm = authStore.hasPermission(props.permission, props.matchMode);
  }

  if (props.role) {
    hasR = authStore.hasRole(props.role);
  }

  return hasPerm && hasR;
});
</script>

<style scoped>
.permission-denied-message {
  padding: 12px;
}
</style>
