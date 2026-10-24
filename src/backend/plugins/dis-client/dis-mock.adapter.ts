import {
  DisSoSearchResponse,
  DisSoDetailResponse,
  DisSoSearchQuery,
} from './dis.types';

export class DisMockAdapter {
  private static mockOrders: DisSoDetailResponse[] = [
    {
      id: 101856,
      name: 'SO/2026/01856',
      date_order: '2026-10-15T08:30:00Z',
      partner_name: 'CONG TY TNHH KY THUAT VA DICH VU CONG NGHIEP ECO',
      partner_id: 4521,
      partner_email: 'procurement@eco-iot.vn',
      state: 'sale',
      amount_total: 125000000,
      currency: 'VND',
      commitment_date: '2026-10-30T17:00:00Z',
      note: 'Giao hàng đợt 1 cho dự án giám sát năng lượng nhà máy',
      client_order_ref: 'PO-ECO-2026-089',
      lines: [
        {
          id: 501,
          sequence: 1,
          line_type: 'section',
          name: 'Thiết bị cảm biến và Gateway LoRaWAN',
        },
        {
          id: 502,
          sequence: 2,
          line_type: 'product',
          product_id: 1089,
          product_name: 'Cảm biến nhiệt ẩm không dây LoRaWAN Daviteq',
          default_code: 'WSLRW-C-RS485-01',
          product_uom_qty: 50,
          qty_delivered: 0,
          price_unit: 1850000,
          name: '[WSLRW-C-RS485-01] Cảm biến nhiệt ẩm không dây LoRaWAN Daviteq',
        },
        {
          id: 503,
          sequence: 3,
          line_type: 'product',
          product_id: 1092,
          product_name: 'Cảm biến áp suất đường ống RS485 / LoRaWAN',
          default_code: 'WS433-CL-01',
          product_uom_qty: 20,
          qty_delivered: 0,
          price_unit: 1625000,
          name: '[WS433-CL-01] Cảm biến áp suất đường ống',
        },
        {
          id: 504,
          sequence: 4,
          line_type: 'note',
          name: 'Bao gồm kiểm tra đầy đủ tem nhãn và cấu hình AppKey trước khi xuất xưởng.',
        },
      ],
    },
    {
      id: 101857,
      name: 'SO/2026/01857',
      date_order: '2026-10-18T10:15:00Z',
      partner_name: 'TAP DOAN DIEN LUC MIEN NAM',
      partner_id: 3102,
      partner_email: 'support@evnspc.vn',
      state: 'sale',
      amount_total: 89000000,
      currency: 'VND',
      commitment_date: '2026-11-05T17:00:00Z',
      note: 'Dự án thí nghiệm trạm biến áp',
      client_order_ref: 'EVN-SPC-2026-441',
      lines: [
        {
          id: 505,
          sequence: 1,
          line_type: 'product',
          product_id: 1089,
          product_name: 'Cảm biến nhiệt ẩm không dây LoRaWAN Daviteq',
          default_code: 'WSLRW-C-RS485-01',
          product_uom_qty: 30,
          qty_delivered: 0,
          price_unit: 1850000,
          name: '[WSLRW-C-RS485-01] Cảm biến nhiệt ẩm không dây LoRaWAN Daviteq',
        },
      ],
    },
    {
      id: 101858,
      name: 'SO/2026/01858',
      date_order: '2026-10-20T14:00:00Z',
      partner_name: 'CONG TY CO PHAN CAP NUOC SAWACO',
      partner_id: 5542,
      partner_email: 'tech@sawaco.com.vn',
      state: 'done',
      amount_total: 45000000,
      currency: 'VND',
      commitment_date: '2026-10-22T17:00:00Z',
      note: 'Đơn hàng bổ sung bảo dưỡng',
      client_order_ref: 'SWC-MAINT-2026',
      lines: [
        {
          id: 506,
          sequence: 1,
          line_type: 'product',
          product_id: 1092,
          product_name: 'Cảm biến áp suất đường ống RS485 / LoRaWAN',
          default_code: 'WS433-CL-01',
          product_uom_qty: 15,
          qty_delivered: 15,
          price_unit: 1625000,
          name: '[WS433-CL-01] Cảm biến áp suất đường ống',
        },
      ],
    },
  ];

  static searchOrders(query: DisSoSearchQuery): DisSoSearchResponse {
    let filtered = [...this.mockOrders];

    if (query.year) {
      filtered = filtered.filter((order) => {
        const orderYear = new Date(order.date_order).getUTCFullYear();
        return orderYear === Number(query.year);
      });
    }

    if (query.month) {
      filtered = filtered.filter((order) => {
        const orderMonth = new Date(order.date_order).getUTCMonth() + 1;
        return orderMonth === Number(query.month);
      });
    }

    if (query.states && query.states !== 'all') {
      const stateList = query.states.split(',').map((s) => s.trim().toLowerCase());
      filtered = filtered.filter((order) => stateList.includes(order.state.toLowerCase()));
    }

    if (query.q && query.q.trim()) {
      const qLower = query.q.trim().toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.name.toLowerCase().includes(qLower) ||
          order.partner_name.toLowerCase().includes(qLower) ||
          (order.client_order_ref && order.client_order_ref.toLowerCase().includes(qLower)),
      );
    }

    const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100);
    const sliced = filtered.slice(0, limit);

    return {
      items: sliced.map((order) => ({
        id: order.id,
        name: order.name,
        date_order: order.date_order,
        partner_name: order.partner_name,
        state: order.state,
        amount_total: order.amount_total,
        currency: order.currency,
        commitment_date: order.commitment_date,
      })),
      has_more: filtered.length > limit,
      next_cursor: filtered.length > limit ? 'mock_cursor_next' : null,
      total_matching: filtered.length,
    };
  }

  static getOrderDetail(id: number | string): DisSoDetailResponse | null {
    const numId = Number(id);
    const found = this.mockOrders.find(
      (order) => order.id === numId || order.name.toLowerCase() === String(id).toLowerCase(),
    );
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }
}
