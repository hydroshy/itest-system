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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OdooApiSyncDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class OdooApiSyncDto {
}
exports.OdooApiSyncDto = OdooApiSyncDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Odoo Server URL', example: 'https://odoo.daviteq.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooApiSyncDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Odoo Database Name', example: 'daviteq_prod' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooApiSyncDto.prototype, "db", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Odoo Username / Email', example: 'admin@daviteq.com' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooApiSyncDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Odoo API Key or Password' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooApiSyncDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sales Order Code to sync', example: 'SO0042' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OdooApiSyncDto.prototype, "soCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Odoo sale.order ID to sync', example: 42 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], OdooApiSyncDto.prototype, "odooId", void 0);
//# sourceMappingURL=odoo-api-sync.dto.js.map