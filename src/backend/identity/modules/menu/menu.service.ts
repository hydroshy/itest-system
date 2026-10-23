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
    id: 'memmap-payload:manager',
    title: 'Memmap & Payload Manager',
    description: 'Quản lý bản đồ bộ nhớ thiết bị Modbus và bảng giải mã Payload LoRaWAN',
    icon: 'Grid',
    route: '/plugins/memmap-manager?tab=memmap',
    pluginId: 'memmap-manager',
    tab: 'memmap',
    category: 'plugin',
    order: 8,
  },
  {
    id: 'lorawan-chirpstack:integration',
    title: 'LoRaWAN ChirpStack Integration',
    description: 'Đồng bộ Gateways, Applications và Live Frames từ Network Server ChirpStack',
    icon: 'Connection',
    route: '/plugins/lorawan-chirpstack?tab=overview',
    pluginId: 'lorawan-chirpstack',
    tab: 'overview',
    category: 'plugin',
    order: 9,
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
    OPERATOR: ['dashboard', 'final-config:tool', 'device-traceability:so', 'device-traceability:devices'],
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
          return rows;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not fetch system_menu_items from DB: ${err.message}. Using default list.`);
    }
    return SYSTEM_MENU_ITEMS;
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

    return allItems.filter((item) => allowedIds.has(item.id));
  }
}
