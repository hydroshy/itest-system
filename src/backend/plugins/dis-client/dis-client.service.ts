import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  DisConfigStatus,
  DisSoDetailResponse,
  DisSoItemSummary,
  DisSoSearchQuery,
  DisSoSearchResponse,
  DisTestQueryParams,
  DisTestQueryResult,
} from './dis.types';
import { DisMockAdapter } from './dis-mock.adapter';

@Injectable()
export class DisClientService {
  private readonly logger = new Logger(DisClientService.name);

  // Rate Limiting & Concurrency controls
  private readonly RATE_LIMIT_PER_MINUTE = 30;
  private readonly MAX_CONCURRENT = 1; // Strict 1 concurrent request as defensive safety
  private activeRequests = 0;
  private requestTimestamps: number[] = [];

  private get baseUrl(): string {
    return (
      process.env.DIS_SO_API_URL ||
      process.env.DIS_API_BASE_URL ||
      'https://dis-so.daviteq.com'
    ).replace(/\/+$/, '');
  }

  private get token(): string | null {
    const raw = process.env.DIS_SO_TOKEN || process.env.DIS_API_TOKEN;
    if (!raw || !raw.trim()) return null;
    const trimmed = raw.trim();
    // Normalize: strip optional leading "Bearer " (case-insensitive) so this.token is the clean token
    return trimmed.replace(/^Bearer\s+/i, '');
  }

  private get authHeader(): string {
    return this.token ? `Bearer ${this.token}` : '';
  }

  public get isMockMode(): boolean {
    const mockEnv = process.env.DIS_SO_MOCK_ENABLED || process.env.DIS_MOCK_MODE;
    if (mockEnv === 'true') return true;
    if (mockEnv === 'false') return false;
    // Auto-fallback: If no token provided, default to mock mode so UI doesn't break
    return !this.token;
  }

  public getStatus(): DisConfigStatus {
    const rawToken = process.env.DIS_SO_TOKEN || process.env.DIS_API_TOKEN;
    const tokenPreview = rawToken
      ? `${rawToken.substring(0, 4)}...${rawToken.substring(rawToken.length - 4)}`
      : 'NONE';

    return {
      enabled: true,
      mockMode: this.isMockMode,
      apiUrl: this.baseUrl,
      tokenConfigured: !!this.token,
      tokenMasked: tokenPreview,
      rateLimit: this.RATE_LIMIT_PER_MINUTE,
      concurrencyLimit: this.MAX_CONCURRENT,
    };
  }

  private async waitForSlot(): Promise<void> {
    const now = Date.now();
    // Clear timestamps older than 60s
    this.requestTimestamps = this.requestTimestamps.filter((t) => now - t < 60000);

    if (this.requestTimestamps.length >= this.RATE_LIMIT_PER_MINUTE) {
      const oldest = this.requestTimestamps[0];
      const waitTime = Math.max(0, 60000 - (now - oldest)) + 100;
      this.logger.warn(`DIS Rate limit throttling: sleeping ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    if (this.activeRequests >= this.MAX_CONCURRENT) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.waitForSlot();
    }

    this.activeRequests++;
    this.requestTimestamps.push(Date.now());
  }

  private releaseSlot(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
  }

  public async searchOrders(query: DisSoSearchQuery): Promise<DisSoSearchResponse> {
    if (this.isMockMode) {
      this.logger.log(`[MOCK MODE] Search DIS Sales Orders with params: ${JSON.stringify(query)}`);
      return DisMockAdapter.searchOrders(query);
    }

    await this.waitForSlot();
    try {
      const url = new URL('/api/v1/sales-orders/search', this.baseUrl);
      if (query.year) url.searchParams.set('year', String(query.year));
      if (query.month) url.searchParams.set('month', String(query.month));
      if (query.date_from) url.searchParams.set('date_from', String(query.date_from));
      if (query.date_to) url.searchParams.set('date_to', String(query.date_to));
      if (query.states) url.searchParams.set('states', String(query.states));
      if (query.q) url.searchParams.set('q', String(query.q));
      if (query.limit) url.searchParams.set('limit', String(query.limit));
      if (query.cursor) url.searchParams.set('cursor', String(query.cursor));

      this.logger.log(`Calling DIS API: GET ${url.pathname}${url.search}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(35000),
      });

      const data = await response.json().catch(() => null);
      this.logger.log(
        `DIS API Response status=${response.status} ok=${response.ok} itemsCount=${
          Array.isArray(data?.items) ? data.items.length : 0
        }`,
      );

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || response.statusText;
        this.logger.error(`DIS API error ${response.status}: ${errorMsg}`);
        throw new Error(`DIS API Error [${response.status}]: ${errorMsg}`);
      }

      const rawItems = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
      const items = rawItems.map((item: any) => this.normalizeOrderItem(item));

      return {
        total_matching: data?.total ?? data?.total_matching ?? items.length,
        has_more: !!data?.has_more,
        next_cursor: data?.next_cursor ?? null,
        items,
        data: items,
      } as any;
    } catch (err: any) {
      this.logger.error(`Failed to search DIS Sales Orders: ${err.message}`);
      throw err;
    } finally {
      this.releaseSlot();
    }
  }

  public async getOrderDetail(id: number | string): Promise<DisSoDetailResponse> {
    if (this.isMockMode) {
      this.logger.log(`[MOCK MODE] Get DIS Sales Order detail id=${id}`);
      const detail = DisMockAdapter.getOrderDetail(id);
      if (!detail) {
        throw new Error(`Order ${id} not found in mock data`);
      }
      return detail;
    }

    const idStr = String(id).trim();

    // Direct fetch GET /api/v1/sales-orders/{id}
    await this.waitForSlot();
    try {
      const url = new URL(`/api/v1/sales-orders/${encodeURIComponent(idStr)}`, this.baseUrl);
      this.logger.log(`Calling DIS API: GET ${url.pathname}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(35000),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data) {
        return this.normalizeOrderDetail(data);
      }

      this.logger.warn(`Direct GET /api/v1/sales-orders/${idStr} returned ${response.status}`);
    } catch (err: any) {
      this.logger.warn(`Failed direct GET /api/v1/sales-orders/${idStr}: ${err.message}`);
    } finally {
      this.releaseSlot();
    }

    // If id is non-numeric (e.g. "SO/2026/01856"), resolve to numeric ID via exact lookup or search first
    if (!/^\d+$/.test(idStr)) {
      // 1. Try exact lookup by number: GET /api/v1/sales-orders?number=...
      await this.waitForSlot();
      try {
        const exactUrl = new URL('/api/v1/sales-orders', this.baseUrl);
        exactUrl.searchParams.set('number', idStr);
        this.logger.log(`Calling DIS API exact lookup: GET ${exactUrl.pathname}${exactUrl.search}`);
        const exactRes = await fetch(exactUrl.toString(), {
          method: 'GET',
          headers: {
            Authorization: this.authHeader,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(35000),
        });
        if (exactRes.ok) {
          const exactData = await exactRes.json().catch(() => null);
          if (exactData) {
            // If response is the full detail object directly
            if (exactData.lines || exactData.partner_email || exactData.customer_email || exactData.contact_person) {
              return this.normalizeOrderDetail(exactData);
            }
            // If response has id, fetch the detail by numeric id
            if (exactData.id && /^\d+$/.test(String(exactData.id))) {
              this.releaseSlot();
              return this.getOrderDetail(exactData.id);
            }
          }
        }
      } catch (err: any) {
        this.logger.warn(`Exact lookup for ${idStr} failed: ${err.message}`);
      } finally {
        this.releaseSlot();
      }

      // 2. Try search by q to resolve numeric ID
      try {
        const searchRes = await this.searchOrders({ q: idStr, limit: 10 });
        const found = searchRes.items?.find(
          (it: any) =>
            it.name === idStr ||
            it.number === idStr ||
            String(it.id) === idStr,
        );
        if (found && found.id && /^\d+$/.test(String(found.id))) {
          // If search item found, call getOrderDetail with the numeric ID to fetch full details including partner_email
          return this.getOrderDetail(found.id);
        }
      } catch (err: any) {
        this.logger.warn(`Fallback search for ${idStr} failed: ${err.message}`);
      }
    }

    throw new NotFoundException(`Sales Order ${id} not found in DIS`);
  }

  private normalizeOrderItem(item: any): DisSoItemSummary {
    const rawLines = Array.isArray(item.lines)
      ? item.lines
      : (Array.isArray(item.items) ? item.items : (Array.isArray(item.order_line) ? item.order_line : []));

    const normalizedLines = rawLines
      .map((line: any, idx: number) => {
        // Multi-level item code extraction:
        // 1. Explicit code fields: default_code, ordering_code, sku, product_code, item_code, product.sku, product.default_code
        // 2. Regex pattern in name / product_name / description: e.g. "[WSLRW-C-RS485-01] Sensor..." -> "WSLRW-C-RS485-01"
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

        let extractedCode = explicitCode;
        if (!extractedCode || extractedCode === 'N/A') {
          const textSources = [line.name, line.product_name, line.description, line.notes, line.product?.name];
          for (const text of textSources) {
            if (typeof text === 'string') {
              const match = text.match(/\[([A-Za-z0-9_.\-/]+)\]/);
              if (match && match[1]) {
                extractedCode = match[1].trim();
                break;
              }
            }
          }
        }

        const defaultCode = extractedCode || (line.product_id ? `PRODUCT-${line.product_id}` : `ITEM-${idx + 1}`);
        return {
          id: line.id ?? idx + 1,
          sequence: line.sequence ?? idx + 1,
          line_type: line.line_type || 'product',
          product_id: line.product_id ?? line.variant_id ?? line.template_id ?? line.product?.id ?? null,
          product_name: line.product_name ?? line.description ?? line.product?.name ?? line.name ?? defaultCode,
          default_code: defaultCode,
          product_uom_qty: Number(line.product_uom_qty ?? line.quantity ?? line.qty) || 0,
          qty_delivered: Number(line.qty_delivered ?? line.delivered_quantity ?? line.delivered_qty) || 0,
          qty_invoiced: Number(line.qty_invoiced ?? line.invoiced_quantity ?? line.invoiced_qty) || 0,
          name: line.name ?? line.description ?? line.product?.name ?? line.notes ?? defaultCode,
          ordering_code: defaultCode,
          description: line.description ?? line.product_name ?? line.name ?? '',
        };
      })
      .filter((line: any) => line.default_code && line.default_code !== 'N/A');

    const stateCode = typeof item.state === 'object' && item.state !== null
      ? (item.state.code || item.state.label || 'sale')
      : (item.state || 'sale');

    const partnerEmail =
      item.partner_email ??
      item.customer_email ??
      item.customer?.email ??
      item.partner_id?.email ??
      item.contact_person?.email ??
      item.partner?.email ??
      item.contact?.email ??
      item.email ??
      null;

    return {
      id: item.id ?? item.odoo_id,
      name: item.name ?? item.number ?? `SO-${item.id}`,
      number: item.number ?? item.name,
      date_order: item.date_order ?? item.order_date ?? new Date().toISOString(),
      partner_name: item.partner_name ?? item.customer?.name ?? (typeof item.customer === 'string' ? item.customer : '—'),
      partner_email: partnerEmail,
      state: stateCode,
      currency: item.currency ?? item.currency_id ?? 'VND',
      commitment_date: item.commitment_date ?? null,
      lines: normalizedLines,
      items: normalizedLines,
      ...(item.customer ? { customer: item.customer } : {}),
      ...(item.company ? { company: item.company } : {}),
    } as any;
  }

  private normalizeOrderDetail(data: any): DisSoDetailResponse {
    // If the DIS detail response wraps the order in an inner object or data field
    const raw = data?.data && typeof data.data === 'object' ? data.data : data;
    const item = this.normalizeOrderItem(raw);
    const partnerEmail =
      raw.partner_email ??
      raw.customer_email ??
      raw.customer?.email ??
      raw.partner_id?.email ??
      raw.contact_person?.email ??
      raw.email ??
      (item as any).partner_email ??
      null;

    return {
      ...item,
      partner_id: raw.partner_id ?? raw.customer?.id,
      partner_email: partnerEmail,
      lines: (item as any).lines || [],
    } as any;
  }

  public async executeTestQuery(queryParams: DisTestQueryParams): Promise<DisTestQueryResult> {
    const startTime = Date.now();
    const endpoint = (queryParams.endpoint || '/api/v1/sales-orders/search').trim();

    if (this.isMockMode) {
      this.logger.log(`[MOCK MODE] executeTestQuery: ${endpoint}`);
      await new Promise((r) => setTimeout(r, 60)); // Simulate realistic network latency
      let mockData: any = null;

      if (endpoint.includes('/health')) {
        mockData = {
          status: 'ok',
          service: 'dis-so-mock',
          version: '1.1.0',
          timestamp: new Date().toISOString(),
        };
      } else if (endpoint.includes('/sales-orders/') && queryParams.id) {
        mockData = DisMockAdapter.getOrderDetail(queryParams.id);
      } else {
        const query: DisSoSearchQuery = {
          year: queryParams.params?.year ? Number(queryParams.params.year) : undefined,
          month: queryParams.params?.month ? Number(queryParams.params.month) : undefined,
          states: queryParams.params?.states || 'sale',
          q: queryParams.params?.q,
          limit: queryParams.params?.limit ? Number(queryParams.params.limit) : 10,
        };
        mockData = DisMockAdapter.searchOrders(query);
      }

      return {
        success: true,
        statusCode: 200,
        durationMs: Date.now() - startTime,
        mockMode: true,
        requestUrl: `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`,
        data: mockData,
      };
    }

    // Live execution
    await this.waitForSlot();
    try {
      const url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, this.baseUrl);
      if (queryParams.params && typeof queryParams.params === 'object') {
        for (const [k, v] of Object.entries(queryParams.params)) {
          if (v !== undefined && v !== null && v !== '') {
            url.searchParams.set(k, String(v));
          }
        }
      }

      const response = await fetch(url.toString(), {
        method: queryParams.method || 'GET',
        headers: {
          Authorization: this.authHeader,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(35000),
      });

      const responseData = await response.json().catch(() => null);
      const durationMs = Date.now() - startTime;

      return {
        success: response.ok,
        statusCode: response.status,
        durationMs,
        mockMode: false,
        requestUrl: url.toString(),
        data: responseData,
        error: !response.ok ? responseData?.error?.message || response.statusText : undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        durationMs: Date.now() - startTime,
        mockMode: false,
        requestUrl: `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`,
        data: null,
        error: err.message,
      };
    } finally {
      this.releaseSlot();
    }
  }
}
