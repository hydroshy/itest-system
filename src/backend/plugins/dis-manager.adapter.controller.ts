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

    // Process product lines into Work Authorizations (WA)
    const productLines = (orderDetail.lines || []).filter(
      (line) => line.line_type === 'product' && (line.default_code || line.product_name),
    );

    const createdWas = [];
    const existingWas = await waRepo.find({ where: { so_id: so.id } });

    for (let i = 0; i < productLines.length; i++) {
      const line = productLines[i];
      const itemCode = line.default_code || `PRODUCT-${line.product_id || i + 1}`;
      const plannedQty = Number(line.product_uom_qty) || 0;

      const soNumMatches = cleanSoNumber.match(/(\d{4})\/(\d+)/);
      const yearStr = soNumMatches ? soNumMatches[1] : new Date().getFullYear().toString();
      const seqStr = soNumMatches ? soNumMatches[2] : String(orderDetail.id || 1);
      const lineIndexStr = String(i + 1).padStart(2, '0');
      const waNumberCandidate = `WA/${yearStr}/${seqStr}-${lineIndexStr}`;

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
      } else {
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
