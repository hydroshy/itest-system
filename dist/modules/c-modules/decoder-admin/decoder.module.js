"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoderModule = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
const decoder_controller_1 = require("./decoder.controller");
const decoder_service_1 = require("./decoder.service");
let DecoderModule = class DecoderModule {
};
exports.DecoderModule = DecoderModule;
exports.DecoderModule = DecoderModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule],
        controllers: [decoder_controller_1.DecoderController],
        providers: [decoder_service_1.DecoderService],
        exports: [decoder_service_1.DecoderService],
    })
], DecoderModule);
//# sourceMappingURL=decoder.module.js.map