import { computed } from 'vue';
import { usePluginsStore } from '../stores/plugins';

export function usePlugins() {
  const pluginStore = usePluginsStore();

  return {
    plugins: computed(() => pluginStore.plugins),
    activeRoutes: computed(() => pluginStore.activeRoutes),
    activeMenus: computed(() => pluginStore.activeMenus),
    activeWidgets: computed(() => pluginStore.activeWidgets),
    registerPlugin: pluginStore.registerPlugin,
    enablePlugin: pluginStore.enablePlugin,
    disablePlugin: pluginStore.disablePlugin,
    unregisterPlugin: pluginStore.unregisterPlugin,
    getExtensionsForSlot: pluginStore.getExtensionsForSlot,
  };
}
