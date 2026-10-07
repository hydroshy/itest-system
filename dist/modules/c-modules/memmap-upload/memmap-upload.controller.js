"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemmapUploadController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../users/entities/user.entity");
const memmap_upload_service_1 = require("./memmap-upload.service");
const upload_memmap_dto_1 = require("./dto/upload-memmap.dto");
let MemmapUploadController = class MemmapUploadController {
    constructor(memmapUploadService) {
        this.memmapUploadService = memmapUploadService;
    }
    async uploadMemmap(dto, user) {
        const author = user?.username || user?.fullName || 'admin';
        return await this.memmapUploadService.uploadMemmap(dto, author);
    }
    async getBySkuAndShortFw(sku, shortFw) {
        return await this.memmapUploadService.getBySkuAndShortFw(sku, shortFw);
    }
    async findAll() {
        const data = await this.memmapUploadService.findAll();
        return { success: true, data };
    }
};
exports.MemmapUploadController = MemmapUploadController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload and validate Modbus Register Memory Map linked by SKU and short FW version',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upload_memmap_dto_1.UploadMemmapDto, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], MemmapUploadController.prototype, "uploadMemmap", null);
__decorate([
    (0, common_1.Get)('by-sku/:sku/:shortFw'),
    (0, swagger_1.ApiOperation)({
        summary: 'Lookup stored Memory Map and 16-field Modbus registers by SKU and short FW',
    }),
    (0, swagger_1.ApiParam)({ name: 'sku', example: 'WSLRW-ATH' }),
    (0, swagger_1.ApiParam)({ name: 'shortFw', example: 6 }),
    __param(0, (0, common_1.Param)('sku')),
    __param(1, (0, common_1.Param)('shortFw')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemmapUploadController.prototype, "getBySkuAndShortFw", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all registered Memory Map payloads' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MemmapUploadController.prototype, "findAll", null);
exports.MemmapUploadController = MemmapUploadController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: Memory Map Upload'),
    (0, common_1.Controller)(['api/c-modules/memmap-upload', 'api/memmap']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [memmap_upload_service_1.MemmapUploadService])
], MemmapUploadController);
//# sourceMappingURL=memmap-upload.controller.js.map