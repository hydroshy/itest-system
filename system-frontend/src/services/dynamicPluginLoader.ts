import type {
  FrontendPluginDefinition,
  FrontendPluginManifest,
} from '@platform/frontend-sdk';

export interface RemotePluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  bundleUrl?: string;
  manifestUrl?: string;
  repository?: string;
  tags?: string[];
  permissions?: string[];
  category?: 'protocol' | 'visualization' | 'analytics' | 'tool' | 'integration';
  icon?: string;
}

export interface LoadPluginOptions {
  autoEnable?: boolean;
  timeoutMs?: number;
  skipPermissionWarning?: boolean;
}

export class DynamicPluginLoaderService {
  private static instance: DynamicPluginLoaderService;

  private constructor() {}

  public static getInstance(): DynamicPluginLoaderService {
    if (!DynamicPluginLoaderService.instance) {
      DynamicPluginLoaderService.instance = new DynamicPluginLoaderService();
    }
    return DynamicPluginLoaderService.instance;
  }

  /**
   * Validate manifest structure and required attributes
   */
  public validateManifest(manifest: any): FrontendPluginManifest {
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Plugin manifest must be a non-null JSON object');
    }
    if (!manifest.id || typeof manifest.id !== 'string') {
      throw new Error('Manifest missing valid "id" field');
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Manifest missing valid "name" field');
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Manifest missing valid "version" field (SemVer format)');
    }

    return manifest as FrontendPluginManifest;
  }

  /**
   * Load and evaluate a plugin definition from a remote URL (ESM or UMD bundle)
   */
  public async loadFromUrl(
    bundleUrl: string,
    manifestOverride?: FrontendPluginManifest,
    options: LoadPluginOptions = {}
  ): Promise<FrontendPluginDefinition> {
    const timeout = options.timeoutMs || 15000;

    // Timeout guard
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout loading plugin from ${bundleUrl}`)), timeout);
    });

    const loadPromise = async (): Promise<FrontendPluginDefinition> => {
      // 1. Try native dynamic ESM import
      try {
        const module = await import(/* @vite-ignore */ bundleUrl);
        const definition: FrontendPluginDefinition = module.default || module.plugin || module;
        if (definition && definition.manifest) {
          this.validateManifest(definition.manifest);
          return definition;
        }
      } catch (esmErr: any) {
        console.warn(`[DynamicPluginLoader] Native import failed, falling back to script evaluation:`, esmErr);
      }

      // 2. Fallback: Fetch code text and execute in scoped sandbox
      const response = await fetch(bundleUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch bundle from ${bundleUrl}: HTTP ${response.status} ${response.statusText}`);
      }
      const code = await response.text();
      return this.evaluateBundleCode(code, manifestOverride);
    };

    return Promise.race([loadPromise(), timeoutPromise]);
  }

  /**
   * Load plugin definition from an uploaded file (JS/MJS bundle or JSON manifest)
   */
  public async loadFromFile(file: File): Promise<FrontendPluginDefinition> {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
      const text = await file.text();
      const manifest = this.validateManifest(JSON.parse(text));
      return this.createDeclarativePlugin(manifest);
    }

    if (fileName.endsWith('.js') || fileName.endsWith('.mjs') || fileName.endsWith('.ts')) {
      const code = await file.text();
      return this.evaluateBundleCode(code);
    }

    throw new Error(`Unsupported file type: ${file.name}. Please upload a .js, .mjs bundle or .json manifest.`);
  }

  /**
   * Evaluate raw JavaScript code containing a plugin export
   */
  public evaluateBundleCode(
    code: string,
    manifestOverride?: FrontendPluginManifest
  ): FrontendPluginDefinition {
    const win = window as any;
    const Vue = win.Vue;
    const ElementPlus = win.ElementPlus;
    const PlatformFrontendSdk = win.PlatformFrontendSdk;

    const moduleObj = { exports: {} as any };
    const exportsObj = moduleObj.exports;

    try {
      // Execute wrapped bundle with Backbone's shared libraries
      const runner = new Function(
        'Vue',
        'ElementPlus',
        'PlatformFrontendSdk',
        'exports',
        'module',
        'require',
        `
        "use strict";
        ${code}
        `
      );

      // Minimal require mock for common globals
      const mockRequire = (id: string) => {
        if (id === 'vue') return Vue;
        if (id === 'element-plus') return ElementPlus;
        if (id === '@platform/frontend-sdk') return PlatformFrontendSdk;
        throw new Error(`[DynamicPluginLoader] Cannot require unknown module: "${id}" in sandboxed plugin`);
      };

      runner(Vue, ElementPlus, PlatformFrontendSdk, exportsObj, moduleObj, mockRequire);

      const def: FrontendPluginDefinition =
        moduleObj.exports.default ||
        moduleObj.exports.plugin ||
        moduleObj.exports;

      if (!def || typeof def !== 'object') {
        throw new Error('Plugin bundle did not export a valid FrontendPluginDefinition object (export default or exports.plugin)');
      }

      if (manifestOverride) {
        def.manifest = { ...def.manifest, ...manifestOverride };
      }

      this.validateManifest(def.manifest);
      return def;
    } catch (err: any) {
      throw new Error(`Error executing plugin bundle code: ${err.message}`);
    }
  }

  /**
   * Create a functional plugin definition from a pure JSON declarative manifest
   */
  public createDeclarativePlugin(manifest: FrontendPluginManifest): FrontendPluginDefinition {
    const Vue = (window as any).Vue;
    const h = Vue ? Vue.h : (tag: string, props: any, children: any) => ({ tag, props, children });

    return {
      manifest,
      async setup(ctx) {
        console.log(`[DynamicPlugin] Declarative plugin "${manifest.name}" initialized.`);

        // Register declarative routes if specified
        if (manifest.routes) {
          for (const route of manifest.routes) {
            ctx.registerRoute(route);
          }
        }

        // Register declarative menus if specified
        if (manifest.menus) {
          for (const menu of manifest.menus) {
            ctx.registerMenu(menu);
          }
        }

        // If manifest specifies dynamic widgets, register placeholder/declarative components
        if (manifest.widgets) {
          for (const widgetDef of manifest.widgets) {
            ctx.registerWidget({
              ...widgetDef,
              component: widgetDef.component || {
                name: `Widget_${manifest.id}_${widgetDef.id}`,
                render() {
                  return h(
                    'div',
                    {
                      style: {
                        padding: '16px',
                        background: '#f8fafc',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '8px',
                        textAlign: 'center',
                      },
                    },
                    [
                      h('h4', { style: { margin: '0 0 8px 0', color: '#1e293b' } }, widgetDef.title),
                      h('p', { style: { fontSize: '13px', color: '#64748b', margin: 0 } }, widgetDef.description || 'Dynamic declarative widget mounted.'),
                      h('span', { style: { fontSize: '11px', color: '#3b82f6', display: 'inline-block', marginTop: '6px' } }, `Source: ${manifest.name} v${manifest.version}`),
                    ]
                  );
                },
              },
            });
          }
        }
      },
      async teardown() {
        console.log(`[DynamicPlugin] Declarative plugin "${manifest.name}" dismantled.`);
      },
    };
  }

  /**
   * List of sample remote / marketplace plugins ready for test loading
   */
  public getMarketplacePresets(): RemotePluginMetadata[] {
    return [
      {
        id: 'modbus-rtu',
        name: 'Modbus RTU / RS485 Industrial Master',
        version: '1.0.0',
        description: 'Standard serial Modbus RTU protocol adapter with CRC16 framing, register poller, and bus monitor.',
        author: 'ITEST Core Team',
        category: 'protocol',
        tags: ['modbus', 'rs485', 'serial', 'telemetry'],
        repository: 'https://github.com/itest-org/itest-plugin-modbus-rtu',
        icon: 'Connection',
        permissions: ['device:read', 'device:write'],
      },
      {
        id: 'remote-weather-station',
        name: 'Industrial Weather Station',
        version: '1.2.0',
        description: 'Micro-climate and ambient weather telemetry collector with outdoor temperature, humidity, and barometric pressure widgets.',
        author: 'EcoSensors Industrial Ltd.',
        category: 'visualization',
        tags: ['weather', 'telemetry', 'hmi', 'sensors'],
        repository: 'https://github.com/universal-iot-plugins/plugin-weather-station',
        icon: 'Sunny',
        permissions: ['read:telemetry'],
      },
      {
        id: 'remote-vibration-fft',
        name: 'Vibration & FFT Spectrum Analyzer',
        version: '2.0.1',
        description: 'High-speed accelerometer vibration harmonics inspection, bearing defect alerts, and 3-axis FFT spectral charts.',
        author: 'Predictive Machinery Corp.',
        category: 'analytics',
        tags: ['predictive-maintenance', 'fft', 'vibration', 'rs485'],
        repository: 'https://github.com/universal-iot-plugins/plugin-vibration-fft',
        icon: 'TrendCharts',
        permissions: ['read:telemetry', 'manage:devices'],
      },
      {
        id: 'remote-canbus-obd2',
        name: 'CAN-Bus / J1939 Vehicle Telematics',
        version: '1.0.4',
        description: 'Heavy machinery and fleet telemetry decoder for CAN 2.0B / SAE J1939 protocols with engine RPM and fuel rate gauges.',
        author: 'FleetMotion Systems',
        category: 'protocol',
        tags: ['canbus', 'j1939', 'telematics', 'obd2'],
        repository: 'https://github.com/universal-iot-plugins/plugin-canbus-j1939',
        icon: 'Van',
        permissions: ['read:telemetry', 'control:devices'],
      },
      {
        id: 'remote-energy-billing',
        name: 'Sub-metering Energy & Carbon Auditor',
        version: '1.5.0',
        description: 'Multi-tariff kWh power consumption calculation, peak demand forecasting, and carbon footprint ESG reporting.',
        author: 'CleanEnergy Analytics',
        category: 'analytics',
        tags: ['energy', 'modbus-meter', 'billing', 'carbon'],
        repository: 'https://github.com/universal-iot-plugins/plugin-energy-auditor',
        icon: 'PieChart',
        permissions: ['read:telemetry'],
      },
    ];
  }
}

export const dynamicPluginLoader = DynamicPluginLoaderService.getInstance();
