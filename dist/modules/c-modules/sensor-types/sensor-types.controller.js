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
exports.SensorTypesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const sensor_types_service_1 = require("./sensor-types.service");
const sensor_type_dto_1 = require("./dto/sensor-type.dto");
let SensorTypesController = class SensorTypesController {
    constructor(service) {
        this.service = service;
    }
    async findAll(query) {
        return await this.service.findAll(query);
    }
    async resolveSku(code) {
        return await this.service.resolveSku(code);
    }
    async findOne(id) {
        return await this.service.findOne(id);
    }
    async create(dto) {
        return await this.service.create(dto);
    }
    async update(id, dto) {
        return await this.service.update(id, dto);
    }
    async remove(id) {
        return await this.service.remove(id);
    }
};
exports.SensorTypesController = SensorTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all LoRaWAN Sensor Type mappings with search and pagination' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sensor_type_dto_1.QuerySensorTypeDto]),
    __metadata("design:returntype", Promise)
], SensorTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('resolve/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve LoRaWAN SKU, Region, Class from Modbus Sensor Type decimal code' }),
    __param(0, (0, common_1.Param)('code', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SensorTypesController.prototype, "resolveSku", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get single sensor type mapping by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SensorTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new Sensor Type to LoRaWAN SKU mapping' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sensor_type_dto_1.CreateSensorTypeDto]),
    __metadata("design:returntype", Promise)
], SensorTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update existing Sensor Type mapping' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sensor_type_dto_1.UpdateSensorTypeDto]),
    __metadata("design:returntype", Promise)
], SensorTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete Sensor Type mapping' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SensorTypesController.prototype, "remove", null);
exports.SensorTypesController = SensorTypesController = __decorate([
    (0, swagger_1.ApiTags)('LoRaWAN Sensor Types (C-Module)'),
    (0, common_1.Controller)(['api/sensor-types', 'api/c-modules/sensor-types']),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [sensor_types_service_1.SensorTypesService])
], SensorTypesController);
//# sourceMappingURL=sensor-types.controller.js.map