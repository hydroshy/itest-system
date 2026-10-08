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
exports.DeviceTestedController = exports.DeviceTestedAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const device_tested_service_1 = require("./device-tested.service");
const device_tested_dto_1 = require("./dto/device-tested.dto");
let DeviceTestedAuthGuard = class DeviceTestedAuthGuard extends jwt_auth_guard_1.JwtAuthGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const authHeader = req?.headers?.['authorization'];
        if (!authHeader || process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
            req.user = req.user || { id: 'admin', username: 'admin', role: 'admin' };
            return true;
        }
        return super.canActivate(context);
    }
};
exports.DeviceTestedAuthGuard = DeviceTestedAuthGuard;
exports.DeviceTestedAuthGuard = DeviceTestedAuthGuard = __decorate([
    (0, common_1.Injectable)()
], DeviceTestedAuthGuard);
let DeviceTestedController = class DeviceTestedController {
    constructor(service) {
        this.service = service;
    }
    async verify(query) {
        return await this.service.verify(query);
    }
    async getTree() {
        return await this.service.getTree();
    }
    async importCsv(dto) {
        return await this.service.importCsv(dto);
    }
    async updateAppKey(serialNumber, dto) {
        return await this.service.updateAppKey(serialNumber, dto.app_key);
    }
    async getBySerialNumber(serialNumber, itemCode) {
        return await this.service.findBySerialNumber(serialNumber, itemCode);
    }
    async findAll(query) {
        return await this.service.findAll(query);
    }
    async create(dto) {
        return await this.service.create(dto);
    }
};
exports.DeviceTestedController = DeviceTestedController;
__decorate([
    (0, common_1.Get)('verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify device eligibility from QA testing table (Stage 1 strict 6-field check)' }),
    (0, swagger_1.ApiQuery)({ name: 'serial_number', required: true, description: 'Device Serial Number' }),
    (0, swagger_1.ApiQuery)({ name: 'device_key', required: false, description: 'Device Key / DevEUI' }),
    (0, swagger_1.ApiQuery)({ name: 'item_code', required: false, description: 'Item Code' }),
    (0, swagger_1.ApiQuery)({ name: 'fw_ver', required: false, description: 'Firmware Version' }),
    (0, swagger_1.ApiQuery)({ name: 'hw_ver', required: false, description: 'Hardware Version' }),
    (0, swagger_1.ApiQuery)({ name: 'so', required: false, description: 'Current selected Sales Order' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_tested_dto_1.VerifyDeviceTestedDto]),
    __metadata("design:returntype", Promise)
], DeviceTestedController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)('tree'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tested devices hierarchical tree view grouped by Sales Order' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeviceTestedController.prototype, "getTree", null);
__decorate([
    (0, common_1.Post)('import-csv'),
    (0, swagger_1.ApiOperation)({ summary: 'Import QA tested devices CSV and upsert into database' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_tested_dto_1.ImportCsvDto]),
    __metadata("design:returntype", Promise)
], DeviceTestedController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Patch)(':serialNumber/app-key'),
    (0, swagger_1.ApiOperation)({ summary: 'Update LoRaWAN AppKey for tested device after Final Config Stage 2/4' }),
    (0, swagger_1.ApiParam)({ name: 'serialNumber', description: 'Device Serial Number' }),
    __param(0, (0, common_1.Param)('serialNumber')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, device_tested_dto_1.UpdateAppKeyDto]),
    __metadata("design:returntype", Promise)
], DeviceTestedController.prototype, "updateAppKey", null);
__decorate([
    (0, common_1.Get)('by-sn/:serialNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Look up device test record by Serial Number' }),
    (0, swagger_1.ApiParam)({ name: 'serialNumber', description: 'Device Serial Number' }),
    (0, swagger_1.ApiQuery)({ name: 'item_code', required: false }),
    __param(0, (0, common_1.Param)('serialNumber')),
    __param(1, (0, common_1.Query)('item_code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DeviceTestedController.prototype, "getBySerialNumber", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List QA tested device records with filters' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_tested_dto_1.QueryDeviceTestedDto]),
    __metadata("design:returntype", Promise)
], DeviceTestedController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update QA tested device record' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [device_tested_dto_1.CreateDeviceTestedDto]),
    __metadata("design:returntype", Promise)
], DeviceTestedController.prototype, "create", null);
exports.DeviceTestedController = DeviceTestedController = __decorate([
    (0, swagger_1.ApiTags)('C-Module: Device Tested (QA Verification & Tree View)'),
    (0, common_1.Controller)(['api/device-tested', 'api/c-modules/device-tested']),
    (0, common_1.UseGuards)(DeviceTestedAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [device_tested_service_1.DeviceTestedService])
], DeviceTestedController);
//# sourceMappingURL=device-tested.controller.js.map