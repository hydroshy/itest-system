"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTROL_PANEL_HTML = void 0;
exports.buildControlPanelHtml = buildControlPanelHtml;
const path = require("path");
const template_engine_1 = require("./template-engine");
function buildControlPanelHtml() {
    const css = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'css', 'control-panel.css'));
    const header = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'header.html'));
    const sidebar = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'sidebar.html'));
    const banner = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'degraded-banner.html'));
    const toasts = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'toasts.html'));
    const clientScript = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'client.js'));
    const overviewTab = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'tabs', 'overview.html'));
    const governanceTab = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'tabs', 'governance.html'));
    const pluginsManagementTab = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'tabs', 'plugins-management.html'));
    const overviewModals = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'modals', 'overview.modal.html'));
    const governanceModals = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'modals', 'governance.modal.html'));
    const pluginsManagementModals = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'modals', 'plugins-management.modal.html'));
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