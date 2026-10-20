import { createApp } from 'vue';
import * as Vue from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import * as PlatformFrontendSdk from '@platform/frontend-sdk';

import App from './App.vue';
import router from './router';
import { usePluginsStore } from './stores/plugins';

// Expose shared runtime for remote dynamic plugins
(window as any).Vue = Vue;
(window as any).ElementPlus = ElementPlus;
(window as any).PlatformFrontendSdk = PlatformFrontendSdk;

// Sample Plugins
import { helloWorldPlugin } from './plugins/hello-world';
import { serialTerminalPlugin } from './plugins/serial-terminal';
import { telemetryMonitorPlugin } from './plugins/telemetry-monitor';
import { DiagnosticsExplorerPlugin } from './plugins/diagnostics-explorer';

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);
  app.use(ElementPlus);

  // Register Element Plus icons globally
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  // Bind Router to Plugin Registry for Dynamic Route Injection
  const pluginsStore = usePluginsStore();
  pluginsStore.setRouter(router);

  // Register built-in frontend plugins
  await pluginsStore.registerPlugin(helloWorldPlugin, true);
  await pluginsStore.registerPlugin(serialTerminalPlugin, true);
  await pluginsStore.registerPlugin(telemetryMonitorPlugin, true);
  await pluginsStore.registerPlugin(DiagnosticsExplorerPlugin, true);

  app.mount('#app');
}

bootstrap().catch((err) => {
  console.error('Failed to initialize Universal IoT Frontend:', err);
});
