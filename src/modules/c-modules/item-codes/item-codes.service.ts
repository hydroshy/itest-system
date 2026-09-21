import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ItemCodesRepository } from './item-codes.repository';
import { ItemCodeEntity } from './entities/item-code.entity';
import {
  CreateItemCodeDto,
  UpdateItemCodeDto,
  QueryItemCodeDto,
  ItemCodePickerItemDto,
} from './dto/item-code.dto';
import {
  formatSkuFw,
  sanitizeFirmwareVersion,
} from './item-code-utils';

@Injectable()
export class ItemCodesService {
  private readonly logger = new Logger(ItemCodesService.name);

  constructor(private readonly repository: ItemCodesRepository) {}

  public async findAll(query: QueryItemCodeDto) {
    return await this.repository.findWithPagination(query);
  }

  public async findPicker(search?: string): Promise<ItemCodePickerItemDto[]> {
    return await this.repository.findPickerItems(search);
  }

  public async findOne(id: string): Promise<ItemCodeEntity> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException(`Item Code [${id}] not found`);
    }
    return item;
  }

  public async create(dto: CreateItemCodeDto): Promise<ItemCodeEntity> {
    const itemCode = (dto.itemCode || '').trim();
    if (!itemCode) {
      throw new BadRequestException('Item Code is required');
    }

    const existing = await this.repository.findByItemCode(itemCode);
    if (existing) {
      throw new ConflictException(`Item Code '${itemCode}' already exists in catalog`);
    }

    const sku = (dto.sku || '').trim().toUpperCase();
    if (!sku) {
      throw new BadRequestException('Device SKU is required');
    }

    const firmwareVersion = sanitizeFirmwareVersion(dto.firmwareVersion);
    const skuFw = formatSkuFw(sku, firmwareVersion);

    let defaultTemplateId = dto.defaultTemplateId;
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

  public async update(id: string, dto: UpdateItemCodeDto): Promise<ItemCodeEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Item Code [${id}] not found`);
    }

    if (dto.itemCode && dto.itemCode.trim() !== existing.itemCode) {
      const conflict = await this.repository.findByItemCode(dto.itemCode.trim());
      if (conflict && conflict.id !== existing.id) {
        throw new ConflictException(`Item Code '${dto.itemCode.trim()}' already exists`);
      }
    }

    const updatedSku = dto.sku ? dto.sku.trim().toUpperCase() : existing.sku;
    const updatedFw =
      dto.firmwareVersion !== undefined
        ? sanitizeFirmwareVersion(dto.firmwareVersion)
        : existing.firmwareVersion;
    const updatedSkuFw = formatSkuFw(updatedSku, updatedFw);

    let updatedTemplateId =
      dto.defaultTemplateId !== undefined ? dto.defaultTemplateId : existing.defaultTemplateId;

    if (!updatedTemplateId && (dto.sku || dto.firmwareVersion)) {
      const match = await this.repository.findMatchingTemplate(updatedSku, updatedFw);
      if (match) {
        updatedTemplateId = match.id;
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

  public async remove(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Item Code [${id}] not found`);
    }

    const usageCount = await this.repository.countSalesOrderItems(existing.id);
    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete Item Code '${existing.itemCode}' as it is referenced by ${usageCount} Sales Order line(s). Deactivate it instead.`,
      );
    }

    await this.repository.deleteItemCode(existing.id);
    return {
      success: true,
      message: `Item Code '${existing.itemCode}' deleted successfully`,
      id: existing.id,
    };
  }
}
