"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendSubsystem = exports.BackendSubsystem = void 0;
var BackendSubsystem;
(function (BackendSubsystem) {
    BackendSubsystem["DATABASE"] = "DATABASE";
    BackendSubsystem["IDENTITY"] = "IDENTITY_AUTH";
    BackendSubsystem["REALTIME"] = "REALTIME_STREAM";
    BackendSubsystem["PLUGINS"] = "PLUGINS_CORE";
})(BackendSubsystem || (exports.BackendSubsystem = BackendSubsystem = {}));
var FrontendSubsystem;
(function (FrontendSubsystem) {
    FrontendSubsystem["PAGES"] = "FRONTEND_PAGES";
    FrontendSubsystem["CONTROL_PANEL"] = "FRONTEND_CONTROL_PANEL";
    FrontendSubsystem["DASHBOARD"] = "FRONTEND_DASHBOARD";
})(FrontendSubsystem || (exports.FrontendSubsystem = FrontendSubsystem = {}));
//# sourceMappingURL=subsystem.types.js.map