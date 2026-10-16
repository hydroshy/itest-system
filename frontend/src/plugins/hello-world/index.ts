import { FrontendPluginDefinition } from '@platform/frontend-sdk';
import HelloWorldPage from './HelloWorldPage.vue';
import HelloWorldWidget from './HelloWorldWidget.vue';
import HelloWorldDevicePanel from './HelloWorldDevicePanel.vue';

export const helloWorldPlugin: FrontendPluginDefinition = {
  manifest: {
    id: 'plugin-hello-world',
    name: 'Hello World Plugin',
    version: '1.0.0',
    description: 'Demonstrates Frontend SDK contracts: dynamic route, menu, dashboard widget, and extension slot injection.',
    author: 'Universal Frontend Team',
    routes: [
      {
        path: 'hello-world',
        name: 'HelloWorld',
        component: HelloWorldPage,
        meta: {
          title: 'Hello World',
          icon: 'Tools',
        },
      },
    ],
    menus: [
      {
        id: 'menu-hello-world',
        label: 'Hello World',
        icon: 'Tools',
        route: '/hello-world',
        order: 99,
      },
    ],
    widgets: [
      {
        id: 'widget-hello-world',
        title: 'Hello World Extension',
        component: HelloWorldWidget,
        cols: 1,
      },
    ],
    extensions: [
      {
        id: 'ext-hello-device-panel',
        slot: 'device-detail-panel',
        component: HelloWorldDevicePanel,
        order: 1,
      },
    ],
  },
  setup: async (context) => {
    context.logger.info('plugin-hello-world setup called');
  },
  teardown: async () => {
    // cleanup resources
  },
};
