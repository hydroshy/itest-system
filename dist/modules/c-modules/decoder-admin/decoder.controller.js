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
exports.DecoderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decoder_service_1 = require("./decoder.service");
const decoder_dto_1 = require("./dto/decoder.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../../common/guards/permissions.guard");
const permissions_decorator_1 = require("../../../common/decorators/permissions.decorator");
let DecoderController = class DecoderController {
    constructor(decoderService) {
        this.decoderService = decoderService;
    }
    async findAll() {
        return await this.decoderService.findAll();
    }
    async findOne(id) {
        return await this.decoderService.findOne(id);
    }
    async create(dto, req) {
        const author = req.user?.username || req.user?.email || 'admin';
        return await this.decoderService.create(dto, author);
    }
    async update(id, dto, req) {
        const author = req.user?.username || req.user?.email || 'admin';
        return await this.decoderService.update(id, dto, author);
    }
    async remove(id) {
        return await this.decoderService.remove(id);
    }
    testDecode(dto) {
        return this.decoderService.testDecode(dto);
    }
};
exports.DecoderController = DecoderController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:decoder:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách tất cả payload decoders đã đăng ký theo SKU và Firmware' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DecoderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:decoder:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Lấy chi tiết decoder theo composite ID (vd: WSLRW-V1A_9)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DecoderController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:decoder:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Thêm mới decoder theo mã SKU và Firmware version (1-32)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [decoder_dto_1.CreateDecoderDto, Object]),
    __metadata("design:returntype", Promise)
], DecoderController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:decoder:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật mã code JavaScript hoặc mô tả của decoder' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, decoder_dto_1.UpdateDecoderDto, Object]),
    __metadata("design:returntype", Promise)
], DecoderController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:decoder:manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Xóa decoder khỏi database' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DecoderController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('test'),
    (0, permissions_decorator_1.RequirePermissions)('lorawan:decoder:read'),
    (0, swagger_1.ApiOperation)({ summary: 'Kiểm thử hàm giải mã JavaScript với chuỗi Hex thực tế trong Sandbox' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [decoder_dto_1.TestDecoderDto]),
    __metadata("design:returntype", void 0)
], DecoderController.prototype, "testDecode", null);
exports.DecoderController = DecoderController = __decorate([
    (0, swagger_1.ApiTags)('Decoder Manager (C-Module)'),
    (0, common_1.Controller)('api/decoders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [decoder_service_1.DecoderService])
], DecoderController);
//# sourceMappingURL=decoder.controller.js.map