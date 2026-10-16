<template>
  <div class="extension-slot" :class="`slot-${name}`">
    <template v-for="ext in extensions" :key="ext.id">
      <component
        :is="ext.component"
        v-bind="context"
        class="extension-item"
      />
    </template>
    <div v-if="extensions.length === 0 && emptyFallback" class="extension-empty">
      <slot name="empty" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePluginsStore } from '../../stores/plugins';

const props = withDefaults(
  defineProps<{
    name: string;
    context?: Record<string, any>;
    emptyFallback?: boolean;
  }>(),
  {
    context: () => ({}),
    emptyFallback: false,
  }
);

const pluginsStore = usePluginsStore();

const extensions = computed(() => {
  return pluginsStore.getExtensionsForSlot(props.name);
});
</script>

<style scoped>
.extension-slot {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
