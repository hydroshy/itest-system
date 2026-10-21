import * as path from 'path';
import { TemplateEngine } from './template-engine';

// Triệt tiêu cảnh báo môi trường Node.js trên linter / IDE
declare const __dirname: string;

/**
 * Modular View Composer for Control Panel.
 * Uses TemplateEngine to assemble HTML, CSS, and component partials from disk or cache.
 * Implements Pure Micro-kernel architecture: 100% templates separated into .html files.
 * Core UI only contains foundational tabs and dynamic active plugin slots.
 */
export function buildControlPanelHtml(): string {
  const css = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'css', 'control-panel.css'));
  const header = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'header.html'));
  const sidebar = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'sidebar.html'));
  const banner = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'degraded-banner.html'));
  const toasts = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'toasts.html'));
  const clientScript = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'client.js'));

  // Load pure tab templates from disk/cache
  const overviewTab = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'tabs', 'overview.html'));
  const governanceTab = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'tabs', 'governance.html'));
  const pluginsManagementTab = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'tabs', 'plugins-management.html'));

  // Load pure modal templates from disk/cache
  const overviewModals = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'modals', 'overview.modal.html'));
  const governanceModals = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'modals', 'governance.modal.html'));
  const pluginsManagementModals = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'modals', 'plugins-management.modal.html'));

  // Core content boundaries: Overview, System Modules, and Plugins Management (with dynamic plugin slot)
  const content = `
        <!-- TAB 1: OVERVIEW & DATABASE -->
        <c-module-boundary module-id="overview" title="Overview Hub" icon="fa-solid fa-chart-pie" :active="activeTab === 'overview' || activeTab === 'database'">
          <div v-if="activeTab === 'overview' || activeTab === 'database'">
            ${overviewTab}
          </div>
        </c-module-boundary>

        <!-- TAB 2: ROLES & USERS -->
        <c-module-boundary module-id="governance" title="Roles & Users" icon="fa-solid fa-shield-halved" :active="activeTab === 'roles' || activeTab === 'users'">
          <div v-if="activeTab === 'roles' || activeTab === 'users'">
            ${governanceTab}
          </div>
        </c-module-boundary>

        <!-- TAB 3: PLUGINS MANAGEMENT & DYNAMIC PLUGIN VIEW HOST -->
        <c-module-boundary module-id="plugins-management" title="Plugins Management" icon="fa-solid fa-puzzle-piece" :active="activeTab === 'plugins-management' || activeTab.startsWith('plugin-')">
          <div v-if="activeTab === 'plugins-management' || activeTab.startsWith('plugin-')">
            ${pluginsManagementTab}
          </div>
        </c-module-boundary>
  `;

  const modals = `
    ${overviewModals}
    ${governanceModals}
    ${pluginsManagementModals}
  `;

  return TemplateEngine.compose(
    path.join(__dirname, 'templates', 'control-panel', 'layout.html'),
    {
      css,
      header,
      sidebar,
      banner,
      content,
      modals,
      toasts,
      scripts: clientScript,
    }
  );
}

export const CONTROL_PANEL_HTML = buildControlPanelHtml();
