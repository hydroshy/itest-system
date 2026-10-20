import { describe, it, expect } from 'vitest';
import { dynamicPluginLoader } from '../services/dynamicPluginLoader';
import type { FrontendPluginManifest } from '@platform/frontend-sdk';

describe('Dynamic Plugin Loader Service', () => {
  it('provides marketplace presets matching official industrial protocols', () => {
    const presets = dynamicPluginLoader.getMarketplacePresets();
    expect(presets.length).toBeGreaterThanOrEqual(5);

    const modbus = presets.find((p) => p.id === 'modbus-rtu');
    expect(modbus).toBeDefined();
    expect(modbus?.category).toBe('protocol');
    expect(modbus?.repository).toContain('github.com');
  });

  it('creates declarative plugin with routes, menus and widgets from manifest', () => {
    const manifest: FrontendPluginManifest = {
      id: 'test-custom-plugin',
      name: 'Test Custom Plugin',
      version: '1.0.0',
      description: 'Declarative dynamic plugin test',
      routes: [
        {
          path: '/test-custom',
          name: 'TestCustom',
          component: 'CustomPageComponent',
          meta: {
            title: 'Custom Page',
            icon: 'Setting',
          },
        },
      ],
      menus: [
        {
          id: 'test-menu',
          label: 'Custom Menu',
          route: '/test-custom',
        },
      ],
      widgets: [
        {
          id: 'test-widget',
          title: 'Custom Widget',
          category: 'telemetry',
          component: 'CustomWidgetComponent',
        },
      ],
    };

    const plugin = dynamicPluginLoader.createDeclarativePlugin(manifest);
    expect(plugin.manifest.id).toBe('test-custom-plugin');
    expect(plugin.manifest.name).toBe('Test Custom Plugin');
    expect(plugin.manifest.routes).toHaveLength(1);
    expect(plugin.manifest.menus).toHaveLength(1);
    expect(plugin.manifest.widgets).toHaveLength(1);
    expect(plugin.manifest.routes?.[0].path).toBe('/test-custom');
  });

  it('rejects loading from invalid bundle file content', async () => {
    const badFile = new File(['invalid json text'], 'plugin.json', {
      type: 'application/json',
    });

    await expect(dynamicPluginLoader.loadFromFile(badFile)).rejects.toThrow();
  });
});
