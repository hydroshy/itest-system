"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemmapManagerModule = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
const memmap_manager_controller_1 = require("./memmap-manager.controller");
const memmap_manager_service_1 = require("./memmap-manager.service");
const memmap_manager_repository_1 = require("./memmap-manager.repository");
let MemmapManagerModule = class MemmapManagerModule {
};
exports.MemmapManagerModule = MemmapManagerModule;
exports.MemmapManagerModule = MemmapManagerModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule],
        controllers: [memmap_manager_controller_1.MemmapManagerController],
        providers: [memmap_manager_service_1.MemmapManagerService, memmap_manager_repository_1.MemmapManagerRepository],
        exports: [memmap_manager_service_1.MemmapManagerService, memmap_manager_repository_1.MemmapManagerRepository],
    })
], MemmapManagerModule);
//# sourceMappingURL=memmap-manager.module.js.map