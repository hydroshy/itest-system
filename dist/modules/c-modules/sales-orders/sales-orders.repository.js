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
var SalesOrdersRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesOrdersRepository = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const sales_order_entity_1 = require("./entities/sales-order.entity");
const sales_order_item_entity_1 = require("./entities/sales-order-item.entity");
const test_template_entity_1 = require("../test-builder/entities/test-template.entity");
const item_code_entity_1 = require("../item-codes/entities/item-code.entity");
const item_code_utils_1 = require("../item-codes/item-code-utils");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let SalesOrdersRepository = SalesOrdersRepository_1 = class SalesOrdersRepository {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(SalesOrdersRepository_1.name);
    }
    getSoRepo() {
        return this.dbService.getRepositoryForTable('sales_orders', sales_order_entity_1.SalesOrderEntity);
    }
    getItemRepo() {
        return this.dbService.getRepositoryForTable('sales_order_items', sales_order_item_entity_1.SalesOrderItemEntity);
    }
    getTemplateRepo() {
        return this.dbService.getRepositoryForTable('test_templates', test_template_entity_1.TestTemplateEntity);
    }
    getItemCodeRepo() {
        return this.dbService.getRepositoryForTable('item_codes', item_code_entity_1.ItemCodeEntity);
    }
    getDataSource() {
        return this.dbService.getDataSourceForTable('sales_orders');
    }
    async findWithPagination(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
        const skip = (page - 1) * limit;
        const qb = this.getSoRepo()
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.items', 'items')
            .leftJoinAndSelect('items.template', 'template')
            .leftJoinAndSelect('items.itemCodeRef', 'itemCodeRef')
            .orderBy('so.createdAt', 'DESC')
            .skip(skip)
            .take(limit);
        if (query.search && query.search.trim() !== '') {
            const searchPattern = `%${query.search.trim()}%`;
            qb.andWhere('(so.soCode ILIKE :search OR so.customer ILIKE :search)', {
                search: searchPattern,
            });
        }
        if (query.status && query.status.trim() !== '') {
            qb.andWhere('so.status = :status', { status: query.status.trim() });
        }
        if (query.source && query.source.trim() !== '') {
            qb.andWhere('so.source = :source', { source: query.source.trim() });
        }
        const [orders, total] = await qb.getManyAndCount();
        const data = orders.map((so) => {
            const items = so.items || [];
            const totalQuantity = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
            const testedQuantity = items.reduce((acc, item) => acc + (item.testedQuantity || 0), 0);
            const passedQuantity = items.reduce((acc, item) => acc + (item.passedQuantity || 0), 0);
            const failedQuantity = items.reduce((acc, item) => acc + (item.failedQuantity || 0), 0);
            const testProgress = totalQuantity > 0 ? Math.min(100, Math.round((testedQuantity / totalQuantity) * 100)) : 0;
            return {
                ...so,
                itemsCount: items.length,
                totalQuantity,
                testedQuantity,
                passedQuantity,
                failedQuantity,
                testProgress,
            };
        });
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findById(id) {
        if (!id)
            return null;
        if (!UUID_REGEX.test(id)) {
            return this.findBySoCode(id);
        }
        return await this.getSoRepo()
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.items', 'items')
            .leftJoinAndSelect('items.template', 'template')
            .leftJoinAndSelect('items.itemCodeRef', 'itemCodeRef')
            .where('so.id = :id', { id })
            .getOne();
    }
    async findBySoCode(soCode) {
        if (!soCode)
            return null;
        return await this.getSoRepo()
            .createQueryBuilder('so')
            .leftJoinAndSelect('so.items', 'items')
            .leftJoinAndSelect('items.template', 'template')
            .leftJoinAndSelect('items.itemCodeRef', 'itemCodeRef')
            .where('so.soCode = :soCode', { soCode: soCode.trim() })
            .getOne();
    }
    async createSalesOrder(soData, itemsData = []) {
        const soRepo = this.getSoRepo();
        const itemRepo = this.getItemRepo();
        const newSo = soRepo.create({
            ...soData,
            status: soData.status || sales_order_entity_1.SalesOrderStatus.DRAFT,
            source: soData.source || sales_order_entity_1.SalesOrderSource.MANUAL,
            orderDate: soData.orderDate || new Date(),
            metadata: soData.metadata || {},
        });
        const savedSo = await soRepo.save(newSo);
        if (itemsData.length > 0) {
            const itemsToCreate = itemsData.map((item) => itemRepo.create({
                ...item,
                salesOrderId: savedSo.id,
                quantity: item.quantity !== undefined ? item.quantity : 1,
                firmwareVersion: item.firmwareVersion ? (0, item_code_utils_1.sanitizeFirmwareVersion)(item.firmwareVersion) : '1',
                status: item.status || sales_order_item_entity_1.SalesOrderItemStatus.PENDING,
                testedQuantity: item.testedQuantity || 0,
                passedQuantity: item.passedQuantity || 0,
                failedQuantity: item.failedQuantity || 0,
                metadata: item.metadata || {},
            }));
            await itemRepo.save(itemsToCreate);
        }
        return (await this.findById(savedSo.id));
    }
    async updateSalesOrder(id, soData, itemsData) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Sales Order [${id}] not found`);
        }
        const soRepo = this.getSoRepo();
        const itemRepo = this.getItemRepo();
        Object.assign(existing, {
            ...soData,
            updatedAt: new Date(),
        });
        const savedSo = await soRepo.save(existing);
        if (itemsData !== undefined) {
            const existingItems = existing.items || [];
            const existingItemMap = new Map(existingItems.map((it) => [it.id, it]));
            const existingCodeMap = new Map(existingItems.map((it) => [it.itemCode, it]));
            const itemsToSave = [];
            const processedItemIds = new Set();
            for (const itemDto of itemsData) {
                let targetItem;
                if (itemDto.id && existingItemMap.has(itemDto.id)) {
                    targetItem = existingItemMap.get(itemDto.id);
                }
                else if (itemDto.itemCode && existingCodeMap.has(itemDto.itemCode)) {
                    targetItem = existingCodeMap.get(itemDto.itemCode);
                }
                if (targetItem) {
                    Object.assign(targetItem, {
                        ...itemDto,
                        salesOrderId: savedSo.id,
                        updatedAt: new Date(),
                    });
                    itemsToSave.push(targetItem);
                    processedItemIds.add(targetItem.id);
                }
                else {
                    const newItem = itemRepo.create({
                        ...itemDto,
                        salesOrderId: savedSo.id,
                        quantity: itemDto.quantity !== undefined ? itemDto.quantity : 1,
                        firmwareVersion: itemDto.firmwareVersion ? (0, item_code_utils_1.sanitizeFirmwareVersion)(itemDto.firmwareVersion) : '1',
                        status: itemDto.status || sales_order_item_entity_1.SalesOrderItemStatus.PENDING,
                        testedQuantity: itemDto.testedQuantity || 0,
                        passedQuantity: itemDto.passedQuantity || 0,
                        failedQuantity: itemDto.failedQuantity || 0,
                        metadata: itemDto.metadata || {},
                    });
                    itemsToSave.push(newItem);
                }
            }
            if (itemsToSave.length > 0) {
                await itemRepo.save(itemsToSave);
            }
            const itemsToDelete = existingItems.filter((it) => !processedItemIds.has(it.id));
            if (itemsToDelete.length > 0) {
                await itemRepo.remove(itemsToDelete);
            }
        }
        return (await this.findById(savedSo.id));
    }
    async deleteSalesOrder(id) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Sales Order [${id}] not found`);
        }
        await this.getSoRepo().remove(existing);
        return true;
    }
    async findItem(salesOrderId, itemCode) {
        return await this.getItemRepo().findOne({
            where: { salesOrderId, itemCode },
            relations: ['template', 'salesOrder', 'itemCodeRef'],
        });
    }
    async findItemCodeById(id) {
        if (!id || !UUID_REGEX.test(id))
            return null;
        return await this.getItemCodeRepo().findOne({
            where: { id },
            relations: ['defaultTemplate'],
        });
    }
    async findItemCodeByCode(itemCode) {
        if (!itemCode)
            return null;
        return await this.getItemCodeRepo()
            .createQueryBuilder('ic')
            .leftJoinAndSelect('ic.defaultTemplate', 'defaultTemplate')
            .where('LOWER(ic.itemCode) = LOWER(:itemCode)', { itemCode: itemCode.trim() })
            .getOne();
    }
    async attachItemsToSalesOrder(salesOrderId, itemsData) {
        const existing = await this.findById(salesOrderId);
        if (!existing) {
            throw new common_1.NotFoundException(`Sales Order [${salesOrderId}] not found`);
        }
        const itemRepo = this.getItemRepo();
        const existingItems = existing.items || [];
        const existingCodeMap = new Map(existingItems.map((it) => [it.itemCode.toLowerCase(), it]));
        const itemsToSave = [];
        for (const itemDto of itemsData) {
            if (!itemDto.itemCode)
                continue;
            const key = itemDto.itemCode.toLowerCase().trim();
            const target = existingCodeMap.get(key);
            if (target) {
                target.quantity = (target.quantity || 0) + (itemDto.quantity || 1);
                if (itemDto.itemCodeId)
                    target.itemCodeId = itemDto.itemCodeId;
                if (itemDto.sku)
                    target.sku = itemDto.sku;
                if (itemDto.firmwareVersion)
                    target.firmwareVersion = itemDto.firmwareVersion;
                if (itemDto.templateId)
                    target.templateId = itemDto.templateId;
                if (itemDto.notes)
                    target.notes = itemDto.notes;
                if (itemDto.metadata)
                    target.metadata = { ...target.metadata, ...itemDto.metadata };
                target.updatedAt = new Date();
                itemsToSave.push(target);
            }
            else {
                const newItem = itemRepo.create({
                    ...itemDto,
                    salesOrderId: existing.id,
                    quantity: itemDto.quantity !== undefined ? itemDto.quantity : 1,
                    firmwareVersion: itemDto.firmwareVersion ? (0, item_code_utils_1.sanitizeFirmwareVersion)(itemDto.firmwareVersion) : '1',
                    status: itemDto.status || sales_order_item_entity_1.SalesOrderItemStatus.PENDING,
                    testedQuantity: 0,
                    passedQuantity: 0,
                    failedQuantity: 0,
                    metadata: itemDto.metadata || {},
                });
                itemsToSave.push(newItem);
                existingCodeMap.set(key, newItem);
            }
        }
        if (itemsToSave.length > 0) {
            await itemRepo.save(itemsToSave);
        }
        return (await this.findById(existing.id));
    }
    async findTemplateForSku(sku, firmwareVersion) {
        if (!sku || sku.trim() === '') {
            return {
                matched: false,
                matchType: 'NONE',
                template: null,
                message: 'Device SKU is required for template matching',
            };
        }
        const cleanSkuStr = sku.trim();
        const cleanFwStr = firmwareVersion ? (0, item_code_utils_1.sanitizeFirmwareVersion)(firmwareVersion) : '1';
        const templateRepo = this.getTemplateRepo();
        try {
            const exactMatch = await templateRepo
                .createQueryBuilder('t')
                .leftJoinAndSelect('t.assertions', 'assertions')
                .where('LOWER(t.sku) = LOWER(:sku)', { sku: cleanSkuStr })
                .andWhere('t.firmwareVersion = :fw', { fw: cleanFwStr })
                .andWhere('t.isActive = :active', { active: true })
                .getOne();
            if (exactMatch) {
                return {
                    matched: true,
                    matchType: 'EXACT',
                    template: exactMatch,
                    message: `Exact template match found: ${exactMatch.name} (${exactMatch.code})`,
                };
            }
            const baseMatch = await templateRepo
                .createQueryBuilder('t')
                .leftJoinAndSelect('t.assertions', 'assertions')
                .where('LOWER(t.sku) = LOWER(:sku)', { sku: cleanSkuStr })
                .andWhere('t.isActive = :active', { active: true })
                .orderBy('t.createdAt', 'DESC')
                .getOne();
            if (baseMatch) {
                return {
                    matched: true,
                    matchType: 'SKU_FALLBACK',
                    template: baseMatch,
                    message: `SKU base match found: ${baseMatch.name} (FW: ${baseMatch.firmwareVersion})`,
                };
            }
        }
        catch (err) {
            this.logger.warn(`Error querying test_templates: ${err.message}`);
        }
        return {
            matched: false,
            matchType: 'NONE',
            template: null,
            message: `No active test template matched for SKU '${cleanSkuStr}'`,
        };
    }
    async findTestSessionForItem(soCode, itemCode) {
        try {
            const ds = this.getDataSource();
            const sessions = await ds.query(`SELECT * FROM "test_sessions" WHERE "soCode" = $1 AND "itemCode" = $2 ORDER BY "createdAt" DESC LIMIT 1`, [soCode.trim(), itemCode.trim()]);
            return sessions && sessions.length > 0 ? sessions[0] : null;
        }
        catch (err) {
            this.logger.debug(`Could not query test_sessions table: ${err.message}`);
            return null;
        }
    }
};
exports.SalesOrdersRepository = SalesOrdersRepository;
exports.SalesOrdersRepository = SalesOrdersRepository = SalesOrdersRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], SalesOrdersRepository);
//# sourceMappingURL=sales-orders.repository.js.map