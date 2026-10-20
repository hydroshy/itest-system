import * as path from 'path';
import { TemplateEngine } from './template-engine';
import { OVERVIEW_TEMPLATE, OVERVIEW_MODALS } from './control-panel-modules/overview.module';
import { NETWORK_SERVERS_TEMPLATE, NETWORK_SERVERS_MODALS } from './control-panel-modules/network-servers.module';
import { SYSTEM_MODULES_TEMPLATE, SYSTEM_MODULES_MODALS } from './control-panel-modules/system-modules.module';
import { DEVICES_TEMPLATE, DEVICES_MODALS } from './control-panel-modules/devices.module';
import { WEBHOOKS_TEMPLATE, WEBHOOKS_MODALS } from './control-panel-modules/webhooks.module';
import { DECODER_TEMPLATE, DECODER_MODALS } from './control-panel-modules/decoder.module';
import { HMI_STUDIO_TEMPLATE, HMI_STUDIO_MODALS } from './control-panel-modules/hmi-studio.module';
import { DOWNLINK_TEMPLATE, DOWNLINK_MODALS } from './control-panel-modules/downlink.module';
import {
  MODBUS_PRESETS_TEMPLATE,
  MODBUS_PRESETS_MODALS,
  MODBUS_PRESETS_SCRIPT,
} from './control-panel-modules/modbus-presets.module';
import {
  TEST_BUILDER_TEMPLATE,
  TEST_BUILDER_MODALS,
  TEST_BUILDER_SCRIPT,
} from './control-panel-modules/test-builder.module';
import {
  ITEM_CODES_TEMPLATE,
  ITEM_CODES_MODALS,
  ITEM_CODES_SCRIPT,
} from './control-panel-modules/item-codes.module';
import {
  SALES_ORDERS_TEMPLATE,
  SALES_ORDERS_MODALS,
  SALES_ORDERS_SCRIPT,
} from './control-panel-modules/sales-orders.module';
import {
  SENSOR_TYPES_TEMPLATE,
  SENSOR_TYPES_MODALS,
  SENSOR_TYPES_SCRIPT,
} from './control-panel-modules/sensor-types.module';
import {
  TRACEABILITY_TEMPLATE,
  TRACEABILITY_MODALS,
  TRACEABILITY_SCRIPT,
} from './control-panel-modules/traceability.module';
import {
  MEMMAP_UPLOAD_TEMPLATE,
  MEMMAP_UPLOAD_MODALS,
  MEMMAP_UPLOAD_SCRIPT,
} from './control-panel-modules/memmap-upload.module';
import {
  MEMMAP_MANAGER_TEMPLATE,
  MEMMAP_MANAGER_MODALS,
  MEMMAP_MANAGER_SCRIPT,
} from './control-panel-modules/memmap-manager.module';
import {
  FINAL_CONFIG_MANAGER_TEMPLATE,
  FINAL_CONFIG_MANAGER_MODALS,
  FINAL_CONFIG_MANAGER_SCRIPT,
} from './control-panel-modules/final-config-manager.module';
import {
  CREATE_FINAL_CONFIG_TEMPLATE,
  CREATE_FINAL_CONFIG_MODALS,
  CREATE_FINAL_CONFIG_SCRIPT,
} from './control-panel-modules/create-final-config.module';
import {
  DEVICE_TESTED_TEMPLATE,
  DEVICE_TESTED_MODALS,
  DEVICE_TESTED_SCRIPT,
} from './control-panel-modules/device-tested.module';
import {
  PLUGINS_MANAGEMENT_TEMPLATE,
  PLUGINS_MANAGEMENT_MODALS,
} from './control-panel-modules/plugins-management.module';

/**
 * Modular View Composer for Control Panel.
 * Uses TemplateEngine to assemble HTML, CSS, and component partials from disk or cache.
 */
export function buildControlPanelHtml(): string {
  const css = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'css', 'control-panel.css'));
  const header = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'header.html'));
  const sidebar = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'sidebar.html'));
  const banner = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'degraded-banner.html'));
  const toasts = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'toasts.html'));
  const modalsBase = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'modals.html'));
  const clientScript = TemplateEngine.loadFile(path.join(__dirname, 'templates', 'control-panel', 'client.js'));

  // Compose all modular tab templates dynamically
  const content = `
        <!-- TAB 1: OVERVIEW & DATABASE -->
        <c-module-boundary module-id="overview" title="Overview Hub" icon="fa-solid fa-chart-pie" :active="activeTab === 'overview' || activeTab === 'database'">
          <div v-if="activeTab === 'overview' || activeTab === 'database'">
            ${OVERVIEW_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 2: NETWORK SERVERS -->
        <c-module-boundary module-id="network-servers" title="Network Servers" icon="fa-solid fa-tower-broadcast" :active="activeTab === 'network-servers'">
          <div v-if="activeTab === 'network-servers'">
            ${NETWORK_SERVERS_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 3: SYSTEM MODULES, ROLES, USERS -->
        <c-module-boundary module-id="modules" title="Dashboard Modules & Governance" icon="fa-solid fa-cubes" :active="activeTab === 'modules' || activeTab === 'roles' || activeTab === 'users'">
          <div v-if="activeTab === 'modules' || activeTab === 'roles' || activeTab === 'users'">
            ${SYSTEM_MODULES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 7: DEVICES -->
        <c-module-boundary module-id="devices" title="Device Fleet" icon="fa-solid fa-microchip" :active="activeTab === 'devices'">
          <div v-if="activeTab === 'devices'">
            ${DEVICES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 8: WEBHOOKS -->
        <c-module-boundary module-id="webhooks" title="Webhook Manager" icon="fa-solid fa-satellite-dish" :active="activeTab === 'webhooks'">
          <div v-if="activeTab === 'webhooks'">
            ${WEBHOOKS_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 9: DECODER CONFIG -->
        <c-module-boundary module-id="decoder" title="Payload Decoders" icon="fa-solid fa-code" :active="activeTab === 'decoder'">
          <div v-if="activeTab === 'decoder'">
            ${DECODER_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 10: HMI STUDIO -->
        <c-module-boundary module-id="hmi-studio" title="HMI Studio" icon="fa-solid fa-desktop" :active="activeTab === 'hmi-studio'">
          <div v-if="activeTab === 'hmi-studio'">
            ${HMI_STUDIO_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 11: DOWNLINK QUEUE -->
        <c-module-boundary module-id="downlink" title="Downlink Queue Manager" icon="fa-solid fa-paper-plane" :active="activeTab === 'downlink'">
          <div v-if="activeTab === 'downlink'">
            ${DOWNLINK_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 12: MODBUS PRESETS -->
        <c-module-boundary module-id="modbus-presets" title="Modbus Register Presets" icon="fa-solid fa-sliders" :active="activeTab === 'modbus-presets'">
          <div v-if="activeTab === 'modbus-presets'" class="space-y-6">
            ${MODBUS_PRESETS_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 13: TEST BUILDER -->
        <c-module-boundary module-id="test-builder" title="Interactive Test Builder" icon="fa-solid fa-vial-circle-check" :active="activeTab === 'test-builder'">
          <div v-if="activeTab === 'test-builder'" class="space-y-6">
            ${TEST_BUILDER_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 14: ITEM CODES -->
        <c-module-boundary module-id="item-codes" title="Item Codes Catalog" icon="fa-solid fa-barcode" :active="activeTab === 'item-codes'">
          <div v-if="activeTab === 'item-codes'" class="space-y-6">
            ${ITEM_CODES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 15: SALES ORDERS & ITEM CODES -->
        <c-module-boundary module-id="sales-orders" title="Sales Orders" icon="fa-solid fa-file-invoice-dollar" :active="activeTab === 'sales-orders'">
          <div v-if="activeTab === 'sales-orders'" class="space-y-6">
            ${SALES_ORDERS_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 16: LORAWAN SENSOR TYPES -->
        <c-module-boundary module-id="sensor-types" title="LoRaWAN Sensor Types" icon="fa-solid fa-microchip" :active="activeTab === 'sensor-types'">
          <div v-if="activeTab === 'sensor-types'" class="space-y-6">
            ${SENSOR_TYPES_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 17: TRACEABILITY (T-MODULE) -->
        <c-module-boundary module-id="traceability" title="Traceability (T-Module)" icon="fa-solid fa-clipboard-check" :active="activeTab === 'traceability'">
          <div v-if="activeTab === 'traceability'" class="space-y-6">
            ${TRACEABILITY_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 18: MEMORY MAP UPLOAD -->
        <c-module-boundary module-id="memmap-upload" title="Memory Map Upload" icon="fa-solid fa-file-csv" :active="activeTab === 'memmap-upload'">
          <div v-if="activeTab === 'memmap-upload'" class="space-y-6">
            ${MEMMAP_UPLOAD_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB: MEMORY MAP MANAGER -->
        <c-module-boundary module-id="memmap-manager" title="Memory Map Manager" icon="fa-solid fa-map-location-dot" :active="activeTab === 'memmap-manager'">
          <div v-if="activeTab === 'memmap-manager'" class="space-y-6">
            ${MEMMAP_MANAGER_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 19: FINAL CONFIG (DEVICE CONFIG CREATOR) -->
        <c-module-boundary module-id="create-final-config" title="Device Config Creator" icon="fa-solid fa-file-circle-plus" :active="activeTab === 'create-final-config'">
          <div v-if="activeTab === 'create-final-config'" class="space-y-6">
            ${CREATE_FINAL_CONFIG_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB: FINAL CONFIG MANAGER -->
        <c-module-boundary module-id="final-config-manager" title="Final Config Manager" icon="fa-solid fa-file-shield" :active="activeTab === 'final-config-manager'">
          <div v-if="activeTab === 'final-config-manager'" class="space-y-6">
            ${FINAL_CONFIG_MANAGER_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 20: TESTED DEVICES LOG -->
        <c-module-boundary module-id="device-tested" title="Tested Devices Log" icon="fa-solid fa-list-check" :active="activeTab === 'device-tested'">
          <div v-if="activeTab === 'device-tested'" class="space-y-6">
            ${DEVICE_TESTED_TEMPLATE}
          </div>
        </c-module-boundary>

        <!-- TAB 21: PLUGINS MANAGEMENT -->
        <c-module-boundary module-id="plugins-management" title="Plugins Management" icon="fa-solid fa-puzzle-piece" :active="activeTab === 'plugins-management'">
          <div v-if="activeTab === 'plugins-management'">
            ${PLUGINS_MANAGEMENT_TEMPLATE}
          </div>
        </c-module-boundary>
  `;

  const modals = `
    ${modalsBase}
    ${OVERVIEW_MODALS}
    ${NETWORK_SERVERS_MODALS}
    ${SYSTEM_MODULES_MODALS}
    ${DEVICES_MODALS}
    ${WEBHOOKS_MODALS}
    ${DECODER_MODALS}
    ${HMI_STUDIO_MODALS}
    ${DOWNLINK_MODALS}
    ${MODBUS_PRESETS_MODALS}
    ${TEST_BUILDER_MODALS}
    ${ITEM_CODES_MODALS}
    ${SALES_ORDERS_MODALS}
    ${SENSOR_TYPES_MODALS}
    ${TRACEABILITY_MODALS}
    ${MEMMAP_UPLOAD_MODALS}
    ${MEMMAP_MANAGER_MODALS}
    ${FINAL_CONFIG_MANAGER_MODALS}
    ${CREATE_FINAL_CONFIG_MODALS}
    ${DEVICE_TESTED_MODALS}
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
