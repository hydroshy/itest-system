import { FrontendPluginDefinition } from '@platform/frontend-sdk';
import DiagnosticsExplorerPage from './DiagnosticsExplorerPage.vue';
import DiagnosticsWidget from './DiagnosticsWidget.vue';

export const DiagnosticsExplorerPlugin: FrontendPluginDefinition = {
  manifest: {
    id: 'plugin-diagnostics-explorer',
    name: 'Protocol Diagnostics Explorer',
    version: '1.0.0',
    description: 'Modbus Register Explorer and MQTT Topic Inspector for industrial hardware troubleshooting',
    author: 'Platform Core Team',
    permissions: ['device:read'],
    capabilities: ['modbus', 'mqtt', 'diagnostics'],
    routes: [
      {
        path: 'tools/diagnostics',
        name: 'ProtocolDiagnostics',
        component: DiagnosticsExplorerPage,
        meta: {
          title: 'Diagnostics Explorer',
          icon: 'Search',
          permissions: ['device:read'],
        },
      },
    ],
    menus: [
      {
        id: 'menu-diagnostics',
        label: 'Protocol Diagnostics',
        icon: 'Search',
        route: '/tools/diagnostics',
        order: 25,
        permission: 'device:read',
      },
    ],
    widgets: [
      {
        id: 'widget-diagnostics-health',
        title: 'Protocol Bus Health',
        component: DiagnosticsWidget,
        cols: 1,
        permission: 'device:read',
      },
    ],
  },
  setup: async (context) => {
    context.logger.info('plugin-diagnostics-explorer initialized');
  },
  teardown: async () => {},
};
