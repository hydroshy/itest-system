import { FrontendPluginDefinition } from '@platform/frontend-sdk';
import TelemetryChartWidget from './TelemetryChartWidget.vue';

export const telemetryMonitorPlugin: FrontendPluginDefinition = {
  manifest: {
    id: 'plugin-telemetry-monitor',
    name: 'Real-time Telemetry Visualizer',
    version: '1.0.0',
    description: 'ECharts-powered dynamic telemetry streaming chart widget for industrial metrics.',
    author: 'Universal Telemetry Team',
    widgets: [
      {
        id: 'widget-telemetry-chart',
        title: 'Boiler Telemetry Trend',
        component: TelemetryChartWidget,
        cols: 2,
      },
    ],
  },
  setup: async (context) => {
    context.logger.info('plugin-telemetry-monitor initialized');
  },
  teardown: async () => {},
};
