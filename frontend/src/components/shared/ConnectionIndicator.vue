<template>
  <div class="connection-indicator" :class="stateClass" :title="tooltipText">
    <span class="pulse-ring" v-if="state === 'connected' || state === 'connecting'"></span>
    <span class="core-dot"></span>
    <span class="label" v-if="showLabel">{{ displayLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    state: 'connected' | 'disconnected' | 'connecting' | 'error';
    showLabel?: boolean;
    label?: string;
  }>(),
  {
    state: 'disconnected',
    showLabel: false,
  }
);

const stateClass = computed(() => `state-${props.state}`);

const displayLabel = computed(() => {
  if (props.label) return props.label;
  switch (props.state) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Connection Error';
  }
});

const tooltipText = computed(() => `Status: ${displayLabel.value}`);
</script>

<style scoped>
.connection-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  font-size: 13px;
}

.core-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  z-index: 2;
}

.pulse-ring {
  position: absolute;
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  animation: pulse 2s infinite ease-out;
  z-index: 1;
}

.state-connected .core-dot {
  background-color: #10b981;
}
.state-connected .pulse-ring {
  background-color: rgba(16, 185, 129, 0.4);
}

.state-connecting .core-dot {
  background-color: #3b82f6;
}
.state-connecting .pulse-ring {
  background-color: rgba(59, 130, 246, 0.4);
}

.state-disconnected .core-dot {
  background-color: #9ca3af;
}

.state-error .core-dot {
  background-color: #ef4444;
}

@keyframes pulse {
  0% {
    transform: translateY(-50%) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translateY(-50%) scale(2.2);
    opacity: 0;
  }
}
</style>
