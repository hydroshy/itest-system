export interface DisSoSearchQuery {
  year?: number;
  month?: number;
  date_from?: string;
  date_to?: string;
  states?: string;
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface DisSoItemSummary {
  id: number;
  name: string; // e.g. "SO/2026/01856"
  number?: string;
  date_order: string;
  partner_name: string;
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel' | string;
  amount_total?: number;
  currency?: string;
  commitment_date?: string | null;
  lines?: DisSoOrderLine[];
  items?: DisSoOrderLine[];
  customer?: any;
  company?: any;
}

export interface DisSoSearchResponse {
  items: DisSoItemSummary[];
  data?: DisSoItemSummary[];
  next_cursor?: string | null;
  has_more: boolean;
  total_matching?: number;
}

export interface DisSoOrderLine {
  id: number;
  sequence?: number;
  line_type: 'product' | 'section' | 'note' | string;
  product_id?: number | null;
  product_name?: string | null;
  default_code?: string | null; // SKU / Item Code (e.g. WSLRW-C-RS485-01)
  product_uom_qty?: number;
  qty_delivered?: number;
  qty_invoiced?: number;
  price_unit?: number;
  name?: string; // Description or note content
}

export interface DisSoDetailResponse {
  id: number;
  name: string;
  date_order: string;
  partner_name: string;
  partner_id?: number;
  partner_email?: string | null;
  state: string;
  amount_total?: number;
  currency?: string;
  commitment_date?: string | null;
  note?: string | null;
  client_order_ref?: string | null;
  lines: DisSoOrderLine[];
}

export interface DisConfigStatus {
  enabled: boolean;
  mockMode: boolean;
  apiUrl: string;
  tokenConfigured: boolean;
  tokenMasked?: string;
  rateLimit: number;
  concurrencyLimit: number;
}

export interface DisTestQueryParams {
  endpoint?: string;
  method?: 'GET' | 'POST';
  params?: Record<string, any>;
  id?: string | number;
}

export interface DisTestQueryResult {
  success: boolean;
  statusCode: number;
  durationMs: number;
  mockMode: boolean;
  requestUrl: string;
  data: any;
  error?: string;
}
