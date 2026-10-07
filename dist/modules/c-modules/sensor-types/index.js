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
exports.C_SENSOR_TYPES = void 0;
__exportStar(require("./entities/sensor-type.entity"), exports);
__exportStar(require("./dto/sensor-type.dto"), exports);
__exportStar(require("./sensor-types.repository"), exports);
__exportStar(require("./sensor-types.service"), exports);
__exportStar(require("./sensor-types.controller"), exports);
__exportStar(require("./sensor-types.module"), exports);
exports.C_SENSOR_TYPES = {
    id: 'c-sensor-types',
    code: 'C_MOD_SENSOR_TYPES',
    title: 'LoRaWAN Sensor Types',
    description: 'Manage LoRaWAN Sensor Type codes (e.g. 71 -> WSLRW-LKS) mapped to hardware SKUs, regions, and classes.',
};
//# sourceMappingURL=index.js.map