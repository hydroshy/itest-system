import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DisClientService } from './dis-client/dis-client.service';
import { DisSoSearchQuery, DisTestQueryParams } from './dis-client/dis.types';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { TraceabilitySoEntity } from '../core-models/traceability-so.entity';
import { TraceabilityWaEntity } from '../core-models/traceability-wa.entity';

@Controller()
export class DisManagerAdapterController {
  private readonly logger = new Logger(DisManagerAdapterController.name);

  constructor(
    private readonly disClientService: DisClientService,
    private readonly databaseService: DynamicDatabaseService,
  ) {}

  // 1. Connection & Diagnostic Status
  @Get([
    'api/plugins/dis-manager/status',
    'api/v1/plugins/dis-manager/status',
    'api/plugins/dis/status',
  ])
  getStatus() {
    const disStatus = this.disClientService.getStatus();
    return {
      plugin: 'dis-manager',
      version: '1.0.0',
      status: 'online',
      connected: !this.disClientService.isMockMode && disStatus.tokenConfigured,
      isMock: this.disClientService.isMockMode,
      tokenConfigured: disStatus.tokenConfigured,
      tokenMasked: disStatus.tokenMasked,
      apiUrl: disStatus.apiUrl,
      dis: disStatus,
      timestamp: new Date().toISOString(),
    };
  }

  // 2. Search DIS Orders
  @Get([
    'api/plugins/dis-manager/sales-orders/search',
    'api/plugins/dis-manager/sales-orders',
    'api/plugins/dis-manager/orders',
    'api/v1/plugins/dis-manager/orders',
    'api/plugins/dis/orders',
  ])
  async searchOrders(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
    @Query('states') states?: string,
    @Query('state') state?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const query: DisSoSearchQuery = {
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      date_from: dateFrom,
      date_to: dateTo,
      states: states || state || 'sale',
      q,
      limit: limit ? Number(limit) : 25,
      cursor,
    };
    return this.disClientService.searchOrders(query);
  }

  // 3. Get Detail of single Order
  @Get([
    'api/plugins/dis-manager/sales-orders/:id',
    'api/plugins/dis-manager/orders/:id',
    'api/v1/plugins/dis-manager/orders/:id',
    'api/plugins/dis/orders/:id',
  ])
  async getOrderDetail(@Param('id') id: string) {
    if (!id || !id.trim()) {
      throw new BadRequestException('Order id or name is required');
    }
    return this.disClientService.getOrderDetail(id.trim());
  }

  // 4. API Sandbox & Explorer query endpoint
  @Post([
    'api/plugins/dis-manager/test-query',
    'api/v1/plugins/dis-manager/test-query',
    'api/plugins/dis/test-query',
  ])
  async executeTestQuery(@Body() payload: DisTestQueryParams) {
    return this.disClientService.executeTestQuery(payload || {});
  }

  // 5. Trigger Synchronization of SO into Traceability
  @Post([
    'api/plugins/dis-manager/sales-orders/:id/sync',
    'api/plugins/dis-manager/sync/:id',
    'api/v1/plugins/dis-manager/sync/:id',
    'api/plugins/dis/sync/:id',
  ])
  async syncOrder(@Param('id') id: string) {
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

    // Find or create SO
    let so = await soRepo.findOne({ where: { so_number: cleanSoNumber } });
    if (!so) {
      so = soRepo.create({
        so_number: cleanSoNumber,
        customer_name: orderDetail.partner_name ? orderDetail.partner_name.trim() : null,
        notes: [
          `DIS SO ID: ${orderDetail.id}`,
          orderDetail.client_order_ref ? `Ref: ${orderDetail.client_order_ref}` : null,
          orderDetail.note ? `Note: ${orderDetail.note}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      });
      so = await soRepo.save(so);
      this.logger.log(`Created new SO ${so.so_number} from DIS manager sync`);
    } else {
      if (orderDetail.partner_name && so.customer_name !== orderDetail.partner_name) {
        so.customer_name = orderDetail.partner_name;
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
        line.barcode ??
        line.product?.sku ??
        line.product?.default_code ??
        line.product?.code ??
        line.product?.barcode ??
        ''
      ).trim();

      if (explicitCode && explicitCode !== 'N/A') return explicitCode;

      let odooProductName = '';
      let odooProductId: any = null;
      if (Array.isArray(line.product_id) && line.product_id.length > 0) {
        odooProductId = line.product_id[0];
        if (typeof line.product_id[1] === 'string') {
          odooProductName = line.product_id[1].trim();
        }
      } else if (typeof line.product_id === 'object' && line.product_id !== null) {
        odooProductId = line.product_id.id;
        odooProductName = line.product_id.name || line.product_id.display_name || '';
        if (line.product_id.default_code || line.product_id.code) {
          const c = String(line.product_id.default_code || line.product_id.code).trim();
          if (c && c !== 'N/A') return c;
        }
      } else {
        odooProductId = line.product_id;
      }

      const textSources = [
        line.name,
        line.product_name,
        odooProductName,
        line.description,
        line.notes,
        line.product?.name,
      ];
      for (const text of textSources) {
        if (typeof text === 'string') {
          const match = text.match(/\[([A-Za-z0-9_.\-/]+)\]/);
          if (match && match[1]) return match[1].trim();
        }
      }

      const rawName = String(line.name || line.product_name || odooProductName || '').trim();
      const bracketMatch = rawName.match(/^\[(.*?)\]/);
      if (bracketMatch && bracketMatch[1]) {
        return bracketMatch[1].trim();
      } else if (rawName && !rawName.includes(' ') && rawName.length <= 40) {
        return rawName;
      }

      if (odooProductId) return `PRODUCT-${odooProductId}`;
      return '';
    };

    // Process product lines into Work Authorizations (WA)
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
    const disWas = Array.isArray(orderDetail.wa) ? orderDetail.wa : [];

    if (disWas.length > 0) {
      for (const waItem of disWas) {
        const rawWaCode = (waItem.wa_code || '').trim();
        const waNumber = rawWaCode || `WA-${waItem.id}`;
        const waLines = Array.isArray(waItem.lines) ? waItem.lines : [];

        // Aggregate planned quantity and collect notes across lines for this WA
        const totalPlannedQty = waLines.reduce((acc: number, line: any) => acc + Number(line.product_uom_qty || line.quantity || 0), 0);
        const primaryItemCode = waLines.length > 0 ? ((waLines[0].item_code || waLines[0].ordering_code || '').trim() || null) : null;

        const lineProducts = waLines.map((l: any) => l.product_name).filter(Boolean);
        const waNotes = [
          `DIS WA ID: ${waItem.id}`,
          waItem.url ? `URL: ${waItem.url}` : null,
          waItem.state ? `State: ${typeof waItem.state === 'object' ? (waItem.state.label || waItem.state.code) : waItem.state}` : null,
          waItem.warranty_status ? `Warranty: ${typeof waItem.warranty_status === 'object' ? (waItem.warranty_status.label || waItem.warranty_status.code) : waItem.warranty_status}` : null,
          lineProducts.length > 0 ? `Products: ${lineProducts.join(', ')}` : null,
        ].filter(Boolean).join(' | ');

        let wa = existingWas.find((w) => w.wa_number === waNumber || (primaryItemCode && w.item_code === primaryItemCode && w.so_id === so.id));

        if (!wa) {
          wa = waRepo.create({
            so_id: so.id,
            wa_number: waNumber,
            item_code: primaryItemCode,
            planned_quantity: totalPlannedQty,
            notes: waNotes,
          });
          wa = await waRepo.save(wa);
        } else {
          let needsUpdate = false;
          if (wa.wa_number !== waNumber) {
            wa.wa_number = waNumber;
            needsUpdate = true;
          }
          if (totalPlannedQty > 0 && wa.planned_quantity !== totalPlannedQty) {
            wa.planned_quantity = totalPlannedQty;
            needsUpdate = true;
          }
          if (primaryItemCode && !wa.item_code) {
            wa.item_code = primaryItemCode;
            needsUpdate = true;
          }
          if (waNotes && wa.notes !== waNotes) {
            wa.notes = waNotes;
            needsUpdate = true;
          }
          if (needsUpdate) {
            await waRepo.save(wa);
          }
        }
        createdWas.push(wa);
      }
    } else {
      // Fallback: derive WA from SO productLines
      // Format: WA/xxxx/xxxxx (e.g. WA/2026/01856) strictly without line index suffix
      const soNumMatches = cleanSoNumber.match(/(\d{4})\/(\d+)/);
      const yearStr = soNumMatches ? soNumMatches[1] : new Date().getFullYear().toString();
      const seqStr = soNumMatches ? soNumMatches[2] : String(orderDetail.id || 1);
      const waNumberCandidate = `WA/${yearStr}/${seqStr}`;

      const totalPlannedQty = productLines.reduce(
        (acc: number, l: any) => acc + (Number(l.product_uom_qty || l.quantity || l.qty) || 0),
        0,
      );
      const primaryItemCode = productLines
        .map((l: any) => resolveItemCode(l))
        .filter(Boolean)[0] || null;

      const productDescriptions = productLines
        .map((l: any, idx: number) => l.name || l.product_name || `Line #${l.id || idx + 1}`)
        .join(', ');

      let wa = existingWas.find(
        (w) => w.wa_number === waNumberCandidate || w.so_id === so.id,
      );

      if (!wa) {
        wa = waRepo.create({
          so_id: so.id,
          wa_number: waNumberCandidate,
          item_code: primaryItemCode,
          planned_quantity: totalPlannedQty,
          notes: productDescriptions || `Derived from SO ${cleanSoNumber}`,
        });
        wa = await waRepo.save(wa);
        createdWas.push(wa);
      } else {
        let needsUpdate = false;
        if (wa.wa_number !== waNumberCandidate) {
          wa.wa_number = waNumberCandidate;
          needsUpdate = true;
        }
        if (totalPlannedQty > 0 && wa.planned_quantity !== totalPlannedQty) {
          wa.planned_quantity = totalPlannedQty;
          needsUpdate = true;
        }
        if (primaryItemCode && wa.item_code !== primaryItemCode) {
          wa.item_code = primaryItemCode;
          needsUpdate = true;
        }
        if (needsUpdate) {
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
}
