"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTROL_PANEL_HTML = void 0;
exports.buildControlPanelHtml = buildControlPanelHtml;
const path = require("path");
const template_engine_1 = require("./template-engine");
const overview_module_1 = require("./control-panel-modules/overview.module");
const network_servers_module_1 = require("./control-panel-modules/network-servers.module");
const system_modules_module_1 = require("./control-panel-modules/system-modules.module");
const devices_module_1 = require("./control-panel-modules/devices.module");
const webhooks_module_1 = require("./control-panel-modules/webhooks.module");
const decoder_module_1 = require("./control-panel-modules/decoder.module");
const hmi_studio_module_1 = require("./control-panel-modules/hmi-studio.module");
const downlink_module_1 = require("./control-panel-modules/downlink.module");
const modbus_presets_module_1 = require("./control-panel-modules/modbus-presets.module");
const test_builder_module_1 = require("./control-panel-modules/test-builder.module");
const item_codes_module_1 = require("./control-panel-modules/item-codes.module");
const sales_orders_module_1 = require("./control-panel-modules/sales-orders.module");
const sensor_types_module_1 = require("./control-panel-modules/sensor-types.module");
const traceability_module_1 = require("./control-panel-modules/traceability.module");
const memmap_upload_module_1 = require("./control-panel-modules/memmap-upload.module");
const memmap_manager_module_1 = require("./control-panel-modules/memmap-manager.module");
const final_config_manager_module_1 = require("./control-panel-modules/final-config-manager.module");
const create_final_config_module_1 = require("./control-panel-modules/create-final-config.module");
const device_tested_module_1 = require("./control-panel-modules/device-tested.module");
const plugins_management_module_1 = require("./control-panel-modules/plugins-management.module");
function buildControlPanelHtml() {
    const css = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'css', 'control-panel.css'));
    const header = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'header.html'));
    const sidebar = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'sidebar.html'));
    const banner = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'degraded-banner.html'));
    const toasts = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'toasts.html'));
    const modalsBase = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'modals.html'));
    const clientScript = template_engine_1.TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'client.js'));
    const content = `
        <!-- TAB 1: OVERVIEW & DATABASE -->
        <c-module-boundary module-id="overview" title="Overview Hub" icon="fa-solid fa-chart-pie" :active="activeTab === 'overview' || activeTab === 'database'">
          <div v-if="activeTab === 'overview' || activeTab === 'database'">
            ${overview_module_1.OVERVIEW_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 2: NETWORK SERVERS -->
        <c-module-boundary module-id="network-servers" title="Network Servers" icon="fa-solid fa-tower-broadcast" :active="activeTab === 'network-servers'">
          <div v-if="activeTab === 'network-servers'">
            ${network_servers_module_1.NETWORK_SERVERS_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 3: SYSTEM MODULES, ROLES, USERS -->
        <c-module-boundary module-id="modules" title="Dashboard Modules & Governance" icon="fa-solid fa-cubes" :active="activeTab === 'modules' || activeTab === 'roles' || activeTab === 'users'">
          <div v-if="activeTab === 'modules' || activeTab === 'roles' || activeTab === 'users'">
            ${system_modules_module_1.SYSTEM_MODULES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 7: DEVICES -->
        <c-module-boundary module-id="devices" title="Device Fleet" icon="fa-solid fa-microchip" :active="activeTab === 'devices'">
          <div v-if="activeTab === 'devices'">
            ${devices_module_1.DEVICES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 8: WEBHOOKS -->
        <c-module-boundary module-id="webhooks" title="Webhook Manager" icon="fa-solid fa-satellite-dish" :active="activeTab === 'webhooks'">
          <div v-if="activeTab === 'webhooks'">
            ${webhooks_module_1.WEBHOOKS_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 9: DECODER CONFIG -->
        <c-module-boundary module-id="decoder" title="Payload Decoders" icon="fa-solid fa-code" :active="activeTab === 'decoder'">
          <div v-if="activeTab === 'decoder'">
            ${decoder_module_1.DECODER_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 10: HMI STUDIO -->
        <c-module-boundary module-id="hmi-studio" title="HMI Studio" icon="fa-solid fa-desktop" :active="activeTab === 'hmi-studio'">
          <div v-if="activeTab === 'hmi-studio'">
            ${hmi_studio_module_1.HMI_STUDIO_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 11: DOWNLINK QUEUE -->
        <c-module-boundary module-id="downlink" title="Downlink Queue Manager" icon="fa-solid fa-paper-plane" :active="activeTab === 'downlink'">
          <div v-if="activeTab === 'downlink'">
            ${downlink_module_1.DOWNLINK_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 12: MODBUS PRESETS -->
        <c-module-boundary module-id="modbus-presets" title="Modbus Register Presets" icon="fa-solid fa-sliders" :active="activeTab === 'modbus-presets'">
          <div v-if="activeTab === 'modbus-presets'" class="space-y-6">
            ${modbus_presets_module_1.MODBUS_PRESETS_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 13: TEST BUILDER -->
        <c-module-boundary module-id="test-builder" title="Interactive Test Builder" icon="fa-solid fa-vial-circle-check" :active="activeTab === 'test-builder'">
          <div v-if="activeTab === 'test-builder'" class="space-y-6">
            ${test_builder_module_1.TEST_BUILDER_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 14: ITEM CODES -->
        <c-module-boundary module-id="item-codes" title="Item Codes Catalog" icon="fa-solid fa-barcode" :active="activeTab === 'item-codes'">
          <div v-if="activeTab === 'item-codes'" class="space-y-6">
            ${item_codes_module_1.ITEM_CODES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 15: SALES ORDERS & ITEM CODES -->
        <c-module-boundary module-id="sales-orders" title="Sales Orders" icon="fa-solid fa-file-invoice-dollar" :active="activeTab === 'sales-orders'">
          <div v-if="activeTab === 'sales-orders'" class="space-y-6">
            ${sales_orders_module_1.SALES_ORDERS_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 16: LORAWAN SENSOR TYPES -->
        <c-module-boundary module-id="sensor-types" title="LoRaWAN Sensor Types" icon="fa-solid fa-microchip" :active="activeTab === 'sensor-types'">
          <div v-if="activeTab === 'sensor-types'" class="space-y-6">
            ${sensor_types_module_1.SENSOR_TYPES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 17: TRACEABILITY (T-MODULE) -->
        <c-module-boundary module-id="traceability" title="Traceability (T-Module)" icon="fa-solid fa-clipboard-check" :active="activeTab === 'traceability'">
          <div v-if="activeTab === 'traceability'" class="space-y-6">
            ${traceability_module_1.TRACEABILITY_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 18: MEMORY MAP UPLOAD -->
        <c-module-boundary module-id="memmap-upload" title="Memory Map Upload" icon="fa-solid fa-file-csv" :active="activeTab === 'memmap-upload'">
          <div v-if="activeTab === 'memmap-upload'" class="space-y-6">
            ${memmap_upload_module_1.MEMMAP_UPLOAD_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB: MEMORY MAP MANAGER -->
        <c-module-boundary module-id="memmap-manager" title="Memory Map Manager" icon="fa-solid fa-map-location-dot" :active="activeTab === 'memmap-manager'">
          <div v-if="activeTab === 'memmap-manager'" class="space-y-6">
            ${memmap_manager_module_1.MEMMAP_MANAGER_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 19: FINAL CONFIG (DEVICE CONFIG CREATOR) -->
        <c-module-boundary module-id="create-final-config" title="Device Config Creator" icon="fa-solid fa-file-circle-plus" :active="activeTab === 'create-final-config'">
          <div v-if="activeTab === 'create-final-config'" class="space-y-6">
            ${create_final_config_module_1.CREATE_FINAL_CONFIG_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB: FINAL CONFIG MANAGER -->
        <c-module-boundary module-id="final-config-manager" title="Final Config Manager" icon="fa-solid fa-file-shield" :active="activeTab === 'final-config-manager'">
          <div v-if="activeTab === 'final-config-manager'" class="space-y-6">
            ${final_config_manager_module_1.FINAL_CONFIG_MANAGER_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 20: TESTED DEVICES LOG -->
        <c-module-boundary module-id="device-tested" title="Tested Devices Log" icon="fa-solid fa-list-check" :active="activeTab === 'device-tested'">
          <div v-if="activeTab === 'device-tested'" class="space-y-6">
            ${device_tested_module_1.DEVICE_TESTED_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 21: PLUGINS MANAGEMENT -->
        <c-module-boundary module-id="plugins-management" title="Plugins Management" icon="fa-solid fa-puzzle-piece" :active="activeTab === 'plugins-management'">
          <div v-if="activeTab === 'plugins-management'">
            ${plugins_management_module_1.PLUGINS_MANAGEMENT_TEMPLATE}
          </div>
        </c-module-boundary>
  `;
    const modals = `
    ${modalsBase}
    ${overview_module_1.OVERVIEW_MODALS}
    ${network_servers_module_1.NETWORK_SERVERS_MODALS}
    ${system_modules_module_1.SYSTEM_MODULES_MODALS}
    ${devices_module_1.DEVICES_MODALS}
    ${webhooks_module_1.WEBHOOKS_MODALS}
    ${decoder_module_1.DECODER_MODALS}
    ${hmi_studio_module_1.HMI_STUDIO_MODALS}
    ${downlink_module_1.DOWNLINK_MODALS}
    ${modbus_presets_module_1.MODBUS_PRESETS_MODALS}
    ${test_builder_module_1.TEST_BUILDER_MODALS}
    ${item_codes_module_1.ITEM_CODES_MODALS}
    ${sales_orders_module_1.SALES_ORDERS_MODALS}
    ${sensor_types_module_1.SENSOR_TYPES_MODALS}
    ${traceability_module_1.TRACEABILITY_MODALS}
    ${memmap_upload_module_1.MEMMAP_UPLOAD_MODALS}
    ${memmap_manager_module_1.MEMMAP_MANAGER_MODALS}
    ${final_config_manager_module_1.FINAL_CONFIG_MANAGER_MODALS}
    ${create_final_config_module_1.CREATE_FINAL_CONFIG_MODALS}
    ${device_tested_module_1.DEVICE_TESTED_MODALS}
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