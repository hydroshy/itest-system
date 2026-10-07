"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceabilityModule = void 0;
const common_1 = require("@nestjs/common");
const traceability_controller_1 = require("./traceability.controller");
const traceability_service_1 = require("./traceability.service");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
let TraceabilityModule = class TraceabilityModule {
};
exports.TraceabilityModule = TraceabilityModule;
exports.TraceabilityModule = TraceabilityModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule],
        controllers: [traceability_controller_1.TraceabilityController],
        providers: [traceability_service_1.TraceabilityService],
        exports: [traceability_service_1.TraceabilityService],
    })
], TraceabilityModule);
//# sourceMappingURL=traceability.module.js.map