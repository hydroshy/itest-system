import { Injectable, Logger } from '@nestjs/common';
import { DynamicDatabaseService } from '../../../database/dynamic-database.service';
import { MenuItemDto } from './dto/menu.dto';

export const SYSTEM_MENU_ITEMS: MenuItemDto[] = [
  {
    id: 'dashboard',
    title: 'Bảng điều khiển',
    description: 'Tổng quan hệ thống, trạng thái dịch vụ và phân quyền quản trị menu',
    icon: 'Odometer',
    route: '/dashboard',
    category: 'system',
    order: 1,
  },
  {
    id: 'final-config:tool',
    title: 'Final Config Tool',
    description: 'Nạp cấu hình thiết bị tự động qua Web Serial và kiểm thử 4 công đoạn',
    icon: 'Cpu',
    route: '/plugins/final-config?tab=tool',
    pluginId: 'final-config',
    tab: 'tool',
    category: 'plugin',
    order: 2,
  },
  {
    id: 'final-config:manager',
    title: 'Final Config Manager',
    description: 'Quản lý, tìm kiếm và tra cứu danh sách profile Final Config',
    icon: 'Document',
    route: '/plugins/final-config?tab=manager',
    pluginId: 'final-config',
    tab: 'manager',
    category: 'plugin',
    order: 3,
  },
  {
    id: 'final-config:create',
    title: 'Tạo Final Config',
    description: 'Tạo mới cấu hình thiết bị từ Memmap Payload template',
    icon: 'CirclePlus',
    route: '/plugins/final-config?tab=create',
    pluginId: 'final-config',
    tab: 'create',
    category: 'plugin',
    order: 4,
  },
  {
    id: 'device:manage',
    title: 'Thiết Bị (Devices)',
    description: 'Quản lý danh sách thiết bị IoT, liên kết dữ liệu Traceability (SO/WA/Item Code) và trạng thái hoạt động độc lập',
    icon: 'Cpu',
    route: '/plugins/device',
    pluginId: 'device',
    category: 'plugin',
    order: 5,
  },
  {
    id: 'device-traceability:so',
    title: 'Sales Orders & Work Authorizations',
    description: 'Quản lý cây đơn hàng SO, chỉ thị xuất kho WA và danh sách thiết bị',
    icon: 'List',
    route: '/plugins/device-traceability?tab=so',
    pluginId: 'device-traceability',
    tab: 'so',
    category: 'plugin',
    order: 5,
  },
  {
    id: 'device-traceability:devices',
    title: 'Device Traceability List',
    description: 'Tra cứu dòng đời thiết bị, lịch sử test và trạng thái hoàn thành',
    icon: 'Search',
    route: '/plugins/device-traceability?tab=devices',
    pluginId: 'device-traceability',
    tab: 'devices',
    category: 'plugin',
    order: 6,
  },
  {
    id: 'device-traceability:final-config',
    title: 'Final Config Devices List',
    description: 'Tra cứu danh sách thiết bị đã cấu hình final config và audit log',
    icon: 'Checked',
    route: '/plugins/device-traceability?tab=final-config',
    pluginId: 'device-traceability',
    tab: 'final-config',
    category: 'plugin',
    order: 7,
  },
  {
    id: 'memmap-payload:main',
    title: 'MEMMAP PAYLOAD',
    description: 'Quản lý bản đồ bộ nhớ (Memmap) và tải lên bảng thanh ghi thiết bị',
    icon: 'Layers',
    route: '/plugins/memmap-payload',
    pluginId: 'memmap-manager',
    category: 'plugin',
    order: 8,
  },
  {
    id: 'dis-manager:main',
    title: 'DIS Odoo Integration',
    description: 'Quản trị kết nối DIS API (Odoo), kiểm thử API Sandbox và đồng bộ Sales Orders vào iTest',
    icon: 'Connection',
    route: '/plugins/dis-manager',
    pluginId: 'dis-manager',
    category: 'plugin',
    order: 11,
  },
  {
    id: 'decoder:scripts',
    title: 'DECODER',
    description: 'Quản lý kịch bản giải mã Uplink payload thiết bị IoT, liên kết Item Code và FW Code',
    icon: 'Document',
    route: '/plugins/decoder?tab=list',
    pluginId: 'decoder',
    tab: 'list',
    category: 'plugin',
    order: 12,
  },
  {
    id: 'lorawan-chirpstack:integration',
    title: 'CHIRPSTACK',
    description: 'Đồng bộ Gateways, Applications và Live Frames từ Network Server ChirpStack',
    icon: 'Connection',
    route: '/plugins/lorawan-chirpstack?tab=overview',
    pluginId: 'lorawan-chirpstack',
    tab: 'overview',
    category: 'plugin',
    order: 10,
  },
  ...[
    { tab: 'tenants', title: 'LoRaWAN Tenants', icon: 'User', description: 'Quản lý tenant ChirpStack' },
    { tab: 'gateways', title: 'LoRaWAN Gateways', icon: 'Connection', description: 'Quản lý gateway LoRaWAN' },
    { tab: 'devices', title: 'LoRaWAN Devices', icon: 'Cpu', description: 'Quản lý thiết bị LoRaWAN' },
    { tab: 'telemetry', title: 'LoRaWAN Telemetry', icon: 'DataLine', description: 'Theo dõi uplink telemetry LoRaWAN' },
  ].map((view, index): MenuItemDto => ({
    ...view,
    id: `lorawan-chirpstack:${view.tab}`,
    route: `/plugins/lorawan-chirpstack?tab=${view.tab}`,
    pluginId: 'lorawan-chirpstack',
    category: 'plugin',
    order: 11 + index,
  })),
  {
    id: 'device:manage',
    title: 'Thiết Bị (Devices)',
    description: 'Quản lý danh sách thiết bị IoT, liên kết dữ liệu Traceability (SO/WA/Item Code)',
    icon: 'Cpu',
    route: '/plugins/device',
    pluginId: 'device',
    category: 'plugin',
    order: 14,
  },
  {
    id: 'decoder:scripts',
    title: 'DECODER',
    description: 'Quản lý các script giải mã LoRaWAN theo SKU và LONG_FW',
    icon: 'Document',
    route: '/plugins/decoder?tab=list',
    pluginId: 'decoder',
    tab: 'list',
    category: 'plugin',
    order: 15,
  },
  {
    id: 'testing:device-payload',
    title: 'DEVICE PAYLOAD',
    description: 'Giám sát trực tiếp dữ liệu thô và payload đã giải mã từ trạm testing',
    icon: 'DataLine',
    route: '/plugins/testing?tab=device-payload',
    pluginId: 'testing',
    tab: 'device-payload',
    category: 'plugin',
    order: 16,
  },
  {
    id: 'testing:create-device-testing',
    title: 'CREATE DEVICE TESTING',
    description: 'Tạo mới phiên kiểm thử thiết bị (DUT), gắn kịch bản Flow và kích hoạt Auto Check',
    icon: 'CirclePlus',
    route: '/plugins/testing?tab=create-device-testing',
    pluginId: 'testing',
    tab: 'create-device-testing',
    category: 'plugin',
    order: 17,
  },
  {
    id: 'testing:list-device-testing',
    title: 'LIST DEVICE TESTING',
    description: 'Danh sách các thiết bị kiểm thử được tạo ra bởi Testing Suite',
    icon: 'List',
    route: '/plugins/testing?tab=list-device-testing',
    pluginId: 'testing',
    tab: 'list-device-testing',
    category: 'plugin',
    order: 18,
  },
  {
    id: 'testing:list-test-batch',
    title: 'LIST TEST BATCH',
    description: 'Danh sách và lịch sử các Test Batch đã thiết lập trong hệ thống',
    icon: 'ListFilter',
    route: '/plugins/testing?tab=list-test-batch',
    pluginId: 'testing',
    tab: 'list-test-batch',
    category: 'plugin',
    order: 19,
  },
  {
    id: 'testing:list-flow-simulation',
    title: 'LIST FLOW SIMULATION',
    description: 'Quản lý danh sách kịch bản mô phỏng kiểm thử (Simulation Flow Templates)',
    icon: 'Cpu',
    route: '/plugins/testing?tab=list-flow-simulation',
    pluginId: 'testing',
    tab: 'list-flow-simulation',
    category: 'plugin',
    order: 20,
  },
  {
    id: 'testing:list-device-simulation',
    title: 'LIST DEVICE SIMULATION',
    description: 'Quản lý danh sách thiết bị simulation độc lập',
    icon: 'Radio',
    route: '/plugins/testing?tab=list-device-simulation',
    pluginId: 'testing',
    tab: 'list-device-simulation',
    category: 'plugin',
    order: 21,
  },
  {
    id: 'testing:so-test-batch',
    title: 'SO TEST BATCH',
    description: 'Quản lý liên kết giữa Sale Order (SO) và Test Batch',
    icon: 'Layers',
    route: '/plugins/testing?tab=so-test-batch',
    pluginId: 'testing',
    tab: 'so-test-batch',
    category: 'plugin',
    order: 22,
  },
  {
    id: 'testing:create-test-batch',
    title: 'CREATE TEST BATCH',
    description: 'Khởi tạo cấu hình Test Batch với ITEM-CODE, LONG_FW, gán Simulation Flow tự động',
    icon: 'FolderPlus',
    route: '/plugins/testing?tab=create-test-batch',
    pluginId: 'testing',
    tab: 'create-test-batch',
    category: 'plugin',
    order: 23,
  },
  {
    id: 'testing:device-simulation',
    title: 'CREATE SIMULATION FLOW',
    description: 'Tạo kịch bản mô phỏng kiểm thử kết hợp Auto Check: Downlink, Delay, Cửa sổ đo',
    icon: 'Cpu',
    route: '/plugins/testing?tab=device-simulation',
    pluginId: 'testing',
    tab: 'device-simulation',
    category: 'plugin',
    order: 24,
  },
];

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  // In-memory fallback role assignments map
  private roleAssignmentsCache: Record<string, string[]> = {
    ADMIN: SYSTEM_MENU_ITEMS.map((item) => item.id),
    SUPER_ADMIN: SYSTEM_MENU_ITEMS.map((item) => item.id),
    ADMINISTRATOR: SYSTEM_MENU_ITEMS.map((item) => item.id),
    USER: ['dashboard', 'final-config:tool'],
    END_USER: ['dashboard', 'final-config:tool'],
    OPERATOR: [
      'dashboard',
      'device:manage',
      'dis-manager:main',
      'decoder:scripts',
      'final-config:tool',
      'device-traceability:so',
      'device-traceability:devices',
      'testing:gateway-sessions',
      'testing:simulation-devices',
      'testing:device-simulation',
      'testing:device-auto-check',
      'testing:packets',
      'testing:list-flow-simulation',
      'testing:list-device-simulation',
      'testing:so-test-batch',
      'so-test-batch:main',
      'testing:test-batch',
      'testing:create-test-batch',
      'testing:list-test-batch',
    ],
  };

  constructor(private readonly dbService: DynamicDatabaseService) {}

  /**
   * Lấy toàn bộ danh mục menu/card items
   */
  async getAllMenuItems(): Promise<MenuItemDto[]> {
    try {
      const ds = this.dbService.getDataSourceForTable('system_menu_items');
      if (ds && ds.isInitialized) {
        const rows = await ds.query(
          `SELECT id, title, description, icon, route, category, plugin_id as "pluginId", tab, display_order as "order" 
           FROM system_menu_items ORDER BY display_order ASC`
        );
        if (Array.isArray(rows) && rows.length > 0) {
          const normalizedRows: MenuItemDto[] = rows
            .filter((r: any) => r.id !== 'memmap-payload:upload' && r.id !== 'memmap-manager:upload' && r.id !== 'testing:create-device-testing')
            .map((r: any) => {
              if (
                r.id === 'memmap-payload:manager' ||
                r.id === 'memmap-payload:main' ||
                (!r.route || r.route.includes('/memmap-payload') || r.route.includes('tab=memmap'))
              ) {
                return {
                  ...r,
                  title: 'MEMMAP PAYLOAD',
                  icon: 'Files',
                  route: '/plugins/memmap-manager?tab=manager',
                  pluginId: 'memmap-manager',
                  tab: 'manager',
                };
              }
              return r;
            });
          // Keep existing IDs/permissions; expose newly introduced view cards even on older databases.
          for (const item of SYSTEM_MENU_ITEMS.filter(
            (item) => item.pluginId === 'lorawan-chirpstack' || item.pluginId === 'testing',
          )) {
            if (!normalizedRows.some((row) => row.id === item.id)) normalizedRows.push({ ...item });
          }
          normalizedRows.sort((a, b) => (a.order || 0) - (b.order || 0));
          const seen = new Set<string>();
          const deduplicated: MenuItemDto[] = [];
          for (const item of normalizedRows) {
            const key = (item.route || item.id || '').trim().toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              deduplicated.push(item);
            }
          }
          return deduplicated;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch system_menu_items from DB: ${err.message}. Using default list.`);
    }

    const seen = new Set<string>();
    const deduplicated: MenuItemDto[] = [];
    for (const item of SYSTEM_MENU_ITEMS) {
      const key = (item.route || item.id || '').trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(item);
      }
    }
    return deduplicated;
  }

  /**
   * Lấy ma trận phân quyền theo role
   */
  async getRoleAssignments(): Promise<Record<string, string[]>> {
    try {
      const ds = this.dbService.getDataSourceForTable('role_menu_permissions');
      if (ds && ds.isInitialized) {
        const rows = await ds.query(
          `SELECT role_code as "roleCode", menu_item_id as "menuItemId" FROM role_menu_permissions`
        );
        if (Array.isArray(rows) && rows.length > 0) {
          const result: Record<string, string[]> = {};
          for (const row of rows) {
            const role = (row.roleCode || '').toUpperCase();
            if (!result[role]) {
              result[role] = [];
            }
            if (row.menuItemId && !result[role].includes(row.menuItemId)) {
              result[role].push(row.menuItemId);
            }
          }
          // Merge with cache for any unassigned roles
          return { ...this.roleAssignmentsCache, ...result };
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch role_menu_permissions from DB: ${err.message}. Using cache.`);
    }

    return this.roleAssignmentsCache;
  }

  /**
   * Gán quyền menu cho một Role cụ thể
   */
  async assignRoleMenu(roleCode: string, menuItemIds: string[]): Promise<boolean> {
    const normalizedRole = (roleCode || '').trim().toUpperCase();
    if (!normalizedRole) {
      return false;
    }

    // Cập nhật in-memory cache trước
    this.roleAssignmentsCache[normalizedRole] = Array.isArray(menuItemIds) ? [...menuItemIds] : [];

    // Cập nhật persistent DB nếu bảng tồn tại
    try {
      const ds = this.dbService.getDataSourceForTable('role_menu_permissions');
      if (ds && ds.isInitialized) {
        await ds.query(`DELETE FROM role_menu_permissions WHERE UPPER(role_code) = $1`, [normalizedRole]);
        for (const itemId of menuItemIds) {
          await ds.query(
            `INSERT INTO role_menu_permissions (role_code, menu_item_id) VALUES ($1, $2)`,
            [normalizedRole, itemId]
          );
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed persisting role_menu_permissions to DB: ${err.message}. Saved in memory.`);
    }

    return true;
  }

  /**
   * Lấy danh sách Cards cho người dùng hiện tại theo vai trò (Roles)
   */
  async getCardsForRoles(roles: string[]): Promise<MenuItemDto[]> {
    const allItems = await this.getAllMenuItems();
    const roleMatrix = await this.getRoleAssignments();

    const normalizedRoles = (roles || []).map((r) => (r || '').trim().toUpperCase());

    const isSuperAdmin =
      normalizedRoles.includes('ADMIN') ||
      normalizedRoles.includes('SUPER_ADMIN') ||
      normalizedRoles.includes('ADMINISTRATOR');

    if (isSuperAdmin) {
      const adminAssignments = roleMatrix['ADMIN'] || roleMatrix['SUPER_ADMIN'];
      if (Array.isArray(adminAssignments) && adminAssignments.length > 0) {
        const allowedIds = new Set(adminAssignments);
        return allItems.filter((item) => allowedIds.has(item.id));
      }
      return allItems;
    }

    // Nếu không có role nào được truyền hoặc token không xác định role
    if (normalizedRoles.length === 0) {
      return [];
    }

    const allowedIds = new Set<string>();
    for (const r of normalizedRoles) {
      const list = roleMatrix[r] || [];
      list.forEach((id) => allowedIds.add(id));
    }

    if (allowedIds.has('memmap-payload:manager') || allowedIds.has('memmap-manager:list')) {
      allowedIds.add('memmap-payload:manager');
      allowedIds.add('memmap-payload:upload');
      allowedIds.add('memmap-manager:list');
      allowedIds.add('memmap-manager:upload');
    }

    return allItems.filter((item) => allowedIds.has(item.id));
  }
}
