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
var ItemCodesRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemCodesRepository = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const item_code_entity_1 = require("./entities/item-code.entity");
const test_template_entity_1 = require("../test-builder/entities/test-template.entity");
const sales_order_item_entity_1 = require("../sales-orders/entities/sales-order-item.entity");
const item_code_utils_1 = require("./item-code-utils");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let ItemCodesRepository = ItemCodesRepository_1 = class ItemCodesRepository {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(ItemCodesRepository_1.name);
    }
    getRepo() {
        return this.dbService.getRepositoryForTable('item_codes', item_code_entity_1.ItemCodeEntity);
    }
    getTemplateRepo() {
        return this.dbService.getRepositoryForTable('test_templates', test_template_entity_1.TestTemplateEntity);
    }
    getSoItemRepo() {
        return this.dbService.getRepositoryForTable('sales_order_items', sales_order_item_entity_1.SalesOrderItemEntity);
    }
    async findWithPagination(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
        const skip = (page - 1) * limit;
        const qb = this.getRepo()
            .createQueryBuilder('ic')
            .leftJoinAndSelect('ic.defaultTemplate', 'defaultTemplate')
            .orderBy('ic.createdAt', 'DESC')
            .skip(skip)
            .take(limit);
        if (query.search && query.search.trim() !== '') {
            const searchPattern = `%${query.search.trim()}%`;
            qb.andWhere('(ic.itemCode ILIKE :search OR ic.sku ILIKE :search OR ic.skuFw ILIKE :search OR ic.description ILIKE :search)', { search: searchPattern });
        }
        if (query.sku && query.sku.trim() !== '') {
            qb.andWhere('LOWER(ic.sku) = LOWER(:sku)', { sku: query.sku.trim() });
        }
        if (query.isActive !== undefined && query.isActive !== '') {
            const activeBool = query.isActive === true || query.isActive === 'true';
            qb.andWhere('ic.isActive = :isActive', { isActive: activeBool });
        }
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findPickerItems(search) {
        const qb = this.getRepo()
            .createQueryBuilder('ic')
            .leftJoinAndSelect('ic.defaultTemplate', 'defaultTemplate')
            .where('ic.isActive = :active', { active: true })
            .orderBy('ic.itemCode', 'ASC');
        if (search && search.trim() !== '') {
            const searchPattern = `%${search.trim()}%`;
            qb.andWhere('(ic.itemCode ILIKE :search OR ic.sku ILIKE :search OR ic.skuFw ILIKE :search OR ic.description ILIKE :search)', { search: searchPattern });
        }
        const items = await qb.getMany();
        return items.map((ic) => ({
            id: ic.id,
            itemCode: ic.itemCode,
            sku: ic.sku,
            firmwareVersion: ic.firmwareVersion,
            skuFw: ic.skuFw,
            defaultTemplateId: ic.defaultTemplateId,
            defaultTemplateName: ic.defaultTemplate ? ic.defaultTemplate.name : undefined,
            description: ic.description,
        }));
    }
    async findById(id) {
        if (!id)
            return null;
        if (!UUID_REGEX.test(id)) {
            return this.findByItemCode(id);
        }
        return await this.getRepo().findOne({
            where: { id },
            relations: ['defaultTemplate'],
        });
    }
    async findByItemCode(itemCode) {
        if (!itemCode)
            return null;
        return await this.getRepo()
            .createQueryBuilder('ic')
            .leftJoinAndSelect('ic.defaultTemplate', 'defaultTemplate')
            .where('LOWER(ic.itemCode) = LOWER(:itemCode)', { itemCode: itemCode.trim() })
            .getOne();
    }
    async createItemCode(data) {
        const repo = this.getRepo();
        const item = repo.create({
            ...data,
            metadata: data.metadata || {},
        });
        const saved = await repo.save(item);
        return (await this.findById(saved.id)) || saved;
    }
    async updateItemCode(id, data) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Item Code [${id}] not found`);
        }
        const repo = this.getRepo();
        Object.assign(existing, {
            ...data,
            updatedAt: new Date(),
        });
        if (data.defaultTemplateId === null) {
            existing.defaultTemplateId = null;
            existing.defaultTemplate = null;
        }
        else if (data.defaultTemplateId !== undefined && data.defaultTemplateId !== existing.defaultTemplateId) {
            existing.defaultTemplate = undefined;
        }
        await repo.save(existing);
        return (await this.findById(id));
    }
    async deleteItemCode(id) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Item Code [${id}] not found`);
        }
        await this.getRepo().remove(existing);
        return true;
    }
    async countSalesOrderItems(itemCodeId) {
        if (!itemCodeId)
            return 0;
        return await this.getSoItemRepo().count({
            where: { itemCodeId },
        });
    }
    async findMatchingTemplate(sku, firmwareVersion) {
        if (!sku)
            return null;
        const cleanFw = (0, item_code_utils_1.sanitizeFirmwareVersion)(firmwareVersion);
        return await this.getTemplateRepo()
            .createQueryBuilder('tt')
            .where('LOWER(tt.sku) = LOWER(:sku)', { sku: sku.trim() })
            .andWhere('tt.firmwareVersion = :fw', { fw: cleanFw })
            .andWhere('tt.isActive = :active', { active: true })
            .orderBy('tt.createdAt', 'DESC')
            .getOne();
    }
};
exports.ItemCodesRepository = ItemCodesRepository;
exports.ItemCodesRepository = ItemCodesRepository = ItemCodesRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], ItemCodesRepository);
//# sourceMappingURL=item-codes.repository.js.map