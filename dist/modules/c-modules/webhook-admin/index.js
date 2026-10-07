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
exports.C_WEBHOOK_ADMIN = void 0;
__exportStar(require("./entities/webhook-log.entity"), exports);
__exportStar(require("./webhook-admin.service"), exports);
__exportStar(require("./webhook-admin.controller"), exports);
__exportStar(require("./webhook-admin.module"), exports);
exports.C_WEBHOOK_ADMIN = {
    id: 'c-webhook-admin',
    code: 'C_MOD_WEBHOOKS',
    title: 'Webhook Manager',
    description: 'Monitor live packet streams from ChirpStack & ThingPark webhooks with automated log retention.',
};
//# sourceMappingURL=index.js.map