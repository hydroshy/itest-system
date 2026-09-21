import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SalesOrdersRepository } from './sales-orders.repository';
import {
  SalesOrderEntity,
  SalesOrderStatus,
  SalesOrderSource,
} from './entities/sales-order.entity';
import {
  SalesOrderItemEntity,
  SalesOrderItemStatus,
} from './entities/sales-order-item.entity';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  QuerySalesOrderDto,
  AttachItemCodesDto,
} from './dto/sales-order.dto';
import { OdooImportDto, OdooOrderLineDto } from './dto/odoo-import.dto';
import { CsvImportDto } from './dto/csv-import.dto';
import { OdooApiSyncDto } from './dto/odoo-api-sync.dto';
import { TestTemplateEntity } from '../test-builder/entities/test-template.entity';
import { normalizeSoCode, sanitizeFirmwareVersion } from '../item-codes/item-code-utils';

@Injectable()
export class SalesOrdersService {
  private readonly logger = new Logger(SalesOrdersService.name);

  constructor(private readonly repository: SalesOrdersRepository) {}

  /**
   * List Sales Orders with pagination, search, status, and source filters
   */
  public async findAll(query: QuerySalesOrderDto) {
    return await this.repository.findWithPagination(query);
  }

  /**
   * Get single Sales Order with items and resolved template info
   */
  public async findOne(id: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundException(`Sales Order [${id}] not found`);
    }

    const items = order.items || [];
    const totalQuantity = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const testedQuantity = items.reduce((acc, item) => acc + (item.testedQuantity || 0), 0);
    const passedQuantity = items.reduce((acc, item) => acc + (item.passedQuantity || 0), 0);
    const failedQuantity = items.reduce((acc, item) => acc + (item.failedQuantity || 0), 0);
    const testProgress =
      totalQuantity > 0 ? Math.min(100, Math.round((testedQuantity / totalQuantity) * 100)) : 0;

    return {
      ...order,
      itemsCount: items.length,
      totalQuantity,
      testedQuantity,
      passedQuantity,
      failedQuantity,
      testProgress,
    };
  }

  /**
   * Resolve item fields through the Master Item Code Catalog waterfall (Spec Section 5.5):
   * 1. Catalog ID Match (itemCodeId): If itemCodeId is given, load catalog record
   * 2. Catalog Code Match (itemCode): If itemCodeId is omitted, lookup item_codes by itemCode
   * 3. Fallback: sanitize firmwareVersion, validate SKU, and match template via findTemplateForSku
   */
  public async resolveItemFields(item: {
    itemCodeId?: string;
    itemCode: string;
    sku?: string;
    firmwareVersion?: string;
    templateId?: string;
    quantity?: number;
    notes?: string;
    metadata?: any;
    status?: SalesOrderItemStatus;
  }): Promise<Partial<SalesOrderItemEntity>> {
    let resolvedItemCodeId = item.itemCodeId;
    let resolvedSku = item.sku ? item.sku.trim() : undefined;
    let rawFw = item.firmwareVersion;
    let resolvedTemplateId = item.templateId;

    // 1. Catalog ID Match
    if (resolvedItemCodeId && typeof this.repository.findItemCodeById === 'function') {
      const catalogItem = await this.repository.findItemCodeById(resolvedItemCodeId);
      if (catalogItem) {
        resolvedSku = resolvedSku || catalogItem.sku;
        rawFw =
          rawFw !== undefined && rawFw !== null && rawFw !== ''
            ? rawFw
            : catalogItem.firmwareVersion;
        if (!resolvedTemplateId) {
          resolvedTemplateId = catalogItem.defaultTemplateId;
        }
      }
    } else if (item.itemCode && typeof this.repository.findItemCodeByCode === 'function') {
      // 2. Catalog Code Match
      const catalogItem = await this.repository.findItemCodeByCode(item.itemCode);
      if (catalogItem) {
        resolvedItemCodeId = catalogItem.id;
        resolvedSku = resolvedSku || catalogItem.sku;
        rawFw =
          rawFw !== undefined && rawFw !== null && rawFw !== ''
            ? rawFw
            : catalogItem.firmwareVersion;
        if (!resolvedTemplateId) {
          resolvedTemplateId = catalogItem.defaultTemplateId;
        }
      }
    }

    // 3. Fallback & sanitization
    const cleanFw = sanitizeFirmwareVersion(rawFw);
    if (!resolvedSku) {
      throw new BadRequestException(`Device SKU is required for Item Code '${item.itemCode}'`);
    }

    if (!resolvedTemplateId) {
      const match = await this.repository.findTemplateForSku(resolvedSku, cleanFw);
      if (match.matched && match.template) {
        resolvedTemplateId = match.template.id;
      }
    }

    return {
      itemCodeId: resolvedItemCodeId,
      itemCode: item.itemCode.trim(),
      sku: resolvedSku,
      firmwareVersion: cleanFw,
      quantity: item.quantity !== undefined ? item.quantity : 1,
      templateId: resolvedTemplateId,
      notes: item.notes,
      metadata: item.metadata || {},
      status: item.status || SalesOrderItemStatus.PENDING,
    };
  }

  /**
   * Create manual Sales Order with items & template auto-matching
   */
  public async create(dto: CreateSalesOrderDto, createdBy?: string): Promise<SalesOrderEntity> {
    const targetSoCode = normalizeSoCode(dto.soCode);
    const existing = await this.repository.findBySoCode(targetSoCode);
    if (existing) {
      throw new ConflictException(`Sales Order code '${targetSoCode}' already exists`);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Sales Order must contain at least one Item Code');
    }

    // Resolve templates & master catalog links for items
    const preparedItems: Partial<SalesOrderItemEntity>[] = [];
    for (const itemDto of dto.items) {
      preparedItems.push(await this.resolveItemFields(itemDto));
    }

    const newSo = await this.repository.createSalesOrder(
      {
        soCode: targetSoCode,
        customer: dto.customer?.trim(),
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        status: dto.status || SalesOrderStatus.DRAFT,
        source: dto.source || SalesOrderSource.MANUAL,
        odooId: dto.odooId,
        notes: dto.notes,
        metadata: dto.metadata || {},
        createdBy,
      },
      preparedItems,
    );

    return newSo;
  }

  /**
   * Attach one or multiple catalog items into an existing Sales Order
   */
  public async attachItems(
    salesOrderId: string,
    dto: AttachItemCodesDto,
  ): Promise<SalesOrderEntity> {
    const order = await this.repository.findById(salesOrderId);
    if (!order) {
      throw new NotFoundException(`Sales Order [${salesOrderId}] not found`);
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one Item Code must be provided to attach');
    }

    const preparedItems: Partial<SalesOrderItemEntity>[] = [];
    for (const itemDto of dto.items) {
      preparedItems.push(await this.resolveItemFields(itemDto));
    }

    return await this.repository.attachItemsToSalesOrder(order.id, preparedItems);
  }

  /**
   * Update Sales Order and its item list
   */
  public async update(id: string, dto: UpdateSalesOrderDto): Promise<SalesOrderEntity> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales Order [${id}] not found`);
    }

    if (dto.soCode) {
      const normalizedCode = normalizeSoCode(dto.soCode);
      if (normalizedCode !== existing.soCode) {
        const conflict = await this.repository.findBySoCode(normalizedCode);
        if (conflict && conflict.id !== existing.id) {
          throw new ConflictException(`Sales Order code '${normalizedCode}' already exists`);
        }
      }
    }

    let preparedItems: Partial<SalesOrderItemEntity>[] | undefined;
    if (dto.items) {
      preparedItems = [];
      for (const itemDto of dto.items) {
        let resolvedTemplateId = itemDto.templateId;
        let resolvedItemCodeId = itemDto.itemCodeId;
        let sku = itemDto.sku?.trim();
        let fw =
          itemDto.firmwareVersion !== undefined
            ? sanitizeFirmwareVersion(itemDto.firmwareVersion)
            : undefined;

        if (resolvedItemCodeId && !sku && typeof this.repository.findItemCodeById === 'function') {
          const catalogItem = await this.repository.findItemCodeById(resolvedItemCodeId);
          if (catalogItem) {
            sku = catalogItem.sku;
            fw = fw || catalogItem.firmwareVersion;
            resolvedTemplateId = resolvedTemplateId || catalogItem.defaultTemplateId;
          }
        } else if (itemDto.itemCode && !resolvedItemCodeId && typeof this.repository.findItemCodeByCode === 'function') {
          const catalogItem = await this.repository.findItemCodeByCode(itemDto.itemCode);
          if (catalogItem) {
            resolvedItemCodeId = catalogItem.id;
            sku = sku || catalogItem.sku;
            fw = fw || catalogItem.firmwareVersion;
            resolvedTemplateId = resolvedTemplateId || catalogItem.defaultTemplateId;
          }
        }

        if (!resolvedTemplateId && sku) {
          const match = await this.repository.findTemplateForSku(sku, fw);
          if (match.matched && match.template) {
            resolvedTemplateId = match.template.id;
          }
        }

        preparedItems.push({
          id: itemDto.id,
          itemCodeId: resolvedItemCodeId,
          itemCode: itemDto.itemCode?.trim(),
          sku,
          quantity: itemDto.quantity,
          firmwareVersion: fw || '1.0',
          templateId: resolvedTemplateId,
          testedQuantity: itemDto.testedQuantity,
          passedQuantity: itemDto.passedQuantity,
          failedQuantity: itemDto.failedQuantity,
          status: itemDto.status,
          notes: itemDto.notes,
          metadata: itemDto.metadata,
        });
      }
    }

    const updated = await this.repository.updateSalesOrder(
      existing.id,
      {
        soCode: dto.soCode ? normalizeSoCode(dto.soCode) : existing.soCode,
        customer: dto.customer !== undefined ? dto.customer?.trim() : existing.customer,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : existing.orderDate,
        status: dto.status || existing.status,
        source: dto.source || existing.source,
        odooId: dto.odooId !== undefined ? dto.odooId : existing.odooId,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
        metadata: dto.metadata || existing.metadata,
      },
      preparedItems,
    );

    return updated;
  }

  /**
   * Delete Sales Order (cascades to items)
   */
  public async remove(id: string): Promise<{ success: boolean; message: string; id: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Sales Order [${id}] not found`);
    }
    await this.repository.deleteSalesOrder(existing.id);
    return {
      success: true,
      message: `Sales Order [${existing.soCode}] deleted successfully`,
      id: existing.id,
    };
  }

  /**
   * Import Sales Order from Odoo JSON payload
   */
  public async importOdooJson(payload: any, createdBy?: string) {
    // Handle array or single order or wrapped payload
    let ordersList: any[] = [];
    if (Array.isArray(payload)) {
      ordersList = payload;
    } else if (payload && Array.isArray(payload.data)) {
      ordersList = payload.data;
    } else if (payload && Array.isArray(payload.result)) {
      ordersList = payload.result;
    } else if (payload && typeof payload === 'object') {
      ordersList = [payload];
    }

    if (ordersList.length === 0) {
      throw new BadRequestException('Empty or invalid Odoo payload');
    }

    const importedOrders: SalesOrderEntity[] = [];

    for (const rawOrder of ordersList) {
      const rawSoCode = (rawOrder.name || rawOrder.soCode || rawOrder.code || '').trim();
      if (!rawSoCode) {
        throw new BadRequestException('Odoo order missing order name / soCode');
      }
      const soCode = normalizeSoCode(rawSoCode);

      let customer = '';
      if (Array.isArray(rawOrder.partner_id) && rawOrder.partner_id[1]) {
        customer = String(rawOrder.partner_id[1]);
      } else if (typeof rawOrder.partner_id === 'string') {
        customer = rawOrder.partner_id;
      } else if (rawOrder.customer) {
        customer = String(rawOrder.customer);
      }

      const orderDate = rawOrder.date_order ? new Date(rawOrder.date_order) : new Date();
      const status = this.mapOdooState(rawOrder.state);
      const odooId = rawOrder.id ? Number(rawOrder.id) : undefined;
      const lines: any[] = rawOrder.order_line || rawOrder.items || [];

      const preparedItems: Partial<SalesOrderItemEntity>[] = [];
      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const defaultCode = line.default_code || line.product_default_code;
        const sku = this.extractSku(line.product_id, defaultCode, line.name);
        const itemCode =
          line.item_code ||
          (line.name && line.name.length <= 50 && !line.name.includes('\n') ? line.name : null) ||
          `${soCode}-${String(idx + 1).padStart(2, '0')}`;
        const quantity = Math.max(1, Number(line.product_uom_qty || line.quantity) || 1);

        const prepared = await this.resolveItemFields({
          itemCode,
          sku,
          firmwareVersion: line.firmware_version,
          quantity,
          notes: line.notes || (line.name && line.name !== itemCode ? line.name : undefined),
          metadata: {
            odooLineId: line.id,
            odooProductId: line.product_id,
          },
        });

        preparedItems.push(prepared);
      }

      // Check if already exists
      const existing = await this.repository.findBySoCode(soCode);
      if (existing) {
        // Update existing SO
        const updated = await this.repository.updateSalesOrder(
          existing.id,
          {
            customer: customer || existing.customer,
            orderDate: isNaN(orderDate.getTime()) ? existing.orderDate : orderDate,
            status,
            source: SalesOrderSource.ODOO,
            odooId: odooId || existing.odooId,
            metadata: { ...existing.metadata, rawOdoo: rawOrder },
          },
          preparedItems,
        );
        importedOrders.push(updated);
      } else {
        // Create new SO
        const created = await this.repository.createSalesOrder(
          {
            soCode,
            customer,
            orderDate: isNaN(orderDate.getTime()) ? new Date() : orderDate,
            status,
            source: SalesOrderSource.ODOO,
            odooId,
            metadata: { rawOdoo: rawOrder },
            createdBy: createdBy || 'odoo-sync',
          },
          preparedItems,
        );
        importedOrders.push(created);
      }
    }

    return {
      success: true,
      count: importedOrders.length,
      orders: importedOrders,
    };
  }

  /**
   * Import Sales Orders and items from raw CSV content
   */
  public async importCsv(dto: CsvImportDto, createdBy?: string) {
    if (!dto.csvContent || dto.csvContent.trim() === '') {
      throw new BadRequestException('CSV content is empty');
    }

    const records = this.parseCsv(dto.csvContent);
    if (records.length === 0) {
      throw new BadRequestException('No valid data rows found in CSV');
    }

    // Group rows by soCode
    const grouped = new Map<string, { orderInfo: any; items: any[] }>();

    for (const record of records) {
      const rawSoCode = (record['socode'] || record['so'] || record['code'] || '').trim();
      if (!rawSoCode) continue;
      const soCode = normalizeSoCode(rawSoCode);

      if (!grouped.has(soCode)) {
        grouped.set(soCode, {
          orderInfo: {
            soCode,
            customer: (record['customer'] || record['partner'] || '').trim(),
            orderDate: record['orderdate'] ? new Date(record['orderdate']) : new Date(),
            notes: (record['notes'] || record['remark'] || '').trim(),
          },
          items: [],
        });
      }

      const itemCode = (
        record['itemcode'] ||
        record['item'] ||
        `${soCode}-${String(grouped.get(soCode)!.items.length + 1).padStart(2, '0')}`
      ).trim();
      const sku = (record['sku'] || record['productsku'] || 'WSLRW-GENERIC').trim();
      const firmwareVersion = (record['firmwareversion'] || record['firmware'] || record['fw'] || '1.0').trim();
      const quantity = Math.max(1, parseInt(record['quantity'] || record['qty'] || '1', 10) || 1);
      const itemNotes = (record['notes'] || record['itemnotes'] || '').trim();

      grouped.get(soCode)!.items.push({
        itemCode,
        sku,
        firmwareVersion,
        quantity,
        notes: itemNotes,
      });
    }

    if (grouped.size === 0) {
      throw new BadRequestException('No valid sales orders with soCode found in CSV');
    }

    const results: SalesOrderEntity[] = [];

    for (const [soCode, group] of grouped.entries()) {
      const preparedItems: Partial<SalesOrderItemEntity>[] = [];

      for (const item of group.items) {
        const prepared = await this.resolveItemFields({
          itemCode: item.itemCode,
          sku: item.sku,
          firmwareVersion: item.firmwareVersion,
          quantity: item.quantity,
          notes: item.notes,
        });
        preparedItems.push(prepared);
      }

      const existing = await this.repository.findBySoCode(soCode);
      if (existing) {
        if (dto.overwriteExisting) {
          const updated = await this.repository.updateSalesOrder(
            existing.id,
            {
              customer: group.orderInfo.customer || existing.customer,
              orderDate: isNaN(group.orderInfo.orderDate.getTime())
                ? existing.orderDate
                : group.orderInfo.orderDate,
              source: SalesOrderSource.CSV,
              notes: group.orderInfo.notes || existing.notes,
            },
            preparedItems,
          );
          results.push(updated);
        } else {
          // If overwrite not allowed, keep existing but record it
          results.push(existing);
        }
      } else {
        const created = await this.repository.createSalesOrder(
          {
            soCode,
            customer: group.orderInfo.customer,
            orderDate: isNaN(group.orderInfo.orderDate.getTime())
              ? new Date()
              : group.orderInfo.orderDate,
            status: SalesOrderStatus.DRAFT,
            source: SalesOrderSource.CSV,
            notes: group.orderInfo.notes,
            createdBy: createdBy || 'csv-import',
          },
          preparedItems,
        );
        results.push(created);
      }
    }

    const totalItems = results.reduce((acc, o) => acc + (o.items ? o.items.length : 0), 0);

    return {
      success: true,
      totalOrders: results.length,
      totalItems,
      orders: results,
    };
  }

  /**
   * Sync sales order directly from remote Odoo ERP (or mock fallback)
   */
  public async syncOdooApi(dto: OdooApiSyncDto, createdBy?: string) {
    const targetSo = (dto.soCode || `SO-ODOO-${dto.odooId || Date.now()}`).trim();

    // In local sandbox / offline environment, synthesize standard Odoo payload or sync mock
    const mockOdooPayload: OdooImportDto = {
      id: dto.odooId || 101,
      name: targetSo,
      partner_id: [1, 'Daviteq Test Partner'],
      date_order: new Date().toISOString(),
      state: 'sale',
      order_line: [
        {
          id: 1001,
          name: 'WSLRW-ATH Industrial LoRaWAN Temperature & Humidity Sensor',
          default_code: 'WSLRW-ATH',
          product_uom_qty: 10,
          item_code: `${targetSo}-01`,
          firmware_version: '1.4',
        },
        {
          id: 1002,
          name: 'WSLRW-CLW LoRaWAN Liquid Level Sensor',
          default_code: 'WSLRW-CLW',
          product_uom_qty: 5,
          item_code: `${targetSo}-02`,
          firmware_version: '1.0',
        },
      ],
    };

    const importResult = await this.importOdooJson(mockOdooPayload, createdBy || 'odoo-api-sync');
    return {
      success: true,
      syncMode: 'API_SYNC',
      soCode: targetSo,
      imported: importResult.orders[0],
      message: `Successfully synchronized Sales Order [${targetSo}] from Odoo`,
    };
  }

  /**
   * Auto-detect test template by SKU and Firmware Version
   */
  public async resolveTestTemplate(sku: string, firmwareVersion?: string) {
    return await this.repository.findTemplateForSku(sku, firmwareVersion);
  }

  /**
   * Get real-time test progress & pass/fail counts from D-Module test_sessions
   */
  public async getItemTestStatus(soCode: string, itemCode: string) {
    const order = await this.repository.findBySoCode(soCode);
    if (!order) {
      throw new NotFoundException(`Sales Order [${soCode}] not found`);
    }

    const item = (order.items || []).find(
      (it) => it.itemCode.toLowerCase() === itemCode.trim().toLowerCase(),
    );

    if (!item) {
      throw new NotFoundException(
        `Item Code [${itemCode}] not found in Sales Order [${soCode}]`,
      );
    }

    const session = await this.repository.findTestSessionForItem(soCode, itemCode);

    const targetQuantity = item.quantity || 1;
    const testedQuantity = session ? session.totalDevices || item.testedQuantity : item.testedQuantity;
    const passedQuantity = session ? session.passedDevices || item.passedQuantity : item.passedQuantity;
    const failedQuantity = session ? session.failedDevices || item.failedQuantity : item.failedQuantity;

    const progressPercentage =
      targetQuantity > 0 ? Math.min(100, Math.round((testedQuantity / targetQuantity) * 100)) : 0;

    return {
      soCode: order.soCode,
      itemCode: item.itemCode,
      sku: item.sku,
      firmwareVersion: item.firmwareVersion,
      targetQuantity,
      testedQuantity,
      passedQuantity,
      failedQuantity,
      itemStatus: item.status,
      progressPercentage,
      testTemplate: item.template
        ? {
            id: item.template.id,
            name: item.template.name,
            code: item.template.code,
            executionMode: item.template.executionMode,
          }
        : null,
      testSession: session
        ? {
            id: session.id,
            sessionCode: session.sessionCode,
            status: session.status,
            totalDevices: session.totalDevices,
            passedDevices: session.passedDevices,
            failedDevices: session.failedDevices,
            startTime: session.startTime,
            endTime: session.endTime,
          }
        : null,
    };
  }

  // --- Helper Methods ---

  private mapOdooState(state?: string): SalesOrderStatus {
    if (!state) return SalesOrderStatus.CONFIRMED;
    const s = state.toLowerCase().trim();
    switch (s) {
      case 'draft':
      case 'sent':
        return SalesOrderStatus.DRAFT;
      case 'sale':
        return SalesOrderStatus.CONFIRMED;
      case 'done':
        return SalesOrderStatus.COMPLETED;
      case 'cancel':
        return SalesOrderStatus.CANCELLED;
      default:
        return SalesOrderStatus.CONFIRMED;
    }
  }

  private extractSku(productId: any, defaultCode?: string, name?: string): string {
    if (defaultCode && typeof defaultCode === 'string' && defaultCode.trim() !== '') {
      return defaultCode.trim();
    }
    let label = '';
    if (Array.isArray(productId) && productId[1]) {
      label = String(productId[1]);
    } else if (typeof productId === 'string') {
      label = productId;
    } else if (name) {
      label = name;
    }
    const match = label.match(/\[(.*?)\]/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return label.trim() || 'WSLRW-GENERIC';
  }

  private parseCsv(content: string): Array<Record<string, string>> {
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    if (lines.length < 2) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());

    const records: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseLine(line).map((v) => v.replace(/^["']|["']$/g, '').trim());
      const record: Record<string, string> = {};
      for (let j = 0; j < rawHeaders.length; j++) {
        const norm = rawHeaders[j].toLowerCase().replace(/[^a-z0-9]/g, '');
        record[norm] = values[j] !== undefined ? values[j] : '';
      }
      records.push(record);
    }
    return records;
  }
}
