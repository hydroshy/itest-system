import { describe, it, expect, beforeEach } from 'vitest';
import { FrontendPluginRegistry, FrontendPluginDefinition } from '@platform/frontend-sdk';

describe('FrontendPluginRegistry', () => {
  let registry: FrontendPluginRegistry;

  const mockPlugin: FrontendPluginDefinition = {
    manifest: {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      routes: [
        {
          path: '/test-route',
          name: 'TestRoute',
          component: { template: '<div>Test Route</div>' },
          meta: { title: 'Test Page', permissions: ['test:read'] },
        },
      ],
      menus: [
        {
          id: 'test-menu',
          label: 'Test Menu',
          icon: 'TestIcon',
          route: '/test-route',
          order: 10,
          permission: 'test:read',
        },
      ],
      widgets: [
        {
          id: 'test-widget',
          title: 'Test Widget',
          component: { template: '<div>Widget</div>' },
          permission: 'test:read',
        },
      ],
      extensions: [
        {
          id: 'test-ext',
          slot: 'device-details',
          component: { template: '<div>Extension</div>' },
          order: 1,
        },
      ],
    },
    setup: async () => {},
    teardown: async () => {},
  };

  beforeEach(() => {
    registry = new FrontendPluginRegistry();
  });

  it('registers a plugin in inactive state initially', async () => {
    await registry.register(mockPlugin);
    const plugins = registry.listPlugins();
    expect(plugins.length).toBe(1);
    expect(plugins[0].manifest.id).toBe('test-plugin');
    expect(plugins[0].status).toBe('inactive');

    // No active routes or menus while inactive
    expect(registry.getRoutes().length).toBe(0);
    expect(registry.getMenus().length).toBe(0);
    expect(registry.getWidgets().length).toBe(0);
    expect(registry.getExtensions('device-details').length).toBe(0);
  });

  it('activates routes, menus, widgets, and extensions when enabled with permissions', async () => {
    registry.setUserPermissionsProvider(() => ({
      permissions: ['test:read'],
      roles: ['user'],
    }));

    await registry.register(mockPlugin);
    await registry.enable('test-plugin');

    const plugins = registry.listPlugins();
    expect(plugins[0].status).toBe('active');

    expect(registry.getRoutes().length).toBe(1);
    expect(registry.getRoutes()[0].name).toBe('TestRoute');

    expect(registry.getMenus().length).toBe(1);
    expect(registry.getMenus()[0].label).toBe('Test Menu');

    expect(registry.getWidgets().length).toBe(1);
    expect(registry.getExtensions('device-details').length).toBe(1);
  });

  it('filters out routes/menus/widgets when user lacks permission', async () => {
    registry.setUserPermissionsProvider(() => ({
      permissions: ['other:permission'],
      roles: ['user'],
    }));

    await registry.register(mockPlugin);
    await registry.enable('test-plugin');

    // Even though plugin is active, permissions filter out the unauthorized items
    expect(registry.getRoutes().length).toBe(0);
    expect(registry.getMenus().length).toBe(0);
    expect(registry.getWidgets().length).toBe(0);
  });

  it('cleans up routes, menus, and widgets when plugin is disabled', async () => {
    registry.setUserPermissionsProvider(() => ({
      permissions: ['test:read'],
      roles: ['user'],
    }));

    await registry.register(mockPlugin);
    await registry.enable('test-plugin');
    expect(registry.getRoutes().length).toBe(1);

    await registry.disable('test-plugin');
    expect(registry.getPlugin('test-plugin')?.status).toBe('inactive');
    expect(registry.getRoutes().length).toBe(0);
    expect(registry.getMenus().length).toBe(0);
    expect(registry.getWidgets().length).toBe(0);
    expect(registry.getExtensions('device-details').length).toBe(0);
  });

  it('prevents registering conflicting plugin IDs', async () => {
    await registry.register(mockPlugin);
    await expect(registry.register(mockPlugin)).rejects.toThrow('already registered');
  });
});
