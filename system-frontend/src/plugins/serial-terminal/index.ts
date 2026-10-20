import { FrontendPluginDefinition } from '@platform/frontend-sdk';
import SerialTerminalPage from './SerialTerminalPage.vue';
import SerialStatusWidget from './SerialStatusWidget.vue';

export const serialTerminalPlugin: FrontendPluginDefinition = {
  manifest: {
    id: 'plugin-serial-terminal',
    name: 'Industrial Web Serial Terminal',
    version: '1.0.0',
    description: 'Hardware communication terminal utilizing Web Serial API for RS-485 / RS-232 direct debugging.',
    author: 'Universal Protocol Team',
    permissions: ['serial:access'],
    routes: [
      {
        path: 'tools/serial-terminal',
        name: 'SerialTerminal',
        component: SerialTerminalPage,
        meta: {
          title: 'Web Serial Terminal',
          icon: 'Tools',
          permissions: ['serial:access'],
        },
      },
    ],
    menus: [
      {
        id: 'menu-serial-terminal',
        label: 'Serial Terminal',
        icon: 'Tools',
        route: '/tools/serial-terminal',
        order: 50,
        permission: 'serial:access',
      },
    ],
    widgets: [
      {
        id: 'widget-serial-status',
        title: 'Hardware Serial Port',
        component: SerialStatusWidget,
        cols: 1,
        permission: 'serial:access',
      },
    ],
  },
  setup: async (context) => {
    context.logger.info('plugin-serial-terminal initialized');
  },
  teardown: async () => {},
};
