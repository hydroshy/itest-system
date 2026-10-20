import { defineStore } from 'pinia';
import { ref, markRaw } from 'vue';
import {
  FrontendPluginRegistry,
  FrontendPluginDefinition,
  FrontendPluginInstance,
  FrontendRouteDefinition,
  FrontendMenuDefinition,
  FrontendWidgetDefinition,
  FrontendExtensionPoint,
} from '@platform/frontend-sdk';
import { useAuthStore } from './auth';
import type { Router } from 'vue-router';

export const usePluginsStore = defineStore('plugins', () => {
  const authStore = useAuthStore();
  const registry = new FrontendPluginRegistry();

  registry.setUserPermissionsProvider(() => ({
    permissions: authStore.user?.permissions || [],
    roles: authStore.user?.roles || [],
  }));

  const plugins = ref<FrontendPluginInstance[]>([]);
  const activeRoutes = ref<FrontendRouteDefinition[]>([]);
  const activeMenus = ref<FrontendMenuDefinition[]>([]);
  const activeWidgets = ref<FrontendWidgetDefinition[]>([]);

  // Route removal functions tracked by pluginId
  const routeRemovers = new Map<string, Array<() => void>>();
  let attachedRouter: Router | null = null;

  function syncState() {
    plugins.value = registry.listPlugins();
    activeRoutes.value = registry.getRoutes();
    activeMenus.value = registry.getMenus();
    activeWidgets.value = registry.getWidgets();
  }

  function setRouter(router: Router) {
    attachedRouter = router;
  }

  async function registerPlugin(definition: FrontendPluginDefinition, autoEnable = true) {
    await registry.register(definition);
    if (autoEnable) {
      await enablePlugin(definition.manifest.id);
    } else {
      syncState();
    }
  }

  async function enablePlugin(pluginId: string) {
    await registry.enable(pluginId);
    // Inject dynamic routes into router if router is available
    if (attachedRouter) {
      const plugin = registry.getPlugin(pluginId);
      const manifestRoutes = plugin?.manifest.routes || [];
      const removers: Array<() => void> = [];

      for (const route of manifestRoutes) {
        // Only register if permitted
        if (route.meta?.permissions && !authStore.hasPermission(route.meta.permissions)) {
          continue;
        }

        const routeRecord = {
          path: route.path,
          name: route.name,
          component: typeof route.component === 'function' ? route.component : markRaw(route.component),
          meta: {
            ...route.meta,
            pluginId,
          },
        };

        // Add to main layout children
        const remover = attachedRouter.addRoute('AppLayout', routeRecord);
        removers.push(remover);
      }
      routeRemovers.set(pluginId, removers);
    }

    syncState();
  }

  async function disablePlugin(pluginId: string) {
    await registry.disable(pluginId);

    // Remove dynamic routes
    const removers = routeRemovers.get(pluginId);
    if (removers) {
      removers.forEach((remove) => remove());
      routeRemovers.delete(pluginId);
    }

    syncState();
  }

  async function unregisterPlugin(pluginId: string) {
    await disablePlugin(pluginId);
    await registry.unregister(pluginId);
    syncState();
  }

  function getExtensionsForSlot(slot: string): FrontendExtensionPoint[] {
    return registry.getExtensions(slot);
  }

  return {
    registry,
    plugins,
    activeRoutes,
    activeMenus,
    activeWidgets,
    setRouter,
    syncState,
    registerPlugin,
    enablePlugin,
    disablePlugin,
    unregisterPlugin,
    getExtensionsForSlot,
  };
});
