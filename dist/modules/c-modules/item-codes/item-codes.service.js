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
var ItemCodesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemCodesService = void 0;
const common_1 = require("@nestjs/common");
const item_codes_repository_1 = require("./item-codes.repository");
const item_code_utils_1 = require("./item-code-utils");
let ItemCodesService = ItemCodesService_1 = class ItemCodesService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger(ItemCodesService_1.name);
    }
    async findAll(query) {
        return await this.repository.findWithPagination(query);
    }
    async findPicker(search) {
        return await this.repository.findPickerItems(search);
    }
    async findOne(id) {
        const item = await this.repository.findById(id);
        if (!item) {
            throw new common_1.NotFoundException(`Item Code [${id}] not found`);
        }
        return item;
    }
    async create(dto) {
        const itemCode = (dto.itemCode || '').trim();
        if (!itemCode) {
            throw new common_1.BadRequestException('Item Code is required');
        }
        const existing = await this.repository.findByItemCode(itemCode);
        if (existing) {
            throw new common_1.ConflictException(`Item Code '${itemCode}' already exists in catalog`);
        }
        const sku = (dto.sku || '').trim().toUpperCase();
        if (!sku) {
            throw new common_1.BadRequestException('Device SKU is required');
        }
        const firmwareVersion = (0, item_code_utils_1.sanitizeFirmwareVersion)(dto.firmwareVersion);
        const skuFw = (0, item_code_utils_1.formatSkuFw)(sku, firmwareVersion);
        let defaultTemplateId = dto.defaultTemplateId && typeof dto.defaultTemplateId === 'string' && dto.defaultTemplateId.trim() !== ''
            ? dto.defaultTemplateId.trim()
            : undefined;
        if (!defaultTemplateId) {
            const match = await this.repository.findMatchingTemplate(sku, firmwareVersion);
            if (match) {
                defaultTemplateId = match.id;
            }
        }
        return await this.repository.createItemCode({
            itemCode,
            sku,
            firmwareVersion,
            skuFw,
            defaultTemplateId,
            description: dto.description?.trim(),
            isActive: dto.isActive !== undefined ? dto.isActive : true,
            metadata: dto.metadata || {},
        });
    }
    async update(id, dto) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Item Code [${id}] not found`);
        }
        if (dto.itemCode && dto.itemCode.trim() !== existing.itemCode) {
            const conflict = await this.repository.findByItemCode(dto.itemCode.trim());
            if (conflict && conflict.id !== existing.id) {
                throw new common_1.ConflictException(`Item Code '${dto.itemCode.trim()}' already exists`);
            }
        }
        const updatedSku = dto.sku ? dto.sku.trim().toUpperCase() : existing.sku;
        const updatedFw = dto.firmwareVersion !== undefined
            ? (0, item_code_utils_1.sanitizeFirmwareVersion)(dto.firmwareVersion)
            : existing.firmwareVersion;
        const updatedSkuFw = (0, item_code_utils_1.formatSkuFw)(updatedSku, updatedFw);
        let updatedTemplateId;
        if (dto.defaultTemplateId !== undefined) {
            if (dto.defaultTemplateId === null ||
                (typeof dto.defaultTemplateId === 'string' && dto.defaultTemplateId.trim() === '')) {
                updatedTemplateId = null;
            }
            else {
                updatedTemplateId = dto.defaultTemplateId.trim();
            }
        }
        else {
            updatedTemplateId = existing.defaultTemplateId || null;
            if (!updatedTemplateId && (dto.sku || dto.firmwareVersion !== undefined)) {
                const match = await this.repository.findMatchingTemplate(updatedSku, updatedFw);
                if (match) {
                    updatedTemplateId = match.id;
                }
            }
        }
        return await this.repository.updateItemCode(existing.id, {
            itemCode: dto.itemCode ? dto.itemCode.trim() : existing.itemCode,
            sku: updatedSku,
            firmwareVersion: updatedFw,
            skuFw: updatedSkuFw,
            defaultTemplateId: updatedTemplateId,
            description: dto.description !== undefined ? dto.description?.trim() : existing.description,
            isActive: dto.isActive !== undefined ? dto.isActive : existing.isActive,
            metadata: dto.metadata || existing.metadata,
        });
    }
    async remove(id) {
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Item Code [${id}] not found`);
        }
        const usageCount = await this.repository.countSalesOrderItems(existing.id);
        if (usageCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete Item Code '${existing.itemCode}' as it is referenced by ${usageCount} Sales Order line(s). Deactivate it instead.`);
        }
        await this.repository.deleteItemCode(existing.id);
        return {
            success: true,
            message: `Item Code '${existing.itemCode}' deleted successfully`,
            id: existing.id,
        };
    }
};
exports.ItemCodesService = ItemCodesService;
exports.ItemCodesService = ItemCodesService = ItemCodesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [item_codes_repository_1.ItemCodesRepository])
], ItemCodesService);
//# sourceMappingURL=item-codes.service.js.map