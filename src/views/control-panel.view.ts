import * as path from 'path';
import { TemplateEngine } from './template-engine';
import { OVERVIEW_TEMPLATE, OVERVIEW_MODALS } from './control-panel-modules/overview.module';
import { SYSTEM_MODULES_TEMPLATE, SYSTEM_MODULES_MODALS } from './control-panel-modules/system-modules.module';
import {
  PLUGINS_MANAGEMENT_TEMPLATE,
  PLUGINS_MANAGEMENT_MODALS,
} from './control-panel-modules/plugins-management.module';

// Triệt tiêu cảnh báo sai về môi trường Node.js trên linter / IDE
declare const __dirname: string;

/**
 * Modular View Composer for Control Panel.
 * Uses TemplateEngine to assemble HTML, CSS, and component partials from disk or cache.
 * Implements Pure Micro-kernel architecture: core UI only contains 5 foundational tabs
 * and dynamic active plugin slots.
 */
export function buildControlPanelHtml(): string {
  const css = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'css', 'control-panel.css'));
  const header = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'header.html'));
  const sidebar = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'sidebar.html'));
  const banner = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'degraded-banner.html'));
  const toasts = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'toasts.html'));
  const clientScript = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'client.js'));

  // Core content boundaries: Overview, System Modules, and Plugins Management (with dynamic plugin slot)
  const content = `
        <!-- TAB 1: OVERVIEW & DATABASE -->
        <c-module-boundary module-id="overview" title="Overview Hub" icon="fa-solid fa-chart-pie" :active="activeTab === 'overview' || activeTab === 'database'">
          <div v-if="activeTab === 'overview' || activeTab === 'database'">
            ${OVERVIEW_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 2: SYSTEM MODULES, ROLES, USERS -->
        <c-module-boundary module-id="modules" title="Dashboard Modules & Governance" icon="fa-solid fa-cubes" :active="activeTab === 'modules' || activeTab === 'roles' || activeTab === 'users'">
          <div v-if="activeTab === 'modules' || activeTab === 'roles' || activeTab === 'users'">
            ${SYSTEM_MODULES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 3: PLUGINS MANAGEMENT & DYNAMIC PLUGIN VIEW HOST -->
        <c-module-boundary module-id="plugins-management" title="Plugins Management" icon="fa-solid fa-puzzle-piece" :active="activeTab === 'plugins-management' || activeTab.startsWith('plugin-')">
          <div v-if="activeTab === 'plugins-management' || activeTab.startsWith('plugin-')">
            ${PLUGINS_MANAGEMENT_TEMPLATE}
          </div>
        </c-module-boundary>
  `;

  const modals = `
    ${OVERVIEW_MODALS}
    ${SYSTEM_MODULES_MODALS}
    ${PLUGINS_MANAGEMENT_MODALS}
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
