import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { SalesOrderEntity, SalesOrderStatus, SalesOrderSource } from './entities/sales-order.entity';
import { SalesOrderItemEntity, SalesOrderItemStatus } from './entities/sales-order-item.entity';
import { TestTemplateEntity } from '../test-builder/entities/test-template.entity';
import { ItemCodeEntity } from '../item-codes/entities/item-code.entity';
import { sanitizeFirmwareVersion } from '../item-codes/item-code-utils';
import { QuerySalesOrderDto } from './dto/sales-order.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class SalesOrdersRepository {
  private readonly logger = new Logger(SalesOrdersRepository.name);

  constructor(private readonly dbService: DynamicDatabaseService) {}

  public getSoRepo(): Repository<SalesOrderEntity> {
    return this.dbService.getRepositoryForTable('sales_orders', SalesOrderEntity);
  }

  public getItemRepo(): Repository<SalesOrderItemEntity> {
    return this.dbService.getRepositoryForTable('sales_order_items', SalesOrderItemEntity);
  }

  public getTemplateRepo(): Repository<TestTemplateEntity> {
    return this.dbService.getRepositoryForTable('test_templates', TestTemplateEntity);
  }

  public getItemCodeRepo(): Repository<ItemCodeEntity> {
    return this.dbService.getRepositoryForTable('item_codes', ItemCodeEntity);
  }

  public getDataSource(): DataSource {
    return this.dbService.getDataSourceForTable('sales_orders');
  }

  public async findWithPagination(query: QuerySalesOrderDto): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
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
      const testProgress =
        totalQuantity > 0 ? Math.min(100, Math.round((testedQuantity / totalQuantity) * 100)) : 0;

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

  public async findById(id: string): Promise<SalesOrderEntity | null> {
    if (!id) return null;

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

  public async findBySoCode(soCode: string): Promise<SalesOrderEntity | null> {
    if (!soCode) return null;

    return await this.getSoRepo()
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.items', 'items')
      .leftJoinAndSelect('items.template', 'template')
      .leftJoinAndSelect('items.itemCodeRef', 'itemCodeRef')
      .where('so.soCode = :soCode', { soCode: soCode.trim() })
      .getOne();
  }

  public async createSalesOrder(
    soData: Partial<SalesOrderEntity>,
    itemsData: Partial<SalesOrderItemEntity>[] = [],
  ): Promise<SalesOrderEntity> {
    const soRepo = this.getSoRepo();
    const itemRepo = this.getItemRepo();

    const newSo = soRepo.create({
      ...soData,
      status: soData.status || SalesOrderStatus.DRAFT,
      source: soData.source || SalesOrderSource.MANUAL,
      orderDate: soData.orderDate || new Date(),
      metadata: soData.metadata || {},
    });

    const savedSo = await soRepo.save(newSo);

    if (itemsData.length > 0) {
      const itemsToCreate = itemsData.map((item) =>
        itemRepo.create({
          ...item,
          salesOrderId: savedSo.id,
          quantity: item.quantity !== undefined ? item.quantity : 1,
          firmwareVersion: item.firmwareVersion || '1.0',
          status: item.status || SalesOrderItemStatus.PENDING,
          testedQuantity: item.testedQuantity || 0,
          passedQuantity: item.passedQuantity || 0,
          failedQuantity: item.failedQuantity || 0,
          metadata: item.metadata || {},
        }),
      );
      await itemRepo.save(itemsToCreate);
    }

    return (await this.findById(savedSo.id))!;
  }

  public async updateSalesOrder(
    id: string,
    soData: Partial<SalesOrderEntity>,
    itemsData?: Partial<SalesOrderItemEntity>[],
  ): Promise<SalesOrderEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales Order [${id}] not found`);
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

      const itemsToSave: SalesOrderItemEntity[] = [];
      const processedItemIds = new Set<string>();

      for (const itemDto of itemsData) {
        let targetItem: SalesOrderItemEntity | undefined;

        if (itemDto.id && existingItemMap.has(itemDto.id)) {
          targetItem = existingItemMap.get(itemDto.id);
        } else if (itemDto.itemCode && existingCodeMap.has(itemDto.itemCode)) {
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
        } else {
          const newItem = itemRepo.create({
            ...itemDto,
            salesOrderId: savedSo.id,
            quantity: itemDto.quantity !== undefined ? itemDto.quantity : 1,
            firmwareVersion: itemDto.firmwareVersion || '1.0',
            status: itemDto.status || SalesOrderItemStatus.PENDING,
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

      // Remove items not present in update payload
      const itemsToDelete = existingItems.filter((it) => !processedItemIds.has(it.id));
      if (itemsToDelete.length > 0) {
        await itemRepo.remove(itemsToDelete);
      }
    }

    return (await this.findById(savedSo.id))!;
  }

  public async deleteSalesOrder(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales Order [${id}] not found`);
    }
    await this.getSoRepo().remove(existing);
    return true;
  }

  public async findItem(salesOrderId: string, itemCode: string): Promise<SalesOrderItemEntity | null> {
    return await this.getItemRepo().findOne({
      where: { salesOrderId, itemCode },
      relations: ['template', 'salesOrder', 'itemCodeRef'],
    });
  }

  public async findItemCodeById(id: string): Promise<ItemCodeEntity | null> {
    if (!id || !UUID_REGEX.test(id)) return null;
    return await this.getItemCodeRepo().findOne({
      where: { id },
      relations: ['defaultTemplate'],
    });
  }

  public async findItemCodeByCode(itemCode: string): Promise<ItemCodeEntity | null> {
    if (!itemCode) return null;
    return await this.getItemCodeRepo()
      .createQueryBuilder('ic')
      .leftJoinAndSelect('ic.defaultTemplate', 'defaultTemplate')
      .where('LOWER(ic.itemCode) = LOWER(:itemCode)', { itemCode: itemCode.trim() })
      .getOne();
  }

  public async attachItemsToSalesOrder(
    salesOrderId: string,
    itemsData: Partial<SalesOrderItemEntity>[],
  ): Promise<SalesOrderEntity> {
    const existing = await this.findById(salesOrderId);
    if (!existing) {
      throw new NotFoundException(`Sales Order [${salesOrderId}] not found`);
    }

    const itemRepo = this.getItemRepo();
    const existingItems = existing.items || [];
    const existingCodeMap = new Map(existingItems.map((it) => [it.itemCode.toLowerCase(), it]));

    const itemsToSave: SalesOrderItemEntity[] = [];

    for (const itemDto of itemsData) {
      if (!itemDto.itemCode) continue;
      const key = itemDto.itemCode.toLowerCase().trim();
      const target = existingCodeMap.get(key);

      if (target) {
        // Increment quantity and update fields
        target.quantity = (target.quantity || 0) + (itemDto.quantity || 1);
        if (itemDto.itemCodeId) target.itemCodeId = itemDto.itemCodeId;
        if (itemDto.sku) target.sku = itemDto.sku;
        if (itemDto.firmwareVersion) target.firmwareVersion = itemDto.firmwareVersion;
        if (itemDto.templateId) target.templateId = itemDto.templateId;
        if (itemDto.notes) target.notes = itemDto.notes;
        if (itemDto.metadata) target.metadata = { ...target.metadata, ...itemDto.metadata };
        target.updatedAt = new Date();
        itemsToSave.push(target);
      } else {
        const newItem = itemRepo.create({
          ...itemDto,
          salesOrderId: existing.id,
          quantity: itemDto.quantity !== undefined ? itemDto.quantity : 1,
          firmwareVersion: itemDto.firmwareVersion || '1.0',
          status: itemDto.status || SalesOrderItemStatus.PENDING,
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

    return (await this.findById(existing.id))!;
  }

  public async findTemplateForSku(
    sku: string,
    firmwareVersion?: string,
  ): Promise<{
    matched: boolean;
    matchType: 'EXACT' | 'SKU_FALLBACK' | 'NONE';
    template: TestTemplateEntity | null;
    message: string;
  }> {
    if (!sku || sku.trim() === '') {
      return {
        matched: false,
        matchType: 'NONE',
        template: null,
        message: 'Device SKU is required for template matching',
      };
    }

    const cleanSkuStr = sku.trim();
    const cleanFwStr = firmwareVersion ? sanitizeFirmwareVersion(firmwareVersion) : '1.0';
    const templateRepo = this.getTemplateRepo();

    try {
      // 1. SKU + FW exact match
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

      // 2. SKU base match
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
    } catch (err: any) {
      this.logger.warn(`Error querying test_templates: ${err.message}`);
    }

    return {
      matched: false,
      matchType: 'NONE',
      template: null,
      message: `No active test template matched for SKU '${cleanSkuStr}'`,
    };
  }

  public async findTestSessionForItem(soCode: string, itemCode: string): Promise<any | null> {
    try {
      const ds = this.getDataSource();
      const sessions = await ds.query(
        `SELECT * FROM "test_sessions" WHERE "soCode" = $1 AND "itemCode" = $2 ORDER BY "createdAt" DESC LIMIT 1`,
        [soCode.trim(), itemCode.trim()],
      );
      return sessions && sessions.length > 0 ? sessions[0] : null;
    } catch (err: any) {
      this.logger.debug(`Could not query test_sessions table: ${err.message}`);
      return null;
    }
  }
}
