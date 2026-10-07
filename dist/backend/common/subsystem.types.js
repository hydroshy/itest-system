"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendSubsystem = exports.BackendSubsystem = void 0;
var BackendSubsystem;
(function (BackendSubsystem) {
    BackendSubsystem["DATABASE"] = "DATABASE";
    BackendSubsystem["LORAWAN"] = "LORAWAN_NETWORK_SERVER";
    BackendSubsystem["ORDER_MANAGEMENT"] = "ORDER_MANAGEMENT";
    BackendSubsystem["TEST_AUTOMATION"] = "TEST_AUTOMATION";
    BackendSubsystem["IDENTITY"] = "IDENTITY_AUTH";
    BackendSubsystem["INDUSTRIAL_IOT"] = "INDUSTRIAL_IOT";
    BackendSubsystem["REALTIME"] = "REALTIME_STREAM";
})(BackendSubsystem || (exports.BackendSubsystem = BackendSubsystem = {}));
var FrontendSubsystem;
(function (FrontendSubsystem) {
    FrontendSubsystem["PAGES"] = "FRONTEND_PAGES";
    FrontendSubsystem["CONTROL_PANEL"] = "FRONTEND_CONTROL_PANEL";
    FrontendSubsystem["DASHBOARD"] = "FRONTEND_DASHBOARD";
})(FrontendSubsystem || (exports.FrontendSubsystem = FrontendSubsystem = {}));
//# sourceMappingURL=subsystem.types.js.map