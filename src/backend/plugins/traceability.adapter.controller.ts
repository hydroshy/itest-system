import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { DisClientService } from './dis-client/dis-client.service';
import { DisSoSearchQuery } from './dis-client/dis.types';
import { TraceabilitySoEntity } from '../core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../core-models/traceability-wa.entity';
import { TraceabilityOrderEntity } from '../core-models/traceability-order.entity';
import {
  TraceabilityDeviceEntity,
  TraceabilityTestResult,
  TraceabilityConfigStatus,
  TraceabilityDeviceStatus,
} from '../core-models/traceability-device.entity';
import { FinalConfigExecutionSessionEntity } from '../core-models/finalconfig-execution-session.entity';
import { FinalConfigExecutionLogEntity } from '../core-models/finalconfig-execution-log.entity';

export interface CreateSoDto {
  soNumber: string;
  customerName?: string;
  notes?: string;
}

export interface CreateWaDto {
  soId?: string;
  soNumber?: string;
  waNumber: string;
  itemCode?: string;
  plannedQuantity?: number;
  notes?: string;
}

export interface ImportTestedCsvDeviceItem {
  deviceKey?: string;
  devEui?: string;
  serialNumber: string;
  sku?: string;
  hwVersion?: string;
  fwVersion?: string;
  itemCode?: string;
  testResult?: string;
  testId?: string;
  testStation?: string;
  testPerson?: string;
  testedAt?: string | Date;
  testRawData?: Record<string, any>;
  [key: string]: any;
}

export interface ImportCsvDevicesDto {
  soId?: string;
  soNumber?: string;
  waId?: string;
  waNumber?: string;
  devices: ImportTestedCsvDeviceItem[];
}

export interface LinkSessionDto {
  serialNumber: string;
  finalConfigSessionId: string;
  configStatus?: 'PENDING' | 'CONFIGURED_PASS' | 'CONFIGURED_FAIL';
}

export interface UpdateDeviceStatusDto {
  statusType?: 'test' | 'final_config' | 'test_result' | 'config_status';
  status?: string; // 'PASS' | 'FAIL' | 'NONE' | 'PENDING'
  testResult?: string;
  configStatus?: string;
}

export interface UpdateDeviceDetailsDto {
  testResult?: string;
  testStation?: string;
  testPerson?: string;
  testedAt?: string;
  itemCode?: string;
  sku?: string;
  hwVersion?: string;
  fwVersion?: string;
  devEui?: string;
  configStatus?: string;
  testRawData?: Record<string, any>;
}

@Controller()
export class TraceabilityAdapterController {
  private readonly logger = new Logger(TraceabilityAdapterController.name);

  constructor(
    private readonly databaseService: DynamicDatabaseService,
    private readonly disClientService: DisClientService,
  ) {}

  @Get(['api/plugins/device-traceability/status', 'api/v1/plugins/device-traceability/status'])
  getStatus() {
    return {
      status: 'online',
      plugin: 'device-traceability',
      contractVersion: 'v2',
      disStatus: this.disClientService.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================
  // DIS (ODOO) SALES ORDER INTEGRATION
  // ==========================================

  @Get([
    'api/plugins/device-traceability/dis/status',
    'api/v1/plugins/device-traceability/dis/status',
    'api/dis/status',
  ])
  getDisStatus() {
    return this.disClientService.getStatus();
  }

  @Get([
    'api/plugins/device-traceability/dis/sales-orders/search',
    'api/v1/plugins/device-traceability/dis/sales-orders/search',
    'api/plugins/device-traceability/dis/so/search',
    'api/v1/plugins/device-traceability/dis/so/search',
    'api/dis/sales-orders/search',
    'api/dis/so/search',
    'api/v1/sales-orders/search',
  ])
  async searchDisOrders(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('states') states?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const query: DisSoSearchQuery = {
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      date_from: dateFrom,
      date_to: dateTo,
      states: states || 'sale',
      q,
      limit: limit ? Number(limit) : 25,
      cursor,
    };
    return this.disClientService.searchOrders(query);
  }

  @Get([
    'api/plugins/device-traceability/dis/sales-orders/:id',
    'api/v1/plugins/device-traceability/dis/sales-orders/:id',
    'api/plugins/device-traceability/dis/so/:id',
    'api/v1/plugins/device-traceability/dis/so/:id',
    'api/dis/sales-orders/:id',
    'api/dis/so/:id',
    'api/v1/sales-orders/:id',
  ])
  async getDisOrderDetail(@Param('id') id: string) {
    if (!id || !id.trim()) {
      throw new BadRequestException('Order id or name is required');
    }
    return this.disClientService.getOrderDetail(id.trim());
  }

  @Post([
    'api/plugins/device-traceability/dis/sales-orders/:id/sync',
    'api/v1/plugins/device-traceability/dis/sales-orders/:id/sync',
    'api/plugins/device-traceability/dis/so/:id/sync',
    'api/v1/plugins/device-traceability/dis/so/:id/sync',
    'api/dis/sales-orders/:id/sync',
    'api/dis/so/:id/sync',
    'api/v1/sales-orders/:id/sync',
  ])
  async syncDisOrderToTraceability(@Param('id') id: string) {
    if (!id || !id.trim()) {
      throw new BadRequestException('Order id or name is required');
    }

    const orderDetail = await this.disClientService.getOrderDetail(id.trim());
    if (!orderDetail) {
      throw new NotFoundException(`Sales Order ${id} not found in DIS`);
    }

    const soRepo = this.databaseService.getRepositoryForTable(
      'traceability_so',
      TraceabilitySoEntity,
    );
    const waRepo = this.databaseService.getRepositoryForTable(
      'traceability_wa',
      TraceabilityWaEntity,
    );

    const cleanSoNumber = orderDetail.name.trim();

    // 1. Find or create SO
    let so = await soRepo.findOne({ where: { so_number: cleanSoNumber } });
    const partnerEmail = orderDetail.partner_email ? orderDetail.partner_email.trim() : null;
    if (!so) {
      so = soRepo.create({
        so_number: cleanSoNumber,
        customer_name: orderDetail.partner_name ? orderDetail.partner_name.trim() : null,
        partner_email: partnerEmail,
        notes: [
          `DIS SO ID: ${orderDetail.id}`,
          partnerEmail ? `Email: ${partnerEmail}` : null,
          orderDetail.client_order_ref ? `Ref: ${orderDetail.client_order_ref}` : null,
          orderDetail.note ? `Note: ${orderDetail.note}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      });
      so = await soRepo.save(so);
      this.logger.log(`Created new SO ${so.so_number} from DIS sync`);
    } else {
      // Update customer name & notes if missing or updated
      let changed = false;
      if (orderDetail.partner_name && so.customer_name !== orderDetail.partner_name) {
        so.customer_name = orderDetail.partner_name;
        changed = true;
      }
      if (partnerEmail && so.partner_email !== partnerEmail) {
        so.partner_email = partnerEmail;
        changed = true;
      }
      if (changed) {
        so = await soRepo.save(so);
      }
    }

    // Helper to resolve item code with multi-level fallback
    const resolveItemCode = (line: any): string => {
      const explicitCode = (
        line.default_code ??
        line.ordering_code ??
        line.sku ??
        line.product_code ??
        line.item_code ??
        line.product?.sku ??
        line.product?.default_code ??
        line.product?.code ??
        ''
      ).trim();

      if (explicitCode && explicitCode !== 'N/A') return explicitCode;

      const textSources = [line.name, line.product_name, line.description, line.notes, line.product?.name];
      for (const text of textSources) {
        if (typeof text === 'string') {
          const match = text.match(/\[([A-Za-z0-9_.\-/]+)\]/);
          if (match && match[1]) return match[1].trim();
        }
      }

      if (line.product_id) return `PRODUCT-${line.product_id}`;
      return '';
    };

    // 2. Process product lines into Work Authorizations (WA)
    const detailAny = orderDetail as any;
    const rawLines = Array.isArray(detailAny.lines) && detailAny.lines.length > 0
      ? detailAny.lines
      : (Array.isArray(detailAny.items) && detailAny.items.length > 0
        ? detailAny.items
        : (Array.isArray(detailAny.order_line) ? detailAny.order_line : []));

    const productLines = rawLines.filter((line: any) => {
      const code = resolveItemCode(line);
      return (
        (line.line_type === 'product' || line.line_type === 'item' || !line.line_type) &&
        Boolean(code)
      );
    });

    const createdWas = [];
    const existingWas = await waRepo.find({ where: { so_id: so.id } });

    for (let i = 0; i < productLines.length; i++) {
      const line = productLines[i];
      const itemCode = resolveItemCode(line) || `PRODUCT-LINE-${i + 1}`;
      const plannedQty = Number(line.product_uom_qty || line.quantity || line.qty) || 0;

      // Extract numeric suffix from SO number or use index
      // Format: WA/xxxx/xxxxx (e.g. WA/2026/01856-01)
      const soNumMatches = cleanSoNumber.match(/(\d{4})\/(\d+)/);
      const yearStr = soNumMatches ? soNumMatches[1] : new Date().getFullYear().toString();
      const seqStr = soNumMatches ? soNumMatches[2] : String(orderDetail.id || 1);
      const lineIndexStr = String(i + 1).padStart(2, '0');
      const waNumberCandidate = `WA/${yearStr}/${seqStr}-${lineIndexStr}`;

      // Check if WA already exists for this SO and itemCode
      let wa = existingWas.find(
        (w) => w.wa_number === waNumberCandidate || (w.item_code === itemCode && w.so_id === so.id),
      );

      if (!wa) {
        wa = waRepo.create({
          so_id: so.id,
          wa_number: waNumberCandidate,
          item_code: itemCode,
          planned_quantity: plannedQty,
          notes: line.name || line.product_name || `Line #${line.id}`,
        });
        wa = await waRepo.save(wa);
        createdWas.push(wa);
        this.logger.log(`Created WA ${wa.wa_number} for SO ${so.so_number}`);
      } else {
        // Update planned quantity if changed
        if (plannedQty > 0 && wa.planned_quantity !== plannedQty) {
          wa.planned_quantity = plannedQty;
          await waRepo.save(wa);
        }
        createdWas.push(wa);
      }
    }

    return {
      message: `Successfully synchronized SO ${cleanSoNumber} from DIS`,
      so: {
        id: so.id,
        soNumber: so.so_number,
        customerName: so.customer_name,
        partnerEmail: so.partner_email,
        notes: so.notes,
      },
      syncedLinesCount: productLines.length,
      workAuthorizations: createdWas.map((w) => ({
        id: w.id,
        waNumber: w.wa_number,
        itemCode: w.item_code,
        plannedQuantity: w.planned_quantity,
      })),
    };
  }

  // ==========================================
  // SALE ORDERS (SO) MANAGEMENT & TREE HIERARCHY
  // ==========================================

  @Get([
    'api/plugins/device-traceability/so/tree',
    'api/v1/plugins/device-traceability/so/tree',
    'api/plugins/device-traceability/tree',
    'api/v1/plugins/device-traceability/tree',
  ])
  async getHierarchyTree(
    @Query('soNumber') soNumber?: string,
    @Query('customerName') customerName?: string,
  ) {
    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const soQb = soRepo.createQueryBuilder('so');
      if (soNumber) {
        soQb.andWhere('so.so_number ILIKE :soNumber', { soNumber: `%${soNumber.trim()}%` });
      }
      if (customerName) {
        soQb.andWhere('so.customer_name ILIKE :customerName', {
          customerName: `%${customerName.trim()}%`,
        });
      }
      soQb.orderBy('so.created_at', 'DESC');
      const saleOrders = await soQb.getMany();

      if (saleOrders.length === 0) {
        return [];
      }

      const soIds = saleOrders.map((s) => s.id);

      // Fetch all WAs for these SOs
      const was = await waRepo
        .createQueryBuilder('wa')
        .where('wa.so_id IN (:...soIds)', { soIds })
        .orderBy('wa.created_at', 'ASC')
        .getMany();

      // Fetch all devices for these SOs
      const devices = await deviceRepo
        .createQueryBuilder('dev')
        .where('dev.so_id IN (:...soIds)', { soIds })
        .orderBy('dev.created_at', 'ASC')
        .getMany();

      // Map WA id to WA entity for quick lookup
      const waMap = new Map<string, TraceabilityWaEntity>();
      for (const w of was) {
        waMap.set(w.id, w);
      }

      // Group WAs by SO
      const waBySo = new Map<string, TraceabilityWaEntity[]>();
      for (const w of was) {
        if (!waBySo.has(w.so_id)) waBySo.set(w.so_id, []);
        waBySo.get(w.so_id)!.push(w);
      }

      // Group devices by SO
      const devicesBySo = new Map<string, TraceabilityDeviceEntity[]>();
      for (const dev of devices) {
        if (!devicesBySo.has(dev.so_id)) devicesBySo.set(dev.so_id, []);
        devicesBySo.get(dev.so_id)!.push(dev);
      }

      const mapDeviceNode = (dev: TraceabilityDeviceEntity) => {
        const devWa = dev.wa_id ? waMap.get(dev.wa_id) : undefined;
        return {
          id: dev.id,
          soId: dev.so_id,
          waId: dev.wa_id,
          waNumber: devWa?.wa_number || (dev as any).waNumber || null,
          waCode: devWa?.wa_number || (dev as any).waNumber || null,
          type: 'DEVICE',
          code: dev.serial_number,
          serialNumber: dev.serial_number,
          devEui: dev.dev_eui,
          itemCode: dev.item_code,
          sku: dev.sku,
          hwVersion: dev.hw_version,
          fwVersion: dev.fw_version,
          testResult: dev.test_result,
          testStatus: dev.test_result,
          configStatus: dev.config_status,
          finalConfigStatus: dev.config_status,
          status: dev.status,
          testedAt: dev.tested_at,
          finalConfigSessionId: dev.final_config_session_id,
          createdAt: dev.created_at,
        };
      };

      // Construct Tabulator dataTree structure (_children)
      // Level 1: SO (Sales Order)
      // Level 2: ITEM_CODE (Sản phẩm / dòng hàng thuộc SO)
      // Level 3: SERIAL_NUMBER / DEVICE (Thiết bị test thuộc ITEM_CODE, gắn với WA)
      const tree = saleOrders.map((so) => {
        const soWas = waBySo.get(so.id) || [];
        const soDevs = devicesBySo.get(so.id) || [];

        // Collect all distinct item_codes from WAs (from DIS sync/creation) and devices
        const itemCodeMap = new Map<
          string,
          {
            itemCode: string;
            description?: string;
            plannedQuantity: number;
            was: TraceabilityWaEntity[];
            devices: TraceabilityDeviceEntity[];
          }
        >();

        // 1. Seed item codes from WAs
        for (const w of soWas) {
          const codeKey = (w.item_code || 'UNASSIGNED').trim();
          if (!itemCodeMap.has(codeKey)) {
            itemCodeMap.set(codeKey, {
              itemCode: codeKey,
              description: w.notes || undefined,
              plannedQuantity: 0,
              was: [],
              devices: [],
            });
          }
          const entry = itemCodeMap.get(codeKey)!;
          entry.plannedQuantity += w.planned_quantity || 0;
          entry.was.push(w);
          if (!entry.description && w.notes) {
            entry.description = w.notes;
          }
        }

        // 2. Associate devices to Item Code
        for (const dev of soDevs) {
          let codeKey: string | null = null;
          if (dev.item_code && dev.item_code.trim()) {
            codeKey = dev.item_code.trim();
          } else if (dev.wa_id && waMap.has(dev.wa_id)) {
            const w = waMap.get(dev.wa_id)!;
            if (w.item_code && w.item_code.trim()) {
              codeKey = w.item_code.trim();
            }
          } else if (dev.sku && dev.sku.trim()) {
            codeKey = dev.sku.trim();
          }

          if (!codeKey) {
            // If only 1 item code in SO, default to it
            if (itemCodeMap.size === 1) {
              codeKey = Array.from(itemCodeMap.keys())[0];
            } else {
              codeKey = 'UNASSIGNED';
            }
          }

          if (!itemCodeMap.has(codeKey)) {
            itemCodeMap.set(codeKey, {
              itemCode: codeKey,
              plannedQuantity: 0,
              was: [],
              devices: [],
            });
          }
          itemCodeMap.get(codeKey)!.devices.push(dev);
        }

        // Build Level 2 (ITEM_CODE) nodes
        const itemCodeNodes: any[] = [];
        for (const [codeKey, entry] of itemCodeMap.entries()) {
          const itemDevs = entry.devices;
          const passCount = itemDevs.filter(
            (d) => d.test_result === TraceabilityTestResult.PASS,
          ).length;
          const failCount = itemDevs.filter(
            (d) => d.test_result === TraceabilityTestResult.FAIL,
          ).length;
          const cfgPassCount = itemDevs.filter(
            (d) => d.config_status === TraceabilityConfigStatus.CONFIGURED_PASS,
          ).length;

          const defaultWa = entry.was.length > 0 ? entry.was[0] : null;
          const waNumberStr = entry.was.map((w) => w.wa_number).join(', ');

          itemCodeNodes.push({
            id: `item-${so.id}-${codeKey}`,
            soId: so.id,
            soNumber: so.so_number,
            type: 'ITEM_CODE',
            code: entry.itemCode,
            itemCode: entry.itemCode,
            orderingCode: entry.itemCode,
            description: entry.description || entry.itemCode,
            sku: entry.itemCode,
            waId: defaultWa?.id || null,
            waNumber: waNumberStr || null,
            plannedQuantity: entry.plannedQuantity || itemDevs.length,
            quantity: entry.plannedQuantity || itemDevs.length,
            totalDevices: itemDevs.length,
            testedCount: itemDevs.length,
            passCount,
            failCount,
            configPassCount: cfgPassCount,
            status:
              itemDevs.length >= (entry.plannedQuantity || 1) && passCount === itemDevs.length
                ? 'COMPLETED'
                : 'IN_PROGRESS',
            notes: entry.description || null,
            createdAt: entry.was[0]?.created_at || so.created_at,
            _children: itemDevs.map(mapDeviceNode),
          });
        }

        const soTotalDevices = soDevs.length;
        const soPassCount = soDevs.filter(
          (d) => d.test_result === TraceabilityTestResult.PASS,
        ).length;
        const soFailCount = soDevs.filter(
          (d) => d.test_result === TraceabilityTestResult.FAIL,
        ).length;
        const soConfigPassCount = soDevs.filter(
          (d) => d.config_status === TraceabilityConfigStatus.CONFIGURED_PASS,
        ).length;

        return {
          id: so.id,
          type: 'SO',
          code: so.so_number,
          soNumber: so.so_number,
          customerName: so.customer_name,
          partnerEmail: so.partner_email || null,
          partner_email: so.partner_email || null,
          customer_email: so.partner_email || null,
          name: so.customer_name ? `${so.so_number} - ${so.customer_name}` : so.so_number,
          itemCount: itemCodeNodes.length,
          totalDevices: soTotalDevices,
          passCount: soPassCount,
          failCount: soFailCount,
          configPassCount: soConfigPassCount,
          status:
            soTotalDevices > 0 && soPassCount === soTotalDevices ? 'COMPLETED' : 'IN_PROGRESS',
          notes: so.notes,
          createdAt: so.created_at,
          _children: itemCodeNodes,
        };
      });

      return tree;
    } catch (error) {
      this.logger.error(`Failed to construct hierarchy tree: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve hierarchy tree: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/device-traceability/so', 'api/v1/plugins/device-traceability/so'])
  async getSaleOrders(
    @Query('soNumber') soNumber?: string,
    @Query('customerName') customerName?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = soRepo.createQueryBuilder('so');
      if (soNumber) {
        qb.andWhere('so.so_number ILIKE :soNumber', { soNumber: `%${soNumber.trim()}%` });
      }
      if (customerName) {
        qb.andWhere('so.customer_name ILIKE :customerName', {
          customerName: `%${customerName.trim()}%`,
        });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('so.created_at', 'DESC');

      const [sos, total] = await qb.getManyAndCount();

      // Aggregate statistics for each SO
      const items = await Promise.all(
        sos.map(async (so) => {
          const was = await waRepo.find({ where: { so_id: so.id } });
          const totalDevices = await deviceRepo.count({ where: { so_id: so.id } });
          const testPassCount = await deviceRepo.count({
            where: { so_id: so.id, test_result: TraceabilityTestResult.PASS },
          });
          const configPassCount = await deviceRepo.count({
            where: { so_id: so.id, config_status: TraceabilityConfigStatus.CONFIGURED_PASS },
          });

          return {
            id: so.id,
            soNumber: so.so_number,
            customerName: so.customer_name,
            partnerEmail: so.partner_email || null,
            partner_email: so.partner_email || null,
            customer_email: so.partner_email || null,
            notes: so.notes,
            waCount: was.length,
            workAuthorizations: was.map((w) => ({
              id: w.id,
              waNumber: w.wa_number,
              itemCode: w.item_code,
              plannedQuantity: w.planned_quantity,
              notes: w.notes,
              createdAt: w.created_at,
            })),
            stats: {
              totalDevices,
              testPassCount,
              configPassCount,
            },
            createdAt: so.created_at,
            updatedAt: so.updated_at,
          };
        }),
      );

      return {
        data: items,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get Sale Orders: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve Sale Orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(['api/plugins/device-traceability/so/:id', 'api/v1/plugins/device-traceability/so/:id'])
  async getSaleOrderById(@Param('id') id: string) {
    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const so = await soRepo.findOne({ where: { id } });
      if (!so) {
        throw new NotFoundException(`Sale Order with ID ${id} not found`);
      }

      const was = await waRepo.find({ where: { so_id: so.id }, order: { created_at: 'ASC' } });
      const totalDevices = await deviceRepo.count({ where: { so_id: so.id } });
      const testPassCount = await deviceRepo.count({
        where: { so_id: so.id, test_result: TraceabilityTestResult.PASS },
      });
      const configPassCount = await deviceRepo.count({
        where: { so_id: so.id, config_status: TraceabilityConfigStatus.CONFIGURED_PASS },
      });

      return {
        id: so.id,
        soNumber: so.so_number,
        customerName: so.customer_name,
        partnerEmail: so.partner_email || null,
        partner_email: so.partner_email || null,
        customer_email: so.partner_email || null,
        notes: so.notes,
        workAuthorizations: was.map((w) => ({
          id: w.id,
          waNumber: w.wa_number,
          itemCode: w.item_code,
          plannedQuantity: w.planned_quantity,
          notes: w.notes,
          createdAt: w.created_at,
        })),
        stats: {
          totalDevices,
          testPassCount,
          configPassCount,
        },
        createdAt: so.created_at,
        updatedAt: so.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to get Sale Order ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve Sale Order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(['api/plugins/device-traceability/so', 'api/v1/plugins/device-traceability/so'])
  async createSaleOrder(@Body() body: CreateSoDto) {
    if (!body.soNumber || !body.soNumber.trim()) {
      throw new BadRequestException('soNumber is required');
    }

    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );

      const cleanSoNumber = body.soNumber.trim();
      const existing = await soRepo.findOne({ where: { so_number: cleanSoNumber } });
      if (existing) {
        throw new BadRequestException(`Sale Order ${cleanSoNumber} already exists`);
      }

      const so = soRepo.create({
        so_number: cleanSoNumber,
        customer_name: body.customerName ? body.customerName.trim() : null,
        notes: body.notes ? body.notes.trim() : null,
      });

      const saved = await soRepo.save(so);
      this.logger.log(`Created Sale Order [${saved.id}] ${saved.so_number}`);

      return {
        id: saved.id,
        soNumber: saved.so_number,
        customerName: saved.customer_name,
        notes: saved.notes,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to create Sale Order: ${error.message}`);
      throw new HttpException(
        `Failed to create Sale Order: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // WORK AUTHORIZATION (WA) MANAGEMENT
  // ==========================================

  @Get([
    'api/plugins/device-traceability/wa',
    'api/v1/plugins/device-traceability/wa',
    'api/plugins/device-traceability/so/:soId/wa',
    'api/v1/plugins/device-traceability/so/:soId/wa',
  ])
  async getWorkAuthorizations(
    @Param('soId') paramSoId?: string,
    @Query('soId') querySoId?: string,
    @Query('soNumber') soNumber?: string,
    @Query('waNumber') waNumber?: string,
  ) {
    try {
      const targetSoId = paramSoId || querySoId;
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const qb = waRepo
        .createQueryBuilder('wa')
        .leftJoinAndSelect('wa.so', 'so')
        .orderBy('wa.created_at', 'DESC');

      if (targetSoId) {
        qb.andWhere('wa.so_id = :soId', { soId: targetSoId });
      }
      if (soNumber) {
        qb.andWhere('so.so_number ILIKE :soNumber', { soNumber: `%${soNumber.trim()}%` });
      }
      if (waNumber) {
        qb.andWhere('wa.wa_number ILIKE :waNumber', { waNumber: `%${waNumber.trim()}%` });
      }

      const list = await qb.getMany();
      return list.map((w) => ({
        id: w.id,
        soId: w.so_id,
        soNumber: w.so?.so_number,
        waNumber: w.wa_number,
        itemCode: w.item_code,
        plannedQuantity: w.planned_quantity,
        notes: w.notes,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      }));
    } catch (error) {
      this.logger.error(`Failed to get Work Authorizations: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve Work Authorizations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post([
    'api/plugins/device-traceability/wa',
    'api/v1/plugins/device-traceability/wa',
    'api/plugins/device-traceability/so/:soId/wa',
    'api/v1/plugins/device-traceability/so/:soId/wa',
  ])
  async createWorkAuthorization(
    @Body() body: CreateWaDto,
    @Param('soId') paramSoId?: string,
  ) {
    if (!body.waNumber || !body.waNumber.trim()) {
      throw new BadRequestException('waNumber is required');
    }

    const cleanWaNumber = body.waNumber.trim();
    const waRegex = /^WA\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/;
    if (!waRegex.test(cleanWaNumber)) {
      throw new BadRequestException(
        `waNumber must strictly follow the format 'WA/xxxx/xxxxx' (e.g. WA/2026/00001). Received: ${cleanWaNumber}`,
      );
    }

    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );

      const effectiveSoId = paramSoId || body.soId;
      let targetSo: TraceabilitySoEntity | null = null;
      if (effectiveSoId) {
        targetSo = await soRepo.findOne({ where: { id: effectiveSoId } });
      } else if (body.soNumber) {
        targetSo = await soRepo.findOne({ where: { so_number: body.soNumber.trim() } });
      }

      if (!targetSo) {
        throw new BadRequestException(
          `Parent Sale Order could not be resolved from provided soId (${effectiveSoId}) or soNumber (${body.soNumber})`,
        );
      }

      const existingWa = await waRepo.findOne({ where: { wa_number: cleanWaNumber } });
      if (existingWa) {
        throw new BadRequestException(`Work Authorization ${cleanWaNumber} already exists`);
      }

      const wa = waRepo.create({
        so_id: targetSo.id,
        wa_number: cleanWaNumber,
        item_code: body.itemCode ? body.itemCode.trim() : null,
        planned_quantity: body.plannedQuantity || 0,
        notes: body.notes ? body.notes.trim() : null,
      });

      const saved = await waRepo.save(wa);
      this.logger.log(
        `Created Work Authorization [${saved.id}] ${saved.wa_number} under SO ${targetSo.so_number}`,
      );

      return {
        id: saved.id,
        soId: saved.so_id,
        soNumber: targetSo.so_number,
        waNumber: saved.wa_number,
        itemCode: saved.item_code,
        plannedQuantity: saved.planned_quantity,
        notes: saved.notes,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to create Work Authorization: ${error.message}`);
      throw new HttpException(
        `Failed to create Work Authorization: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICE TESTING LIST & CSV IMPORT
  // ==========================================

  @Get(['api/plugins/device-traceability/devices', 'api/v1/plugins/device-traceability/devices'])
  async getDevices(
    @Query('soId') soId?: string,
    @Query('waId') waId?: string,
    @Query('serialNumber') serialNumber?: string,
    @Query('testResult') testResult?: string,
    @Query('configStatus') configStatus?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = deviceRepo
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.so', 'so')
        .leftJoinAndSelect('device.wa', 'wa');

      if (soId) {
        qb.andWhere('device.so_id = :soId', { soId });
      }
      if (waId) {
        qb.andWhere('device.wa_id = :waId', { waId });
      }
      if (serialNumber) {
        qb.andWhere('device.serial_number ILIKE :serialNumber', {
          serialNumber: `%${serialNumber.trim()}%`,
        });
      }
      if (testResult) {
        qb.andWhere('device.test_result = :testResult', { testResult: testResult.toUpperCase() });
      }
      if (configStatus) {
        qb.andWhere('device.config_status = :configStatus', {
          configStatus: configStatus.toUpperCase(),
        });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('device.created_at', 'DESC');

      const [devices, total] = await qb.getManyAndCount();

      return {
        data: devices.map((d) => ({
          id: d.id,
          soId: d.so_id,
          soNumber: d.so?.so_number,
          waId: d.wa_id,
          waNumber: d.wa?.wa_number,
          serialNumber: d.serial_number,
          devEui: d.dev_eui,
          itemCode: d.item_code,
          sku: d.sku,
          hwVersion: d.hw_version,
          fwVersion: d.fw_version,
          testResult: d.test_result,
          testId: d.test_id,
          testStation: d.test_station,
          testPerson: d.test_person,
          testedAt: d.tested_at,
          testRawData: d.test_raw_data,
          finalConfigSessionId: d.final_config_session_id,
          configStatus: d.config_status,
          status: d.status,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get devices: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve devices: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post([
    'api/plugins/device-traceability/devices/import-csv',
    'api/v1/plugins/device-traceability/devices/import-csv',
    'api/plugins/device-traceability/devices/import-test-results',
    'api/v1/plugins/device-traceability/devices/import-test-results',
    'api/plugins/device-traceability/import-tests',
    'api/v1/plugins/device-traceability/import-tests',
  ])
  async importCsvDevices(@Body() body: ImportCsvDevicesDto) {
    if (!body.devices || !Array.isArray(body.devices) || body.devices.length === 0) {
      throw new BadRequestException('A non-empty "devices" array is required');
    }

    try {
      const soRepo = this.databaseService.getRepositoryForTable(
        'traceability_so',
        TraceabilitySoEntity,
      );
      const waRepo = this.databaseService.getRepositoryForTable(
        'traceability_wa',
        TraceabilityWaEntity,
      );
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      // Resolve WA & SO
      let resolvedWa: TraceabilityWaEntity | null = null;
      let resolvedSo: TraceabilitySoEntity | null = null;

      if (body.waId) {
        resolvedWa = await waRepo.findOne({ where: { id: body.waId }, relations: ['so'] });
        if (!resolvedWa) {
          throw new NotFoundException(`Work Authorization ID ${body.waId} not found`);
        }
        resolvedSo =
          resolvedWa.so || (await soRepo.findOne({ where: { id: resolvedWa.so_id } }));
      } else if (body.waNumber) {
        resolvedWa = await waRepo.findOne({
          where: { wa_number: body.waNumber.trim() },
          relations: ['so'],
        });
        if (!resolvedWa) {
          throw new NotFoundException(`Work Authorization ${body.waNumber} not found`);
        }
        resolvedSo =
          resolvedWa.so || (await soRepo.findOne({ where: { id: resolvedWa.so_id } }));
      }

      if (!resolvedSo) {
        if (body.soId) {
          resolvedSo = await soRepo.findOne({ where: { id: body.soId } });
        } else if (body.soNumber) {
          resolvedSo = await soRepo.findOne({ where: { so_number: body.soNumber.trim() } });
        }
      }

      if (!resolvedSo) {
        throw new BadRequestException(
          'Target Sale Order (SO) or Work Authorization (WA) must be provided and resolvable',
        );
      }

      const importedDevices: TraceabilityDeviceEntity[] = [];

      for (const item of body.devices) {
        const serialNumber = item.serialNumber || item['serial_number'];
        if (!serialNumber || !serialNumber.trim()) {
          continue; // skip invalid row
        }
        const cleanSerial = serialNumber.trim();

        const devEui =
          item.devEui || item.deviceKey || item['device_key'] || item['dev_eui'] || null;
        const sku = item.sku || null;
        const hwVersion = item.hwVersion || item['hw_ver'] || item['hw_version'] || null;
        const fwVersion = item.fwVersion || item['fw_ver'] || item['fw_version'] || null;
        const itemCode = item.itemCode || item['item_code'] || resolvedWa?.item_code || null;

        let testResult = TraceabilityTestResult.PENDING;
        const rawRes = (item.testResult || item['result'] || '').toUpperCase();
        if (rawRes === 'PASS') testResult = TraceabilityTestResult.PASS;
        else if (rawRes === 'FAIL') testResult = TraceabilityTestResult.FAIL;

        const testId = item.testId || item['test_id'] || null;
        const testStation = item.testStation || item['test_station'] || null;
        const testPerson = item.testPerson || item['test_person'] || null;

        let testedAt: Date | null = null;
        const rawTime =
          item.testedAt || item['time_finish'] || item['start_time'] || item['time_start'];
        if (rawTime) {
          const parsedDate = new Date(rawTime);
          if (!isNaN(parsedDate.getTime())) {
            testedAt = parsedDate;
          }
        }

        // Collect all remaining fields into test_raw_data
        const testRawData = item.testRawData ? { ...item.testRawData } : {};
        for (const [k, v] of Object.entries(item)) {
          if (
            ![
              'serialNumber',
              'serial_number',
              'deviceKey',
              'devEui',
              'device_key',
              'dev_eui',
              'sku',
              'hwVersion',
              'hw_ver',
              'hw_version',
              'fwVersion',
              'fw_ver',
              'fw_version',
              'itemCode',
              'item_code',
              'testResult',
              'result',
              'testId',
              'test_id',
              'testStation',
              'test_station',
              'testPerson',
              'test_person',
              'testedAt',
              'time_finish',
              'start_time',
              'testRawData',
            ].includes(k)
          ) {
            testRawData[k] = v;
          }
        }

        let device = await deviceRepo.findOne({ where: { serial_number: cleanSerial } });
        if (!device) {
          device = deviceRepo.create({
            so_id: resolvedSo.id,
            wa_id: resolvedWa ? resolvedWa.id : null,
            serial_number: cleanSerial,
            dev_eui: devEui,
            item_code: itemCode,
            sku,
            hw_version: hwVersion,
            fw_version: fwVersion,
            test_result: testResult,
            test_id: testId,
            test_station: testStation,
            test_person: testPerson,
            tested_at: testedAt,
            test_raw_data: testRawData,
            status:
              testResult === TraceabilityTestResult.PASS
                ? TraceabilityDeviceStatus.TESTED_PASS
                : testResult === TraceabilityTestResult.FAIL
                  ? TraceabilityDeviceStatus.TESTED_FAIL
                  : TraceabilityDeviceStatus.TESTED,
          });
        } else {
          // Update device
          device.so_id = resolvedSo.id;
          if (resolvedWa) device.wa_id = resolvedWa.id;
          if (devEui) device.dev_eui = devEui;
          if (itemCode) device.item_code = itemCode;
          if (sku) device.sku = sku;
          if (hwVersion) device.hw_version = hwVersion;
          if (fwVersion) device.fw_version = fwVersion;
          device.test_result = testResult;
          if (testId) device.test_id = testId;
          if (testStation) device.test_station = testStation;
          if (testPerson) device.test_person = testPerson;
          if (testedAt) device.tested_at = testedAt;
          device.test_raw_data = { ...device.test_raw_data, ...testRawData };
          if (device.status === TraceabilityDeviceStatus.TESTED || !device.status) {
            device.status =
              testResult === TraceabilityTestResult.PASS
                ? TraceabilityDeviceStatus.TESTED_PASS
                : TraceabilityDeviceStatus.TESTED_FAIL;
          }
        }

        const saved = await deviceRepo.save(device);
        importedDevices.push(saved);
      }

      this.logger.log(
        `Imported ${importedDevices.length} devices into SO: ${resolvedSo.so_number}${
          resolvedWa ? ', WA: ' + resolvedWa.wa_number : ''
        }`,
      );

      const passCount = importedDevices.filter((d) => d.test_result === 'PASS').length;
      const failCount = importedDevices.filter((d) => d.test_result === 'FAIL').length;

      return {
        message: 'Imported devices successfully',
        soNumber: resolvedSo.so_number,
        waNumber: resolvedWa?.wa_number || null,
        importedCount: importedDevices.length,
        totalImported: importedDevices.length,
        passCount,
        failCount,
        devices: importedDevices.map((d) => ({
          id: d.id,
          serialNumber: d.serial_number,
          devEui: d.dev_eui,
          sku: d.sku,
          testResult: d.test_result,
          status: d.status,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`CSV Import failed: ${error.message}`);
      throw new HttpException(
        `Device CSV import failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICE STATUS UPDATE & DELETE (CONTEXT MENU)
  // ==========================================

  @Patch([
    'api/plugins/device-traceability/devices/:id/status',
    'api/v1/plugins/device-traceability/devices/:id/status',
    'api/plugins/device-traceability/devices/serial/:serialNumber/status',
    'api/v1/plugins/device-traceability/devices/serial/:serialNumber/status',
  ])
  async updateDeviceStatus(
    @Param('id') id?: string,
    @Param('serialNumber') serialNumber?: string,
    @Body() body?: UpdateDeviceStatusDto,
  ) {
    const effectiveStatus = body?.status || body?.testResult || body?.configStatus;
    if (!body || !effectiveStatus) {
      throw new BadRequestException('A status value ("PASS", "FAIL", "NONE" or "PENDING") is required');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      let device: TraceabilityDeviceEntity | null = null;
      if (id && id.length >= 32) {
        // Query by UUID
        device = await deviceRepo.findOne({ where: { id }, relations: ['so', 'wa'] });
      }
      if (!device && (serialNumber || id)) {
        const lookupSn = (serialNumber || id)!.trim();
        device = await deviceRepo.findOne({ where: { serial_number: lookupSn }, relations: ['so', 'wa'] });
      }

      if (!device) {
        throw new NotFoundException(`Device ${id || serialNumber} not found`);
      }

      const rawStatus = (body.status || body.testResult || body.configStatus || '').toUpperCase().trim();
      let targetStatus: string = rawStatus;
      if (targetStatus === 'NONE' || targetStatus === 'UNCONFIGURED') {
        targetStatus = 'PENDING';
      }

      // Infer statusType if not explicitly given
      let statusType = (body.statusType || '').toLowerCase();
      if (!statusType) {
        if (body.configStatus || rawStatus.includes('CONFIG')) {
          statusType = 'config_status';
        } else {
          statusType = 'test_result';
        }
      }

      if (statusType === 'final_config' || statusType === 'config_status') {
        // Update final config status
        if (targetStatus === 'PASS' || targetStatus === 'CONFIGURED_PASS') {
          device.config_status = TraceabilityConfigStatus.CONFIGURED_PASS;
          device.status = TraceabilityDeviceStatus.CONFIGURED;
        } else if (targetStatus === 'FAIL' || targetStatus === 'CONFIG_FAILED' || targetStatus === 'CONFIGURED_FAIL') {
          device.config_status = TraceabilityConfigStatus.CONFIGURED_FAIL;
        } else {
          device.config_status = TraceabilityConfigStatus.PENDING;
        }
      } else {
        // Default update test status / test_result
        if (targetStatus === 'PASS') {
          device.test_result = TraceabilityTestResult.PASS;
          device.status = TraceabilityDeviceStatus.TESTED_PASS;
        } else if (targetStatus === 'FAIL') {
          device.test_result = TraceabilityTestResult.FAIL;
          device.status = TraceabilityDeviceStatus.TESTED_FAIL;
        } else {
          device.test_result = TraceabilityTestResult.PENDING;
          device.status = TraceabilityDeviceStatus.TESTED;
        }
      }

      const updated = await deviceRepo.save(device);
      this.logger.log(
        `Updated status for device ${updated.serial_number} (Type: ${statusType || 'test'}, Result: ${targetStatus})`,
      );

      return {
        id: updated.id,
        serialNumber: updated.serial_number,
        testResult: updated.test_result,
        testStatus: updated.test_result,
        configStatus: updated.config_status,
        finalConfigStatus: updated.config_status,
        status: updated.status,
        updatedAt: updated.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to update device status: ${error.message}`);
      throw new HttpException(
        `Failed to update device status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete([
    'api/plugins/device-traceability/devices/:id',
    'api/v1/plugins/device-traceability/devices/:id',
  ])
  async deleteDevice(@Param('id') id: string) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      let device: TraceabilityDeviceEntity | null = null;
      if (id && id.length >= 32) {
        device = await deviceRepo.findOne({ where: { id } });
      }
      if (!device) {
        device = await deviceRepo.findOne({ where: { serial_number: id.trim() } });
      }

      if (!device) {
        throw new NotFoundException(`Device ${id} not found`);
      }

      const serialNumber = device.serial_number;
      await deviceRepo.remove(device);
      this.logger.log(`Deleted device record ${serialNumber} (ID: ${id})`);

      return {
        success: true,
        message: `Device ${serialNumber} removed successfully`,
        id,
        serialNumber,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to delete device ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to delete device: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICE DETAILS UPDATE (EDIT DIALOG)
  // ==========================================

  @Put([
    'api/plugins/device-traceability/devices/:id',
    'api/v1/plugins/device-traceability/devices/:id',
    'api/plugins/device-traceability/devices/serial/:serialNumber',
    'api/v1/plugins/device-traceability/devices/serial/:serialNumber',
  ])
  @Patch([
    'api/plugins/device-traceability/devices/:id/details',
    'api/v1/plugins/device-traceability/devices/:id/details',
  ])
  async updateDeviceDetails(
    @Param('id') id?: string,
    @Param('serialNumber') serialNumber?: string,
    @Body() body?: UpdateDeviceDetailsDto,
  ) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      let device: TraceabilityDeviceEntity | null = null;
      if (id && id.length >= 32) {
        device = await deviceRepo.findOne({ where: { id }, relations: ['so', 'wa'] });
      }
      if (!device && (serialNumber || id)) {
        const lookupSn = (serialNumber || id)!.trim();
        device = await deviceRepo.findOne({ where: { serial_number: lookupSn }, relations: ['so', 'wa'] });
      }

      if (!device) {
        throw new NotFoundException(`Device ${id || serialNumber} not found`);
      }

      if (body) {
        if (body.testResult !== undefined) {
          const raw = body.testResult.toUpperCase().trim();
          if (raw === 'PASS') {
            device.test_result = TraceabilityTestResult.PASS;
            device.status = TraceabilityDeviceStatus.TESTED_PASS;
          } else if (raw === 'FAIL') {
            device.test_result = TraceabilityTestResult.FAIL;
            device.status = TraceabilityDeviceStatus.TESTED_FAIL;
          } else {
            device.test_result = TraceabilityTestResult.PENDING;
            device.status = TraceabilityDeviceStatus.TESTED;
          }
        }
        if (body.testStation !== undefined) {
          device.test_station = body.testStation ? body.testStation.trim() : null;
        }
        if (body.testPerson !== undefined) {
          device.test_person = body.testPerson ? body.testPerson.trim() : null;
        }
        if (body.testedAt !== undefined) {
          device.tested_at = body.testedAt ? new Date(body.testedAt) : null;
        }
        if (body.itemCode !== undefined) {
          device.item_code = body.itemCode ? body.itemCode.trim() : null;
        }
        if (body.sku !== undefined) {
          device.sku = body.sku ? body.sku.trim() : null;
        }
        if (body.hwVersion !== undefined) {
          device.hw_version = body.hwVersion ? body.hwVersion.trim() : null;
        }
        if (body.fwVersion !== undefined) {
          device.fw_version = body.fwVersion ? body.fwVersion.trim() : null;
        }
        if (body.devEui !== undefined) {
          device.dev_eui = body.devEui ? body.devEui.trim() : null;
        }
        if (body.configStatus !== undefined) {
          const cfg = body.configStatus.toUpperCase().trim();
          if (cfg === 'CONFIGURED_PASS' || cfg === 'PASS') {
            device.config_status = TraceabilityConfigStatus.CONFIGURED_PASS;
            device.status = TraceabilityDeviceStatus.CONFIGURED;
          } else if (cfg === 'CONFIGURED_FAIL' || cfg === 'FAIL' || cfg === 'CONFIG_FAILED') {
            device.config_status = TraceabilityConfigStatus.CONFIGURED_FAIL;
          } else {
            device.config_status = TraceabilityConfigStatus.PENDING;
          }
        }
        if (body.testRawData !== undefined) {
          device.test_raw_data = body.testRawData || {};
        }
      }

      const updated = await deviceRepo.save(device);
      this.logger.log(`Updated details for device ${updated.serial_number} (ID: ${updated.id})`);

      return {
        id: updated.id,
        serialNumber: updated.serial_number,
        devEui: updated.dev_eui,
        itemCode: updated.item_code,
        sku: updated.sku,
        hwVersion: updated.hw_version,
        fwVersion: updated.fw_version,
        testResult: updated.test_result,
        testStation: updated.test_station,
        testPerson: updated.test_person,
        testedAt: updated.tested_at,
        testRawData: updated.test_raw_data,
        configStatus: updated.config_status,
        status: updated.status,
        updatedAt: updated.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to update device details: ${error.message}`);
      throw new HttpException(
        `Failed to update device details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICE FINAL CONFIG LISTING WITH AUDIT
  // ==========================================

  @Get([
    'api/plugins/device-traceability/final-config-devices',
    'api/v1/plugins/device-traceability/final-config-devices',
  ])
  async getFinalConfigDevices(
    @Query('soId') soId?: string,
    @Query('waId') waId?: string,
    @Query('status') status?: string,
    @Query('configStatus') configStatus?: string,
    @Query('serialNumber') serialNumber?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = deviceRepo
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.so', 'so')
        .leftJoinAndSelect('device.wa', 'wa');

      if (soId) {
        qb.andWhere('device.so_id = :soId', { soId });
      }
      if (waId) {
        qb.andWhere('device.wa_id = :waId', { waId });
      }
      if (serialNumber) {
        qb.andWhere('device.serial_number ILIKE :serialNumber', {
          serialNumber: `%${serialNumber.trim()}%`,
        });
      }

      const targetStatus = (configStatus || status || '').toUpperCase().trim();
      if (targetStatus) {
        if (targetStatus === 'PASS') {
          qb.andWhere('device.config_status = :cs', { cs: TraceabilityConfigStatus.CONFIGURED_PASS });
        } else if (targetStatus === 'FAIL') {
          qb.andWhere('device.config_status = :cs', { cs: TraceabilityConfigStatus.CONFIGURED_FAIL });
        } else if (targetStatus === 'NONE' || targetStatus === 'PENDING') {
          qb.andWhere('device.config_status = :cs', { cs: TraceabilityConfigStatus.PENDING });
        } else {
          qb.andWhere('device.config_status = :cs', { cs: targetStatus });
        }
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('device.updated_at', 'DESC');

      const [devices, total] = await qb.getManyAndCount();

      // Collect session IDs to query audit info
      const sessionIds = devices
        .map((d) => d.final_config_session_id)
        .filter((sid): sid is string => Boolean(sid));

      const sessionsMap = new Map<string, any>();
      if (sessionIds.length > 0) {
        try {
          const sessionRepo = this.databaseService.getRepositoryForTable(
            'finalconfig_execution_session',
            FinalConfigExecutionSessionEntity,
          );
          const uniqueSessionIds = Array.from(new Set(sessionIds));
          const sessions = await sessionRepo
            .createQueryBuilder('sess')
            .where('sess.id IN (:...uniqueSessionIds)', { uniqueSessionIds })
            .getMany();

          for (const s of sessions) {
            sessionsMap.set(s.id, s);
          }
        } catch (e: any) {
          this.logger.warn(`Could not bulk load execution sessions: ${e.message}`);
        }
      }

      return {
        data: devices.map((d) => {
          const session = d.final_config_session_id
            ? sessionsMap.get(d.final_config_session_id)
            : null;

          return {
            id: d.id,
            soId: d.so_id,
            soNumber: d.so?.so_number,
            waId: d.wa_id,
            waNumber: d.wa?.wa_number,
            serialNumber: d.serial_number,
            devEui: d.dev_eui,
            itemCode: d.item_code,
            sku: d.sku,
            hwVersion: d.hw_version,
            fwVersion: d.fw_version,
            testResult: d.test_result,
            configStatus: d.config_status,
            finalConfigStatus: d.config_status,
            finalConfigSessionId: d.final_config_session_id,
            sessionProfile: session?.profileName,
            operator: session?.operator,
            registersVerified: session?.totalVerifiedRegisters,
            sessionSummary: session?.summary,
            status: d.status,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          };
        }),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get final config devices: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve final config devices: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // DEVICE LOOKUP & LIFECYCLE
  // ==========================================

  @Get([
    'api/plugins/device-traceability/devices/lookup',
    'api/v1/plugins/device-traceability/devices/lookup',
  ])
  async lookupDevice(
    @Query('serialNumber') serialNumber?: string,
    @Query('devEui') devEui?: string,
  ) {
    if (!serialNumber && !devEui) {
      throw new BadRequestException(
        'At least one query parameter is required: serialNumber or devEui',
      );
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const qb = deviceRepo
        .createQueryBuilder('device')
        .leftJoinAndSelect('device.so', 'so')
        .leftJoinAndSelect('device.wa', 'wa');

      if (serialNumber) {
        qb.andWhere('device.serial_number = :serialNumber', {
          serialNumber: serialNumber.trim(),
        });
      } else if (devEui) {
        qb.andWhere('device.dev_eui ILIKE :devEui', { devEui: devEui.trim() });
      }

      const device = await qb.getOne();
      if (!device) {
        throw new NotFoundException('Device not found matching the criteria');
      }

      return {
        id: device.id,
        soId: device.so_id,
        soNumber: device.so?.so_number,
        waId: device.wa_id,
        waNumber: device.wa?.wa_number,
        serialNumber: device.serial_number,
        devEui: device.dev_eui,
        itemCode: device.item_code,
        sku: device.sku,
        hwVersion: device.hw_version,
        fwVersion: device.fw_version,
        testResult: device.test_result,
        testId: device.test_id,
        testStation: device.test_station,
        testPerson: device.test_person,
        testedAt: device.tested_at,
        testRawData: device.test_raw_data,
        finalConfigSessionId: device.final_config_session_id,
        configStatus: device.config_status,
        status: device.status,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Device lookup failed: ${error.message}`);
      throw new HttpException(
        `Lookup failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get([
    'api/plugins/device-traceability/devices/:id/lifecycle',
    'api/v1/plugins/device-traceability/devices/:id/lifecycle',
  ])
  async getDeviceLifecycle(@Param('id') id: string) {
    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const device = await deviceRepo.findOne({
        where: { id },
        relations: ['so', 'wa'],
      });

      if (!device) {
        throw new NotFoundException(`Device with ID ${id} not found`);
      }

      let finalConfigSessionDetail: any = null;
      let executionLogs: any[] = [];

      if (device.final_config_session_id) {
        try {
          const sessionRepo = this.databaseService.getRepositoryForTable(
            'finalconfig_execution_session',
            FinalConfigExecutionSessionEntity,
          );
          const logRepo = this.databaseService.getRepositoryForTable(
            'finalconfig_execution_log',
            FinalConfigExecutionLogEntity,
          );

          const session = await sessionRepo.findOne({
            where: { id: device.final_config_session_id },
          });
          if (session) {
            const logs = await logRepo.find({
              where: { sessionId: session.id },
              order: { createdAt: 'ASC' },
            });

            finalConfigSessionDetail = {
              id: session.id,
              deviceId: session.deviceId,
              profileId: session.profileId,
              status: session.status,
              totalSteps: session.totalSteps,
              passedSteps: session.passedSteps,
              failedSteps: session.failedSteps,
              currentStep: session.currentStep,
              startedAt: session.startedAt,
              completedAt: session.completedAt,
              createdAt: session.createdAt,
            };

            executionLogs = logs.map((l) => ({
              id: l.id,
              modbusRegisterDec: l.modbusRegisterDec,
              modbusRegisterHex: l.modbusRegisterHex,
              action: l.action,
              expectedValue: l.expectedValue,
              writtenValue: l.writtenValue,
              readValue: l.readValue,
              rawHex: l.rawHex,
              status: l.status,
              durationMs: l.durationMs,
              errorMessage: l.errorMessage,
              createdAt: l.createdAt,
            }));
          }
        } catch (linkErr: any) {
          this.logger.warn(
            `Could not query Final Config Session ${device.final_config_session_id}: ${linkErr.message}`,
          );
        }
      }

      return {
        device: {
          id: device.id,
          soId: device.so_id,
          waId: device.wa_id,
          serialNumber: device.serial_number,
          devEui: device.dev_eui,
          itemCode: device.item_code,
          sku: device.sku,
          hwVersion: device.hw_version,
          fwVersion: device.fw_version,
          testResult: device.test_result,
          testId: device.test_id,
          testStation: device.test_station,
          testPerson: device.test_person,
          testedAt: device.tested_at,
          testRawData: device.test_raw_data,
          finalConfigSessionId: device.final_config_session_id,
          configStatus: device.config_status,
          status: device.status,
          createdAt: device.created_at,
          updatedAt: device.updated_at,
        },
        so: device.so
          ? {
              id: device.so.id,
              soNumber: device.so.so_number,
              customerName: device.so.customer_name,
              notes: device.so.notes,
              createdAt: device.so.created_at,
            }
          : null,
        wa: device.wa
          ? {
              id: device.wa.id,
              waNumber: device.wa.wa_number,
              itemCode: device.wa.item_code,
              plannedQuantity: device.wa.planned_quantity,
              notes: device.wa.notes,
              createdAt: device.wa.created_at,
            }
          : null,
        finalConfig: finalConfigSessionDetail,
        executionLogs,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Lifecycle lookup failed for device ${id}: ${error.message}`);
      throw new HttpException(
        `Failed to retrieve device lifecycle: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // CROSS-SYSTEM LINKING & BUSINESS GUARD
  // ==========================================

  @Post([
    'api/plugins/device-traceability/devices/link-session',
    'api/v1/plugins/device-traceability/devices/link-session',
  ])
  async linkFinalConfigSession(@Body() body: LinkSessionDto) {
    if (!body.serialNumber || !body.finalConfigSessionId) {
      throw new BadRequestException('serialNumber and finalConfigSessionId are required');
    }

    try {
      const deviceRepo = this.databaseService.getRepositoryForTable(
        'traceability_device',
        TraceabilityDeviceEntity,
      );

      const device = await deviceRepo.findOne({
        where: { serial_number: body.serialNumber.trim() },
      });

      if (!device) {
        throw new NotFoundException(`Device ${body.serialNumber} not found in Traceability system`);
      }

      // BUSINESS RULE GUARD:
      // Device MUST have test_result = 'PASS' to be eligible for Final Config.
      if (device.test_result !== TraceabilityTestResult.PASS) {
        this.logger.warn(
          `Security/Quality Guard rejected Final Config link for device ${device.serial_number}: test_result is ${device.test_result}`,
        );
        throw new BadRequestException(
          `Device ${device.serial_number} has not passed hardware testing (Current: ${device.test_result}). Final Config is blocked!`,
        );
      }

      const sessionRepo = this.databaseService.getRepositoryForTable(
        'finalconfig_execution_session',
        FinalConfigExecutionSessionEntity,
      );

      const session = await sessionRepo.findOne({
        where: { id: body.finalConfigSessionId },
      });

      if (!session) {
        throw new NotFoundException(
          `Final Config Session ${body.finalConfigSessionId} does not exist`,
        );
      }

      device.final_config_session_id = session.id;
      if (body.configStatus) {
        device.config_status = body.configStatus as TraceabilityConfigStatus;
      } else if (session.status === 'COMPLETED') {
        device.config_status = TraceabilityConfigStatus.CONFIGURED_PASS;
      } else if (session.status === 'FAILED') {
        device.config_status = TraceabilityConfigStatus.CONFIGURED_FAIL;
      }

      if (device.config_status === TraceabilityConfigStatus.CONFIGURED_PASS) {
        device.status = TraceabilityDeviceStatus.CONFIGURED;
      }

      const updated = await deviceRepo.save(device);
      this.logger.log(
        `Linked Device ${updated.serial_number} to Final Config Session ${session.id} (Config Status: ${updated.config_status})`,
      );

      return {
        message: 'Successfully linked Final Config Session to Device',
        serialNumber: updated.serial_number,
        finalConfigSessionId: updated.final_config_session_id,
        configStatus: updated.config_status,
        status: updated.status,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Failed to link Final Config Session: ${error.message}`);
      throw new HttpException(
        `Linking Final Config Session failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ==========================================
  // BACKWARD COMPATIBILITY ENDPOINTS (ORDERS)
  // ==========================================

  @Get(['api/plugins/device-traceability/orders', 'api/v1/plugins/device-traceability/orders'])
  async getLegacyOrders(
    @Query('soNumber') soNumber?: string,
    @Query('waNumber') waNumber?: string,
    @Query('connectivity') connectivity?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const orderRepo = this.databaseService.getRepositoryForTable(
        'traceability_order',
        TraceabilityOrderEntity,
      );
      const qb = orderRepo.createQueryBuilder('order');

      if (soNumber) {
        qb.andWhere('order.so_number ILIKE :soNumber', { soNumber: `%${soNumber}%` });
      }
      if (waNumber) {
        qb.andWhere('order.wa_number ILIKE :waNumber', { waNumber: `%${waNumber}%` });
      }
      if (connectivity) {
        qb.andWhere('order.connectivity = :connectivity', { connectivity });
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
      qb.skip((pageNum - 1) * limitNum).take(limitNum);
      qb.orderBy('order.created_at', 'DESC');

      const [orders, total] = await qb.getManyAndCount();
      return {
        data: orders.map((o) => ({
          id: o.id,
          soNumber: o.so_number,
          waNumber: o.wa_number,
          itemCode: o.item_code,
          connectivity: o.connectivity,
          totalQuantity: o.total_quantity,
          notes: o.notes,
          createdBy: o.created_by,
          createdAt: o.created_at,
          updatedAt: o.updated_at,
        })),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve legacy orders: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(['api/plugins/device-traceability/orders', 'api/v1/plugins/device-traceability/orders'])
  async createLegacyOrder(@Body() body: any) {
    const orderRepo = this.databaseService.getRepositoryForTable(
      'traceability_order',
      TraceabilityOrderEntity,
    );
    const order = orderRepo.create({
      so_number: body.soNumber || body.so_number,
      wa_number: body.waNumber || body.wa_number,
      item_code: body.itemCode || body.item_code,
      connectivity: body.connectivity || 'LoRaWAN',
      total_quantity: body.totalQuantity || body.total_quantity || 0,
      notes: body.notes || '',
      created_by: body.createdBy || 'system',
    });
    const saved = await orderRepo.save(order);
    return saved;
  }
}
