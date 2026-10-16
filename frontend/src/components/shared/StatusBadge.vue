<template>
  <span
    class="status-badge"
    :class="statusClass"
  >
    <span class="status-dot"></span>
    <span class="status-text">{{ label || defaultLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    status: 'online' | 'offline' | 'warning' | 'error' | 'active' | 'inactive' | 'unknown' | string;
    label?: string;
  }>(),
  {
    status: 'unknown',
  }
);

const statusClass = computed(() => {
  const s = props.status.toLowerCase();
  switch (s) {
    case 'online':
    case 'active':
    case 'connected':
      return 'is-success';
    case 'offline':
    case 'inactive':
    case 'disconnected':
      return 'is-neutral';
    case 'warning':
    case 'degraded':
      return 'is-warning';
    case 'error':
    case 'fault':
    case 'failed':
      return 'is-danger';
    default:
      return 'is-unknown';
  }
});

const defaultLabel = computed(() => {
  return props.status.charAt(0).toUpperCase() + props.status.slice(1);
});
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.is-success {
  background-color: #ecfdf5;
  color: #065f46;
}
.is-success .status-dot {
  background-color: #10b981;
}

.is-neutral {
  background-color: #f3f4f6;
  color: #4b5563;
}
.is-neutral .status-dot {
  background-color: #9ca3af;
}

.is-warning {
  background-color: #fffbeb;
  color: #92400e;
}
.is-warning .status-dot {
  background-color: #f59e0b;
}

.is-danger {
  background-color: #fef2f2;
  color: #991b1b;
}
.is-danger .status-dot {
  background-color: #ef4444;
}

.is-unknown {
  background-color: #f8fafc;
  color: #64748b;
}
.is-unknown .status-dot {
  background-color: #cbd5e1;
}
</style>
