"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestBuilderModule = void 0;
const common_1 = require("@nestjs/common");
const test_builder_controller_1 = require("./test-builder.controller");
const test_builder_service_1 = require("./test-builder.service");
const flow_graph_engine_service_1 = require("./flow-graph-engine.service");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
let TestBuilderModule = class TestBuilderModule {
};
exports.TestBuilderModule = TestBuilderModule;
exports.TestBuilderModule = TestBuilderModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule],
        controllers: [test_builder_controller_1.TestBuilderController],
        providers: [test_builder_service_1.TestBuilderService, flow_graph_engine_service_1.FlowGraphEngineService],
        exports: [test_builder_service_1.TestBuilderService, flow_graph_engine_service_1.FlowGraphEngineService],
    })
], TestBuilderModule);
//# sourceMappingURL=test-builder.module.js.map