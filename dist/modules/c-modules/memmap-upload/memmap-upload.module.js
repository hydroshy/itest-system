"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemmapUploadModule = void 0;
const common_1 = require("@nestjs/common");
const memmap_upload_controller_1 = require("./memmap-upload.controller");
const memmap_upload_service_1 = require("./memmap-upload.service");
const memmap_upload_repository_1 = require("./memmap-upload.repository");
const dynamic_database_module_1 = require("../../database/dynamic-database.module");
let MemmapUploadModule = class MemmapUploadModule {
};
exports.MemmapUploadModule = MemmapUploadModule;
exports.MemmapUploadModule = MemmapUploadModule = __decorate([
    (0, common_1.Module)({
        imports: [dynamic_database_module_1.DynamicDatabaseModule],
        controllers: [memmap_upload_controller_1.MemmapUploadController],
        providers: [memmap_upload_service_1.MemmapUploadService, memmap_upload_repository_1.MemmapUploadRepository],
        exports: [memmap_upload_service_1.MemmapUploadService, memmap_upload_repository_1.MemmapUploadRepository],
    })
], MemmapUploadModule);
//# sourceMappingURL=memmap-upload.module.js.map