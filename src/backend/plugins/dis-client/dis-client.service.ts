import { Injectable, Logger } from '@nestjs/common';
import {
  DisConfigStatus,
  DisSoDetailResponse,
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

      return data as DisSoSearchResponse;
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

    await this.waitForSlot();
    try {
      const url = new URL(`/api/v1/sales-orders/${id}`, this.baseUrl);
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

      if (!response.ok) {
        const errorMsg = data?.error?.message || data?.message || response.statusText;
        this.logger.error(`DIS API error ${response.status}: ${errorMsg}`);
        throw new Error(`DIS API Error [${response.status}]: ${errorMsg}`);
      }

      return data as DisSoDetailResponse;
    } catch (err: any) {
      this.logger.error(`Failed to get DIS Sales Order detail ${id}: ${err.message}`);
      throw err;
    } finally {
      this.releaseSlot();
    }
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
          Authorization: `Bearer ${this.token}`,
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
