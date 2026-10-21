"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DASHBOARD_DOWNLINK_SCRIPT = exports.DASHBOARD_DOWNLINK_MODALS = exports.DASHBOARD_DOWNLINK_TEMPLATE = exports.CONTROL_PANEL_HTML = exports.DASHBOARD_HTML = exports.LOGIN_HTML = void 0;
var login_page_1 = require("./pages/login.page");
Object.defineProperty(exports, "LOGIN_HTML", { enumerable: true, get: function () { return login_page_1.LOGIN_HTML; } });
var dashboard_page_1 = require("./pages/dashboard.page");
Object.defineProperty(exports, "DASHBOARD_HTML", { enumerable: true, get: function () { return dashboard_page_1.DASHBOARD_HTML; } });
var control_panel_page_1 = require("./pages/control-panel.page");
Object.defineProperty(exports, "CONTROL_PANEL_HTML", { enumerable: true, get: function () { return control_panel_page_1.CONTROL_PANEL_HTML; } });
__exportStar(require("./modules/dashboard/device-manager.module"), exports);
__exportStar(require("./modules/dashboard/test-automation.module"), exports);
__exportStar(require("./modules/dashboard/telemetry.module"), exports);
__exportStar(require("./modules/dashboard/hmi-scada.module"), exports);
var downlink_module_1 = require("./modules/dashboard/downlink.module");
Object.defineProperty(exports, "DASHBOARD_DOWNLINK_TEMPLATE", { enumerable: true, get: function () { return downlink_module_1.DOWNLINK_TEMPLATE; } });
Object.defineProperty(exports, "DASHBOARD_DOWNLINK_MODALS", { enumerable: true, get: function () { return downlink_module_1.DOWNLINK_MODALS; } });
Object.defineProperty(exports, "DASHBOARD_DOWNLINK_SCRIPT", { enumerable: true, get: function () { return downlink_module_1.DOWNLINK_SCRIPT; } });
__exportStar(require("./modules/dashboard/serial-uart.module"), exports);
__exportStar(require("./modules/dashboard/traceability.module"), exports);
__exportStar(require("./modules/dashboard/final-config-device.module"), exports);
//# sourceMappingURL=index.js.map