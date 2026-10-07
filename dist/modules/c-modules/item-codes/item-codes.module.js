"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemCodesModule = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
const item_codes_controller_1 = require("./item-codes.controller");
const item_codes_service_1 = require("./item-codes.service");
const item_codes_repository_1 = require("./item-codes.repository");
let ItemCodesModule = class ItemCodesModule {
};
exports.ItemCodesModule = ItemCodesModule;
exports.ItemCodesModule = ItemCodesModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule],
        controllers: [item_codes_controller_1.ItemCodesController],
        providers: [item_codes_repository_1.ItemCodesRepository, item_codes_service_1.ItemCodesService],
        exports: [item_codes_service_1.ItemCodesService, item_codes_repository_1.ItemCodesRepository],
    })
], ItemCodesModule);
//# sourceMappingURL=item-codes.module.js.map