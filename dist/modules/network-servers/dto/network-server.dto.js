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
exports.UpdateNetworkServerDto = exports.CreateNetworkServerDto = exports.RegionProfileDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const network_server_entity_1 = require("../entities/network-server.entity");
class RegionProfileDto {
}
exports.RegionProfileDto = RegionProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID định danh của region profile', example: 'prof-as923-vn' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegionProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tên hiển thị của Region Profile', example: 'Vietnam AS923-1 Plan' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegionProfileDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Mã vùng tần số LoRaWAN', example: 'AS923-1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegionProfileDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Route Reference cho ThingPark Wireless', example: 'TP_VN_AS923_01' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegionProfileDto.prototype, "routeRef", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Device/Service Profile ID cho ChirpStack', example: 'dp_e62b6680-4966-419b' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegionProfileDto.prototype, "profileId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Dải tần số hoạt động', example: '920-925 MHz' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegionProfileDto.prototype, "frequencyBand", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mô tả chi tiết region profile', example: 'Dành cho thị trường Việt Nam theo chuẩn AS923-1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegionProfileDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Trạng thái kích hoạt', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], RegionProfileDto.prototype, "isActive", void 0);
class CreateNetworkServerDto {
}
exports.CreateNetworkServerDto = CreateNetworkServerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tên của Network Server', example: 'ThingPark Wireless Enterprise' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateNetworkServerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: network_server_entity_1.NetworkServerType, description: 'Loại Network Server', example: network_server_entity_1.NetworkServerType.THINGPARK }),
    (0, class_validator_1.IsEnum)(network_server_entity_1.NetworkServerType),
    __metadata("design:type", String)
], CreateNetworkServerDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mô tả Network Server', example: 'Actility ThingPark Enterprise Server for EU & AS regions' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNetworkServerDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Base API Endpoint URL', example: 'https://community.thingpark.io/thingpark/wireless/rest/v1' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNetworkServerDto.prototype, "apiUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'API Key / Token / Secret', example: 'tp_sec_token_998822' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNetworkServerDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Route Reference mặc định (cho ThingPark)', example: 'DAVITEQ_TP_DEFAULT_ROUTE' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNetworkServerDto.prototype, "routeRef", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Application ID / UUID (cho ChirpStack hoặc ThingPark)', example: '018e69d7-8947-79b8-a764-96d552bd3b8e' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNetworkServerDto.prototype, "applicationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Danh sách Region Profiles', type: [RegionProfileDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RegionProfileDto),
    __metadata("design:type", Array)
], CreateNetworkServerDto.prototype, "regionProfiles", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Trạng thái hoạt động', example: 'ONLINE' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateNetworkServerDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Đặt làm Network Server mặc định', default: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateNetworkServerDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metadata hoặc tùy chỉnh mở rộng' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateNetworkServerDto.prototype, "metadata", void 0);
class UpdateNetworkServerDto {
}
exports.UpdateNetworkServerDto = UpdateNetworkServerDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tên của Network Server' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNetworkServerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: network_server_entity_1.NetworkServerType, description: 'Loại Network Server' }),
    (0, class_validator_1.IsEnum)(network_server_entity_1.NetworkServerType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNetworkServerDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mô tả Network Server' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNetworkServerDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Base API Endpoint URL' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNetworkServerDto.prototype, "apiUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'API Key / Token / Secret' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNetworkServerDto.prototype, "apiKey", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Route Reference mặc định' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNetworkServerDto.prototype, "routeRef", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Application ID / UUID (cho ChirpStack)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNetworkServerDto.prototype, "applicationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Danh sách Region Profiles', type: [RegionProfileDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RegionProfileDto),
    __metadata("design:type", Array)
], UpdateNetworkServerDto.prototype, "regionProfiles", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Trạng thái hoạt động' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNetworkServerDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Đặt làm Network Server mặc định' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNetworkServerDto.prototype, "isDefault", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metadata hoặc tùy chỉnh mở rộng' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateNetworkServerDto.prototype, "metadata", void 0);
//# sourceMappingURL=network-server.dto.js.map