"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTROL_PANEL_HTML = void 0;
exports.buildControlPanelHtml = buildControlPanelHtml;
const path = require("path");
const template_engine_1 = require("./template-engine");
const overview_module_1 = require("./control-panel-modules/overview.module");
const system_modules_module_1 = require("./control-panel-modules/system-modules.module");
const plugins_management_module_1 = require("./control-panel-modules/plugins-management.module");
function buildControlPanelHtml() {
    const css = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'css', 'control-panel.css'));
    const header = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'header.html'));
    const sidebar = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'sidebar.html'));
    const banner = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'degraded-banner.html'));
    const toasts = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'toasts.html'));
    const clientScript = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'client.js'));
    const content = `
        <!-- TAB 1: OVERVIEW & DATABASE -->
        <c-module-boundary module-id="overview" title="Overview Hub" icon="fa-solid fa-chart-pie" :active="activeTab === 'overview' || activeTab === 'database'">
          <div v-if="activeTab === 'overview' || activeTab === 'database'">
            ${overview_module_1.OVERVIEW_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 2: SYSTEM MODULES, ROLES, USERS -->
        <c-module-boundary module-id="modules" title="Dashboard Modules & Governance" icon="fa-solid fa-cubes" :active="activeTab === 'modules' || activeTab === 'roles' || activeTab === 'users'">
          <div v-if="activeTab === 'modules' || activeTab === 'roles' || activeTab === 'users'">
            ${system_modules_module_1.SYSTEM_MODULES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 3: PLUGINS MANAGEMENT & DYNAMIC PLUGIN VIEW HOST -->
        <c-module-boundary module-id="plugins-management" title="Plugins Management" icon="fa-solid fa-puzzle-piece" :active="activeTab === 'plugins-management' || activeTab.startsWith('plugin-')">
          <div v-if="activeTab === 'plugins-management' || activeTab.startsWith('plugin-')">
            ${plugins_management_module_1.PLUGINS_MANAGEMENT_TEMPLATE}
          </div>
        </c-module-boundary>
  `;
    const modals = `
    ${overview_module_1.OVERVIEW_MODALS}
    ${system_modules_module_1.SYSTEM_MODULES_MODALS}
    ${plugins_management_module_1.PLUGINS_MANAGEMENT_MODALS}
  `;
    return template_engine_1.TemplateEngine.compose(path.join(__dirname, 'templates', 'control-panel', 'layout.html'), {
        css,
        header,
        sidebar,
        banner,
        content,
        modals,
        toasts,
        scripts: clientScript,
    });
}
exports.CONTROL_PANEL_HTML = buildControlPanelHtml();
//# sourceMappingURL=control-panel.view.js.map