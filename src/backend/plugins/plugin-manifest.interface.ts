export type PluginType =
  | 'PROTOCOL'
  | 'TRANSPORT'
  | 'DATA_PROCESSING'
  | 'APPLICATION'
  | 'UI'
  | 'PROCESSOR'
  | 'HYBRID';

export type PluginStatus =
  | 'ACTIVE'
  | 'DISABLED'
  | 'ERROR'
  | 'UNINSTALLED'
  | 'QUARANTINED'
  | 'INSTALLED';

export type RemotePluginFormat = 'esm' | 'umd' | 'cjs';

export type UIExtensionSlot =
  | 'route'
  | 'nav-item'
  | 'dashboard-widget'
  | 'device-detail-tab'
  | 'settings-panel';

export interface RemoteUIExtension {
  slot: UIExtensionSlot;
  title: string;
  path?: string;
  icon?: string;
  order?: number;
  componentExport?: string;
  requiredPermissions?: string[];
  props?: Record<string, any>;
}

export interface UiRouteConfig {
  path: string;
  name?: string;
  component?: string;
  meta?: {
    title?: string;
    icon?: string;
    requiresAuth?: boolean;
    permissions?: string[];
    [key: string]: any;
  };
}

export interface UiMenuConfig {
  title: string;
  icon?: string;
  path: string;
  order?: number;
  badge?: string;
}

export interface UiWidgetConfig {
  id: string;
  title: string;
  component: string;
  defaultWidth?: number;
  defaultHeight?: number;
  category?: string;
}

export interface UiEntryConfig {
  esm?: string;
  css?: string;
  webComponent?: string;
  routes?: UiRouteConfig[];
  menus?: UiMenuConfig[];
  widgets?: UiWidgetConfig[];
}

export interface PluginSandboxPolicy {
  isolationLevel?: 'process' | 'worker_thread' | 'in_process_vm';
  maxMemoryMb?: number;
  cpuTimeoutMs?: number;
  allowedNetworkHosts?: string[];
  allowFilesystemAccess?: boolean;
}

export interface RemotePluginManifest {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  entry?: string;
  description?: string;
  author?: string;
  license?: string;
  remoteEntry?: string;
  format?: RemotePluginFormat;
  integrity?: string;
  repository?: {
    type: 'git';
    url: string;
    branch?: string;
    releaseTag?: string;
  };
  uiExtensions?: RemoteUIExtension[];
  uiEntry?: UiEntryConfig;
  backendEntry?: string | { module?: string; hooks?: string[] };
  capabilities?: string[];
  permissions?: string[];
  dependencies?: Record<string, string> | any[];
  sandboxPolicy?: PluginSandboxPolicy;
  configSchema?: Record<string, any>;
  defaultConfig?: Record<string, any>;
  keywords?: string[];
}

export interface InstallPluginUrlDto {
  url: string;
  type?: PluginType;
  autoEnable?: boolean;
  integrity?: string;
}

export interface RegisterPluginDto {
  manifest: RemotePluginManifest;
  bundleUrl?: string;
  autoEnable?: boolean;
}

export interface PluginFilterDto {
  type?: PluginType;
  status?: PluginStatus;
  search?: string;
}

export interface PluginLifecycleEvent {
  event: 'plugin:installed' | 'plugin:enabled' | 'plugin:disabled' | 'plugin:uninstalled' | 'plugin:updated';
  pluginId: string;
  version: string;
  status: PluginStatus;
  manifest?: RemotePluginManifest;
  timestamp: string;
}
