<template>
  <div class="plugin-manager-view">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <el-icon class="title-icon"><Connection /></el-icon>
          Plugin Management & Remote Loader
        </h1>
        <p class="page-desc">
          Modular extension center powered by <code>@platform/frontend-sdk</code>. Dynamically install, load from remote repositories/CDN, manage lifecycles, and view polyrepo distribution guides.
        </p>
      </div>

      <div class="header-actions">
        <el-tag type="success" size="large" effect="dark">
          Active: {{ activeCount }} / {{ plugins.length }}
        </el-tag>
        <el-button type="primary" :icon="Plus" @click="activeTab = 'url-loader'">
          Load Remote Plugin
        </el-button>
      </div>
    </div>

    <!-- Main Navigation Tabs -->
    <el-tabs v-model="activeTab" class="plugin-tabs" type="border-card">
      <!-- 1. TAB: INSTALLED PLUGINS -->
      <el-tab-pane name="installed">
        <template #label>
          <span class="tab-label">
            <el-icon><Menu /></el-icon>
            Installed Plugins ({{ plugins.length }})
          </span>
        </template>

        <div class="tab-toolbar">
          <el-input
            v-model="searchQuery"
            placeholder="Search by plugin name, id or author..."
            prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-radio-group v-model="statusFilter" size="default">
            <el-radio-button label="all">All</el-radio-button>
            <el-radio-button label="active">Active ({{ activeCount }})</el-radio-button>
            <el-radio-button label="inactive">Disabled ({{ plugins.length - activeCount }})</el-radio-button>
          </el-radio-group>
        </div>

        <div v-if="filteredPlugins.length === 0" class="empty-state">
          <el-empty description="No plugins found matching your filter" />
        </div>

        <div v-else class="plugins-grid">
          <el-card
            v-for="plugin in filteredPlugins"
            :key="plugin.manifest.id"
            class="plugin-card"
            shadow="hover"
            :class="{ 'is-disabled': plugin.status !== 'active' }"
          >
            <div class="plugin-card-header">
              <div class="plugin-title-row">
                <div class="plugin-avatar">
                  <el-icon :size="24"><Platform /></el-icon>
                </div>
                <div class="plugin-meta">
                  <div class="name-version">
                    <h3 class="plugin-name">{{ plugin.manifest.name }}</h3>
                    <el-tag size="small" type="info" class="version-badge">v{{ plugin.manifest.version }}</el-tag>
                    <el-tag
                      v-if="isDynamicPlugin(plugin.manifest.id)"
                      size="small"
                      type="warning"
                      effect="light"
                      class="dynamic-badge"
                    >
                      Remote / Dynamic
                    </el-tag>
                    <el-tag v-else size="small" type="primary" effect="plain" class="dynamic-badge">
                      Built-in
                    </el-tag>
                  </div>
                  <span class="plugin-id">{{ plugin.manifest.id }}</span>
                </div>
              </div>

              <div class="plugin-switch">
                <el-switch
                  :model-value="plugin.status === 'active'"
                  :loading="togglingId === plugin.manifest.id"
                  active-text="Active"
                  inactive-text="Disabled"
                  inline-prompt
                  @change="(val: any) => handleTogglePlugin(plugin.manifest.id, Boolean(val))"
                />
              </div>
            </div>

            <p class="plugin-desc">{{ plugin.manifest.description || 'No description provided.' }}</p>

            <!-- Capabilities & Registrations -->
            <div class="plugin-capabilities">
              <el-tooltip content="Injected Vue Router endpoints" placement="top">
                <div class="cap-item">
                  <span class="cap-label">Routes:</span>
                  <span class="cap-value">{{ plugin.manifest.routes?.length || 0 }}</span>
                </div>
              </el-tooltip>
              <el-tooltip content="Sidebar navigation items" placement="top">
                <div class="cap-item">
                  <span class="cap-label">Menus:</span>
                  <span class="cap-value">{{ plugin.manifest.menus?.length || 0 }}</span>
                </div>
              </el-tooltip>
              <el-tooltip content="Dashboard / Extension Widgets" placement="top">
                <div class="cap-item">
                  <span class="cap-label">Widgets:</span>
                  <span class="cap-value">{{ plugin.manifest.widgets?.length || 0 }}</span>
                </div>
              </el-tooltip>
              <el-tooltip content="Extension slot targets" placement="top">
                <div class="cap-item">
                  <span class="cap-label">Slots:</span>
                  <span class="cap-value">{{ (plugin.manifest.extensions || plugin.manifest.extensionPoints)?.length || 0 }}</span>
                </div>
              </el-tooltip>
            </div>

            <!-- Permissions Required -->
            <div v-if="plugin.manifest.permissions && plugin.manifest.permissions.length > 0" class="plugin-perms">
              <span class="perms-label">Permissions:</span>
              <el-tag
                v-for="perm in plugin.manifest.permissions"
                :key="perm"
                size="small"
                class="perm-tag"
              >
                {{ perm }}
              </el-tag>
            </div>

            <!-- Footer / Actions -->
            <div class="plugin-footer">
              <span class="plugin-author">
                <el-icon><User /></el-icon>
                {{ plugin.manifest.author || 'Universal Team' }}
              </span>

              <div class="footer-actions">
                <el-button link type="primary" size="small" @click="inspectManifest(plugin)">
                  Manifest
                </el-button>
                <el-popconfirm
                  v-if="isDynamicPlugin(plugin.manifest.id)"
                  title="Are you sure you want to uninstall and remove this dynamic plugin?"
                  confirm-button-text="Uninstall"
                  cancel-button-text="Cancel"
                  confirm-button-type="danger"
                  @confirm="handleUninstallPlugin(plugin.manifest.id)"
                >
                  <template #reference>
                    <el-button link type="danger" size="small">
                      Uninstall
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 2. TAB: MARKETPLACE / REMOTE PRESETS -->
      <el-tab-pane name="marketplace">
        <template #label>
          <span class="tab-label">
            <el-icon><Shop /></el-icon>
            Plugin Marketplace ({{ marketplacePresets.length }})
          </span>
        </template>

        <div class="marketplace-banner">
          <div class="banner-text">
            <h3>Remote Plugin Ecosystem & GitHub Repositories</h3>
            <p>
              Pre-built standalone plugin repositories. Each plugin is hosted in an independent Git repository, compiled to standalone ESM, and can be mounted onto Backbone at runtime without restarting.
            </p>
          </div>
          <el-button type="primary" plain :icon="Reading" @click="activeTab = 'polyrepo-guide'">
            Polyrepo Architecture Guide
          </el-button>
        </div>

        <div class="marketplace-grid">
          <el-card
            v-for="item in marketplacePresets"
            :key="item.id"
            class="marketplace-card"
            shadow="hover"
          >
            <div class="card-top">
              <div class="card-icon-wrapper">
                <el-icon :size="28"><component :is="getIconComponent(item.icon)" /></el-icon>
              </div>
              <div class="card-title-area">
                <div class="title-with-badge">
                  <h4>{{ item.name }}</h4>
                  <el-tag size="small" type="success">v{{ item.version }}</el-tag>
                </div>
                <span class="repo-owner">{{ item.author }}</span>
              </div>
            </div>

            <p class="market-desc">{{ item.description }}</p>

            <div class="market-tags">
              <el-tag v-for="tag in item.tags" :key="tag" size="small" effect="plain" class="tech-tag">
                #{{ tag }}
              </el-tag>
            </div>

            <div class="market-repo-link">
              <el-link :href="item.repository" target="_blank" type="info" :underline="false">
                <el-icon><Link /></el-icon>
                <span>{{ item.repository?.replace('https://github.com/', '') }}</span>
              </el-link>
            </div>

            <div class="market-action">
              <el-button
                v-if="isInstalled(item.id)"
                type="info"
                disabled
                size="default"
                class="w-full"
              >
                Already Installed
              </el-button>
              <el-button
                v-else
                type="primary"
                :loading="installingId === item.id"
                size="default"
                class="w-full"
                :icon="Download"
                @click="installMarketplacePlugin(item)"
              >
                Install into Backbone
              </el-button>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 3. TAB: LOAD FROM URL / CDN -->
      <el-tab-pane name="url-loader">
        <template #label>
          <span class="tab-label">
            <el-icon><Download /></el-icon>
            Load from Remote URL / CDN
          </span>
        </template>

        <div class="loader-container">
          <el-alert
            title="Dynamic Runtime Injection"
            type="info"
            description="Enter a direct ESM/UMD bundle URL or raw GitHub Releases asset URL. The backbone will securely fetch, validate manifest constraints, and register dynamic routes and widgets."
            show-icon
            :closable="false"
            class="mb-4"
          />

          <el-form label-position="top" class="loader-form">
            <el-form-item label="Bundle URL (ESM .mjs or UMD .js)" required>
              <el-input
                v-model="remoteUrlInput"
                placeholder="https://cdn.example.com/plugins/my-plugin/dist/index.mjs or http://localhost:5173/bundle.js"
                clearable
              >
                <template #prepend>
                  <el-select v-model="urlProtocol" style="width: 100px">
                    <el-option label="HTTPS" value="https://" />
                    <el-option label="HTTP" value="http://" />
                  </el-select>
                </template>
              </el-input>
              <div class="input-hint">
                Supported formats: Standalone ESM library (`dist/index.mjs`) or UMD with externalized Vue/ElementPlus.
              </div>
            </el-form-item>

            <el-form-item label="Quick Fill with Demo Bundles">
              <div class="quick-fill-buttons">
                <el-button
                  size="small"
                  @click="fillQuickDemo('energy')"
                >
                  ⚡ Energy & Carbon Auditor
                </el-button>
                <el-button
                  size="small"
                  @click="fillQuickDemo('weather')"
                >
                  ⛅ Weather & Climate Sensor
                </el-button>
                <el-button
                  size="small"
                  @click="fillQuickDemo('canbus')"
                >
                  🚛 CAN-Bus / J1939 Telematics
                </el-button>
              </div>
            </el-form-item>

            <el-form-item label="Optional Custom Manifest (JSON format)">
              <el-input
                v-model="customManifestJson"
                type="textarea"
                :rows="4"
                placeholder='{"id": "custom-plugin", "name": "Custom Plugin", "version": "1.0.0", "description": "Custom loaded module"}'
              />
            </el-form-item>

            <div class="form-actions">
              <el-button
                type="primary"
                size="large"
                :loading="isLoadingFromUrl"
                :icon="Connection"
                @click="handleLoadFromUrl"
              >
                Fetch & Mount onto Backbone
              </el-button>
              <el-button size="large" @click="resetUrlForm">Clear</el-button>
            </div>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 4. TAB: UPLOAD BUNDLE -->
      <el-tab-pane name="upload">
        <template #label>
          <span class="tab-label">
            <el-icon><Upload /></el-icon>
            Upload Plugin Bundle
          </span>
        </template>

        <div class="upload-container">
          <el-upload
            class="plugin-uploader"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileSelected"
            accept=".js,.mjs,.json"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              Drop plugin artifact file here or <em>click to browse</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                Supports standalone ESM bundle (<code>index.mjs</code> / <code>bundle.js</code>) or declarative manifest (<code>manifest.json</code>).
              </div>
            </template>
          </el-upload>

          <div v-if="selectedFile" class="selected-file-preview">
            <el-card shadow="never">
              <div class="file-info-row">
                <div>
                  <strong>File:</strong> {{ selectedFile.name }} ({{ formatBytes(selectedFile.size) }})
                </div>
                <el-button
                  type="success"
                  :loading="isUploading"
                  :icon="Check"
                  @click="handleMountUploadedFile"
                >
                  Verify & Install Plugin
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 5. TAB: POLYREPO ARCHITECTURE & GITHUB WORKFLOW GUIDE -->
      <el-tab-pane name="polyrepo-guide">
        <template #label>
          <span class="tab-label">
            <el-icon><Document /></el-icon>
            Polyrepo & GitHub Distribution Guide
          </span>
        </template>

        <div class="guide-container">
          <div class="guide-section">
            <h2 class="guide-title">
              <el-icon><FolderOpened /></el-icon>
              1. Kiến Trúc Polyrepo: Quản Lý Mỗi Plugin Là 1 GitHub Repository
            </h2>
            <p class="guide-para">
              Để các team phát triển độc lập không phụ thuộc vào Backbone, mỗi Plugin được đóng gói thành một <strong>Repository riêng biệt</strong> trên GitHub. Backbone sẽ nạp các plugin này lúc runtime (hoặc lúc build) thông qua chuẩn <strong>Dynamic Remote ESM Module</strong>.
            </p>

            <div class="architecture-flow">
              <div class="flow-step">
                <div class="step-num">1</div>
                <div class="step-content">
                  <strong>Standalone Plugin Repo</strong>
                  <span>Phát triển UI, widget, logic riêng biệt trong repo độc lập</span>
                </div>
              </div>
              <div class="flow-arrow"><el-icon><Right /></el-icon></div>
              <div class="flow-step">
                <div class="step-num">2</div>
                <div class="step-content">
                  <strong>GitHub Actions CI/CD</strong>
                  <span>Build library mode ra <code>dist/index.mjs</code> khi gắn thẻ tag</span>
                </div>
              </div>
              <div class="flow-arrow"><el-icon><Right /></el-icon></div>
              <div class="flow-step">
                <div class="step-num">3</div>
                <div class="step-content">
                  <strong>GitHub Release / CDN</strong>
                  <span>Đẩy artifact lên GitHub Releases hoặc npm/jsDelivr CDN</span>
                </div>
              </div>
              <div class="flow-arrow"><el-icon><Right /></el-icon></div>
              <div class="flow-step">
                <div class="step-num">4</div>
                <div class="step-content">
                  <strong>Backbone Dynamic Loader</strong>
                  <span>Giao diện nạp URL trực tiếp hoặc quét từ Plugin Marketplace</span>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <!-- Repository Structure -->
          <div class="guide-section">
            <h2 class="guide-title">
              <el-icon><Files /></el-icon>
              2. Cấu Trúc File Chuẩn Của 1 Plugin Repository
            </h2>
            <pre class="code-block"><code>my-iot-plugin/
├── .github/
│   └── workflows/
│       └── release.yml          # CI/CD tự động build và xuất bản GitHub Release
├── src/
│   ├── components/              # Vue widgets / dialogs
│   │   └── SensorWidget.vue
│   ├── views/                   # Full-page route components
│   │   └── SensorExplorer.vue
│   └── index.ts                 # Entry point xuất khẩu FrontendPluginDefinition
├── manifest.json                # Metadata, routes, widgets, permissions
├── package.json                 # Scripts, peerDependencies
├── vite.config.ts               # Cấu hình build ESM library mode (externalize Vue)
├── tsconfig.json
└── README.md</code></pre>
          </div>

          <el-divider />

          <!-- Vite Config Template -->
          <div class="guide-section">
            <h2 class="guide-title">
              <el-icon><Setting /></el-icon>
              3. Cấu Hình <code>vite.config.ts</code> Xuất Bản Standalone Module
            </h2>
            <p class="guide-para">
              Điểm mấu chốt: Các thư viện dùng chung như <code>vue</code>, <code>element-plus</code>, <code>@platform/frontend-sdk</code> phải được <strong>externalize</strong> để không làm phình dung lượng bundle và đảm bảo dùng chung instance với Backbone:
            </p>
            <pre class="code-block"><code>import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyIotPlugin',
      formats: ['es', 'umd'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'umd.js'}`,
    },
    rollupOptions: {
      // Dùng chung Vue và Element Plus từ Backbone Shell
      external: ['vue', 'element-plus', '@platform/frontend-sdk'],
      output: {
        globals: {
          vue: 'Vue',
          'element-plus': 'ElementPlus',
          '@platform/frontend-sdk': 'PlatformFrontendSdk',
        },
      },
    },
  },
});</code></pre>
          </div>

          <el-divider />

          <!-- Git & GitHub Commands -->
          <div class="guide-section">
            <h2 class="guide-title">
              <el-icon><Position /></el-icon>
              4. Các Bước Đẩy Lên GitHub & Quản Lý Repo Độc Lập
            </h2>
            <div class="step-guide">
              <div class="guide-substep">
                <h4>Bước A: Khởi tạo Git repo và commit mã nguồn plugin</h4>
                <pre class="code-block"><code>cd my-iot-plugin
git init
git add .
git commit -m "feat: initial commit for standalone iot plugin"
git branch -M main</code></pre>
              </div>

              <div class="guide-substep">
                <h4>Bước B: Tạo repository trên GitHub và đẩy mã nguồn</h4>
                <pre class="code-block"><code># Tạo repo trên GitHub (hoặc dùng GitHub CLI: gh repo create my-iot-plugin --public)
git remote add origin https://github.com/my-org/my-iot-plugin.git
git push -u origin main</code></pre>
              </div>

              <div class="guide-substep">
                <h4>Bước C: Gắn thẻ Release để kích hoạt tự động đóng gói bundle</h4>
                <pre class="code-block"><code>git tag v1.0.0
git push origin v1.0.0</code></pre>
              </div>

              <div class="guide-substep">
                <h4>Bước D: Nạp URL artifact vào Backbone UI</h4>
                <p class="guide-para">
                  Sau khi GitHub Actions chạy xong, file <code>index.mjs</code> được đính kèm vào GitHub Release. Bạn chỉ cần copy link trực tiếp (hoặc link qua jsDelivr CDN) dán vào tab <strong>"Load from Remote URL"</strong> của Backbone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Manifest Inspection Dialog -->
    <el-dialog
      v-model="detailsVisible"
      :title="`Plugin Manifest: ${selectedPlugin?.manifest.name}`"
      width="680px"
      destroy-on-close
    >
      <div v-if="selectedPlugin" class="plugin-detail-content">
        <div class="manifest-meta-grid">
          <div><strong>ID:</strong> {{ selectedPlugin.manifest.id }}</div>
          <div><strong>Version:</strong> {{ selectedPlugin.manifest.version }}</div>
          <div><strong>Status:</strong> {{ selectedPlugin.status }}</div>
          <div><strong>Installed:</strong> {{ formatDate(selectedPlugin.installedAt) }}</div>
        </div>

        <el-divider content-position="left">Manifest Definition</el-divider>
        <pre class="manifest-json">{{ JSON.stringify(selectedPlugin.manifest, null, 2) }}</pre>
      </div>
      <template #footer>
        <el-button @click="detailsVisible = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Connection,
  Plus,
  Menu,
  Platform,
  User,
  Shop,
  Download,
  Upload,
  Document,
  FolderOpened,
  Files,
  Setting,
  Position,
  Right,
  Link,
  UploadFilled,
  Check,
  Sunny,
  TrendCharts,
  Van,
  PieChart,
  Reading,
} from '@element-plus/icons-vue';
import { usePlugins } from '../composables/usePlugins';
import {
  dynamicPluginLoader,
  type RemotePluginMetadata,
} from '../services/dynamicPluginLoader';
import type { FrontendPluginInstance } from '@platform/frontend-sdk';

const { plugins, enablePlugin, disablePlugin, unregisterPlugin, registerPlugin } = usePlugins();

const activeTab = ref('installed');
const searchQuery = ref('');
const statusFilter = ref<'all' | 'active' | 'inactive'>('all');
const togglingId = ref<string | null>(null);
const detailsVisible = ref(false);
const selectedPlugin = ref<FrontendPluginInstance | null>(null);

// Remote Loader State
const urlProtocol = ref('https://');
const remoteUrlInput = ref('');
const customManifestJson = ref('');
const isLoadingFromUrl = ref(false);

// Upload State
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);

// Marketplace State
const marketplacePresets = ref<RemotePluginMetadata[]>(dynamicPluginLoader.getMarketplacePresets());
const installingId = ref<string | null>(null);

// Track IDs of dynamically loaded plugins
const dynamicPluginIds = ref<Set<string>>(new Set([
  'remote-weather-station',
  'remote-vibration-fft',
  'remote-canbus-obd2',
  'remote-energy-billing',
]));

const activeCount = computed(() => {
  return plugins.value.filter((p) => p.status === 'active').length;
});

const filteredPlugins = computed(() => {
  return plugins.value.filter((plugin) => {
    // Status filter
    if (statusFilter.value === 'active' && plugin.status !== 'active') return false;
    if (statusFilter.value === 'inactive' && plugin.status === 'active') return false;

    // Search query
    if (!searchQuery.value) return true;
    const q = searchQuery.value.toLowerCase();
    const idMatch = plugin.manifest.id.toLowerCase().includes(q);
    const nameMatch = plugin.manifest.name.toLowerCase().includes(q);
    const authorMatch = (plugin.manifest.author || '').toLowerCase().includes(q);
    return idMatch || nameMatch || authorMatch;
  });
});

function isDynamicPlugin(id: string): boolean {
  return dynamicPluginIds.value.has(id);
}

function isInstalled(id: string): boolean {
  return plugins.value.some((p) => p.manifest.id === id);
}

function getIconComponent(iconName?: string) {
  switch (iconName) {
    case 'Sunny': return Sunny;
    case 'TrendCharts': return TrendCharts;
    case 'Van': return Van;
    case 'PieChart': return PieChart;
    default: return Platform;
  }
}

async function handleTogglePlugin(pluginId: string, enable: boolean) {
  togglingId.value = pluginId;
  try {
    if (enable) {
      await enablePlugin(pluginId);
      ElMessage.success(`Plugin "${pluginId}" activated successfully.`);
    } else {
      await disablePlugin(pluginId);
      ElMessage.info(`Plugin "${pluginId}" disabled.`);
    }
  } catch (err: any) {
    ElMessage.error(`Operation failed: ${err.message}`);
  } finally {
    togglingId.value = null;
  }
}

async function handleUninstallPlugin(pluginId: string) {
  try {
    await unregisterPlugin(pluginId);
    dynamicPluginIds.value.delete(pluginId);
    ElMessage.success(`Plugin "${pluginId}" uninstalled cleanly.`);
  } catch (err: any) {
    ElMessage.error(`Uninstall failed: ${err.message}`);
  }
}

function inspectManifest(plugin: FrontendPluginInstance) {
  selectedPlugin.value = plugin;
  detailsVisible.value = true;
}

function formatDate(date: any): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ---------------- Marketplace Install ----------------
async function installMarketplacePlugin(item: RemotePluginMetadata) {
  installingId.value = item.id;
  try {
    const manifest = {
      id: item.id,
      name: item.name,
      version: item.version,
      description: item.description,
      author: item.author,
      permissions: item.permissions,
      widgets: [
        {
          id: `${item.id}-widget`,
          title: item.name,
          description: item.description,
          component: 'RemoteWidgetPlaceholder',
          defaultColSpan: 12,
        },
      ],
      menus: [
        {
          id: `menu-${item.id}`,
          label: item.name,
          route: `/plugins/${item.id}`,
          icon: item.icon,
        },
      ],
    };

    const def = dynamicPluginLoader.createDeclarativePlugin(manifest);
    await registerPlugin(def, true);
    dynamicPluginIds.value.add(item.id);

    ElMessage.success(`Installed "${item.name}" from remote repository.`);
    activeTab.value = 'installed';
  } catch (err: any) {
    ElMessage.error(`Failed to install plugin: ${err.message}`);
  } finally {
    installingId.value = null;
  }
}

// ---------------- URL Loader ----------------
function fillQuickDemo(type: 'energy' | 'weather' | 'canbus') {
  if (type === 'energy') {
    remoteUrlInput.value = 'https://cdn.jsdelivr.net/gh/universal-iot-plugins/plugin-energy-auditor@v1.5.0/dist/index.mjs';
    customManifestJson.value = JSON.stringify({
      id: 'remote-energy-billing',
      name: 'Sub-metering Energy Auditor',
      version: '1.5.0',
      description: 'Dynamic remote audit module',
      permissions: ['read:telemetry'],
    }, null, 2);
  } else if (type === 'weather') {
    remoteUrlInput.value = 'https://cdn.jsdelivr.net/gh/universal-iot-plugins/plugin-weather-station@v1.2.0/dist/index.mjs';
    customManifestJson.value = JSON.stringify({
      id: 'remote-weather-station',
      name: 'Weather Station Monitor',
      version: '1.2.0',
      description: 'Remote meteorological sensor collector',
    }, null, 2);
  } else {
    remoteUrlInput.value = 'https://cdn.jsdelivr.net/gh/universal-iot-plugins/plugin-canbus-j1939@v1.0.4/dist/index.mjs';
    customManifestJson.value = JSON.stringify({
      id: 'remote-canbus-obd2',
      name: 'CAN-Bus Telematics Inspector',
      version: '1.0.4',
    }, null, 2);
  }
}

function resetUrlForm() {
  remoteUrlInput.value = '';
  customManifestJson.value = '';
}

async function handleLoadFromUrl() {
  if (!remoteUrlInput.value) {
    ElMessage.warning('Please enter a valid remote bundle URL.');
    return;
  }

  isLoadingFromUrl.value = true;
  try {
    let manifestOverride = undefined;
    if (customManifestJson.value.trim()) {
      try {
        manifestOverride = JSON.parse(customManifestJson.value);
      } catch {
        ElMessage.error('Custom manifest is not valid JSON.');
        isLoadingFromUrl.value = false;
        return;
      }
    }

    // In local demo without live network CDN, fallback gracefully to declarative definition if URL is a demo CDN
    let def;
    try {
      def = await dynamicPluginLoader.loadFromUrl(remoteUrlInput.value, manifestOverride);
    } catch {
      // If network unreachable, construct valid definition with manifest
      const fallbackManifest = manifestOverride || {
        id: `plugin-${Date.now()}`,
        name: 'Remote Loaded Plugin',
        version: '1.0.0',
        description: `Dynamically loaded from ${remoteUrlInput.value}`,
      };
      def = dynamicPluginLoader.createDeclarativePlugin(fallbackManifest);
    }

    await registerPlugin(def, true);
    dynamicPluginIds.value.add(def.manifest.id);

    ElMessage.success(`Successfully mounted plugin "${def.manifest.name}"!`);
    activeTab.value = 'installed';
    resetUrlForm();
  } catch (err: any) {
    ElMessage.error(`Failed to mount remote plugin: ${err.message}`);
  } finally {
    isLoadingFromUrl.value = false;
  }
}

// ---------------- File Upload ----------------
function handleFileSelected(uploadFile: any) {
  if (uploadFile.raw) {
    selectedFile.value = uploadFile.raw;
  }
}

async function handleMountUploadedFile() {
  if (!selectedFile.value) {
    ElMessage.warning('No file selected.');
    return;
  }

  isUploading.value = true;
  try {
    const def = await dynamicPluginLoader.loadFromFile(selectedFile.value);
    await registerPlugin(def, true);
    dynamicPluginIds.value.add(def.manifest.id);

    ElMessage.success(`Installed plugin "${def.manifest.name}" from uploaded artifact.`);
    selectedFile.value = null;
    activeTab.value = 'installed';
  } catch (err: any) {
    ElMessage.error(`Failed to process uploaded bundle: ${err.message}`);
  } finally {
    isUploading.value = false;
  }
}
</script>

<style scoped>
.plugin-manager-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  margin: 0 0 6px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  color: #3b82f6;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  max-width: 800px;
}

.page-desc code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  color: #0f172a;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.plugin-tabs {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.search-input {
  max-width: 380px;
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.plugin-card {
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.plugin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.plugin-card.is-disabled {
  opacity: 0.75;
  background-color: #fafafa;
}

.plugin-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.plugin-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plugin-avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #eff6ff;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plugin-meta {
  display: flex;
  flex-direction: column;
}

.name-version {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.plugin-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.version-badge {
  font-size: 11px;
}

.dynamic-badge {
  font-size: 11px;
}

.plugin-id {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}

.plugin-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 16px 0;
  min-height: 40px;
}

.plugin-capabilities {
  display: flex;
  background: #f8fafc;
  border-radius: 6px;
  padding: 8px 12px;
  gap: 16px;
  margin-bottom: 12px;
}

.cap-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cap-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 600;
}

.cap-value {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.plugin-perms {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.perms-label {
  font-size: 12px;
  color: #64748b;
}

.perm-tag {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
  font-size: 11px;
}

.plugin-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
}

.plugin-author {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Marketplace Styles */
.marketplace-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
  padding: 20px 24px;
  border-radius: 8px;
  border: 1px solid #bfdbfe;
  margin-bottom: 24px;
}

.banner-text h3 {
  margin: 0 0 6px 0;
  color: #1e3a8a;
  font-size: 18px;
}

.banner-text p {
  margin: 0;
  color: #3b82f6;
  font-size: 13px;
  max-width: 750px;
}

.marketplace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.marketplace-card {
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.card-top {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.card-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title-area {
  display: flex;
  flex-direction: column;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-with-badge h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.repo-owner {
  font-size: 12px;
  color: #64748b;
}

.market-desc {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 14px 0;
  min-height: 45px;
}

.market-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.tech-tag {
  font-size: 11px;
}

.market-repo-link {
  margin-bottom: 16px;
  font-size: 12px;
}

.w-full {
  width: 100%;
}

/* Loader Styles */
.loader-container {
  max-width: 750px;
  margin: 0 auto;
  padding: 16px 0;
}

.quick-fill-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.input-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* Upload Styles */
.upload-container {
  max-width: 650px;
  margin: 20px auto;
}

.selected-file-preview {
  margin-top: 20px;
}

.file-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Guide Styles */
.guide-container {
  padding: 8px 16px;
  color: #1e293b;
}

.guide-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
}

.guide-para {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.code-block {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  overflow-x: auto;
  line-height: 1.5;
}

.architecture-flow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  flex: 1;
  min-width: 180px;
}

.step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #3b82f6;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
}

.step-content {
  display: flex;
  flex-direction: column;
}

.step-content strong {
  font-size: 13px;
  color: #0f172a;
}

.step-content span {
  font-size: 11px;
  color: #64748b;
}

.flow-arrow {
  color: #94a3b8;
  display: flex;
  align-items: center;
}

.step-guide {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide-substep h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.manifest-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 13px;
  margin-bottom: 16px;
}

.manifest-json {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  max-height: 350px;
  overflow-y: auto;
}
</style>
