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
exports.CsvImportDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CsvImportDto {
    constructor() {
        this.overwriteExisting = false;
    }
}
exports.CsvImportDto = CsvImportDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Raw CSV string with header row: soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes',
        example: 'soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes\nSO-2026-001,Daviteq IoT,2026-09-20,ITEM-001,WSLRW-ATH,1.4,50,Lot 1\nSO-2026-001,Daviteq IoT,2026-09-20,ITEM-002,WSLRW-CLW,1,20,Lot 2',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CsvImportDto.prototype, "csvContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether to overwrite existing SO if soCode matches', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CsvImportDto.prototype, "overwriteExisting", void 0);
//# sourceMappingURL=csv-import.dto.js.map