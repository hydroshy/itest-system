import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { ItemCodeEntity } from './entities/item-code.entity';
import { TestTemplateEntity } from '../test-builder/entities/test-template.entity';
import { SalesOrderItemEntity } from '../sales-orders/entities/sales-order-item.entity';
import { QueryItemCodeDto, ItemCodePickerItemDto } from './dto/item-code.dto';
import { sanitizeFirmwareVersion } from './item-code-utils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ItemCodesRepository {
  private readonly logger = new Logger(ItemCodesRepository.name);

  constructor(private readonly dbService: DynamicDatabaseService) {}

  public getRepo(): Repository<ItemCodeEntity> {
    return this.dbService.getRepositoryForTable('item_codes', ItemCodeEntity);
  }

  public getTemplateRepo(): Repository<TestTemplateEntity> {
    return this.dbService.getRepositoryForTable('test_templates', TestTemplateEntity);
  }

  public getSoItemRepo(): Repository<SalesOrderItemEntity> {
    return this.dbService.getRepositoryForTable('sales_order_items', SalesOrderItemEntity);
  }

  public async findWithPagination(query: QueryItemCodeDto): Promise<{
    data: ItemCodeEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
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
      qb.andWhere(
        '(ic.itemCode ILIKE :search OR ic.sku ILIKE :search OR ic.skuFw ILIKE :search OR ic.description ILIKE :search)',
        { search: searchPattern },
      );
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

  public async findPickerItems(search?: string): Promise<ItemCodePickerItemDto[]> {
    const qb = this.getRepo()
      .createQueryBuilder('ic')
      .leftJoinAndSelect('ic.defaultTemplate', 'defaultTemplate')
      .where('ic.isActive = :active', { active: true })
      .orderBy('ic.itemCode', 'ASC');

    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      qb.andWhere(
        '(ic.itemCode ILIKE :search OR ic.sku ILIKE :search OR ic.skuFw ILIKE :search OR ic.description ILIKE :search)',
        { search: searchPattern },
      );
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

  public async findById(id: string): Promise<ItemCodeEntity | null> {
    if (!id) return null;
    if (!UUID_REGEX.test(id)) {
      return this.findByItemCode(id);
    }

    return await this.getRepo().findOne({
      where: { id },
      relations: ['defaultTemplate'],
    });
  }

  public async findByItemCode(itemCode: string): Promise<ItemCodeEntity | null> {
    if (!itemCode) return null;
    return await this.getRepo()
      .createQueryBuilder('ic')
      .leftJoinAndSelect('ic.defaultTemplate', 'defaultTemplate')
      .where('LOWER(ic.itemCode) = LOWER(:itemCode)', { itemCode: itemCode.trim() })
      .getOne();
  }

  public async createItemCode(data: Partial<ItemCodeEntity>): Promise<ItemCodeEntity> {
    const repo = this.getRepo();
    const item = repo.create({
      ...data,
      metadata: data.metadata || {},
    });
    const saved = await repo.save(item);
    return (await this.findById(saved.id)) || saved;
  }

  public async updateItemCode(id: string, data: Partial<ItemCodeEntity>): Promise<ItemCodeEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Item Code [${id}] not found`);
    }
    const repo = this.getRepo();
    Object.assign(existing, {
      ...data,
      updatedAt: new Date(),
    });
    if (data.defaultTemplateId === null) {
      existing.defaultTemplateId = null as any;
      existing.defaultTemplate = null as any;
    } else if (data.defaultTemplateId !== undefined && data.defaultTemplateId !== existing.defaultTemplateId) {
      existing.defaultTemplate = undefined as any;
    }
    await repo.save(existing);
    return (await this.findById(id))!;
  }

  public async deleteItemCode(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException(`Item Code [${id}] not found`);
    }
    await this.getRepo().remove(existing);
    return true;
  }

  public async countSalesOrderItems(itemCodeId: string): Promise<number> {
    if (!itemCodeId) return 0;
    return await this.getSoItemRepo().count({
      where: { itemCodeId },
    });
  }

  public async findMatchingTemplate(sku: string, firmwareVersion: string): Promise<TestTemplateEntity | null> {
    if (!sku) return null;
    const cleanFw = sanitizeFirmwareVersion(firmwareVersion);
    return await this.getTemplateRepo()
      .createQueryBuilder('tt')
      .where('LOWER(tt.sku) = LOWER(:sku)', { sku: sku.trim() })
      .andWhere('tt.firmwareVersion = :fw', { fw: cleanFw })
      .andWhere('tt.isActive = :active', { active: true })
      .orderBy('tt.createdAt', 'DESC')
      .getOne();
  }
}
