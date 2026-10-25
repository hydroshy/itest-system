export interface DisSoSearchQuery {
  year?: number;
  month?: number;
  date_from?: string;
  date_to?: string;
  states?: string;
  q?: string;
  limit?: number;
  cursor?: string;
  embed?: string;
  updated_since?: string;
}

export interface DisWaLot {
  id: number;
  serial_number: string;
  quantity?: number;
  product_id?: number;
  write_date?: string;
  lot_name?: string;
}

export interface DisWaLine {
  id: number;
  item_code?: string | null;
  product_name?: string | null;
  product_uom_qty?: number;
  quantity?: number;
  uom?: { id?: number; name?: string } | null;
  wa_code?: string;
  state?: { code?: string; label?: string } | string;
  warranty_status?: { code?: string; label?: string } | string;
  state_info?: { code?: string; label?: string } | null;
  lots?: DisWaLot[];
  description?: string;
  sequence?: number;
  line_type?: string;
  write_date?: string;
  variant_id?: number | null;
  template_id?: number | null;
  ordering_code?: string | null;
}

export interface DisWaInfo {
  id: number;
  wa_code: string;
  url?: string;
  state?: { code?: string; label?: string } | string;
  warranty_status?: { code?: string; label?: string } | string;
  sales_orders?: Array<{ id: number; number: string; url?: string }>;
  lines?: DisWaLine[];
  write_date?: string;
}

export interface DisSoItemSummary {
  id: number;
  name: string; // e.g. "SO/2026/01856"
  number?: string;
  url?: string;
  date_order: string;
  order_date?: string;
  partner_name: string;
  partner_email?: string | null;
  technical_contact?: { id?: number; name?: string; email?: string | null } | null;
  technical_contact_status?: string;
  contact_person?: { id?: number; name?: string; email?: string | null } | null;
  contact_status?: string;
  state: 'draft' | 'sent' | 'sale' | 'done' | 'cancel' | string | { code?: string; label?: string };
  amount_total?: number;
  currency?: string;
  commitment_date?: string | null;
  lines?: DisSoOrderLine[];
  items?: DisSoOrderLine[];
  wa?: DisWaInfo[];
  wa_source?: string;
  customer?: any;
  company?: any;
  write_date?: string;
}

export interface DisSoSearchResponse {
  items: DisSoItemSummary[];
  data?: DisSoItemSummary[];
  next_cursor?: string | null;
  has_more: boolean;
  total_matching?: number;
  pagination?: {
    limit?: number;
    has_more?: boolean;
    next_cursor?: string | null;
    consistency?: string;
  };
}

export interface DisSoOrderLine {
  id: number;
  sequence?: number;
  line_type: 'product' | 'item' | 'section' | 'note' | string;
  product_id?: number | null;
  product_name?: string | null;
  default_code?: string | null; // SKU / Item Code (e.g. WSLRW-C-RS485-01)
  ordering_code?: string | null;
  product_uom_qty?: number;
  quantity?: number;
  qty_delivered?: number;
  qty_invoiced?: number;
  price_unit?: number;
  name?: string; // Description or note content
  description?: string;
  template_id?: number;
  variant_id?: number;
  uom?: { id?: number; name?: string };
}

export interface DisSoDetailResponse {
  id: number;
  name: string;
  number?: string;
  url?: string;
  date_order: string;
  order_date?: string;
  partner_name: string;
  partner_id?: number;
  partner_email?: string | null;
  technical_contact?: { id?: number; name?: string; email?: string | null } | null;
  technical_contact_status?: string;
  contact_person?: { id?: number; name?: string; email?: string | null } | null;
  contact_status?: string;
  state: string;
  amount_total?: number;
  currency?: string;
  commitment_date?: string | null;
  note?: string | null;
  client_order_ref?: string | null;
  lines: DisSoOrderLine[];
  items?: DisSoOrderLine[];
  wa?: DisWaInfo[];
  wa_source?: string;
  customer?: any;
  company?: any;
  write_date?: string;
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
