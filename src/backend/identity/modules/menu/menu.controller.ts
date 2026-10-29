import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { AssignRoleMenuDto } from './dto/menu.dto';

@ApiTags('Menu & Role Permission Launcher')
@Controller(['api/menu', 'menu', 'api/v1/menu'])
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * Endpoint lấy toàn bộ danh mục menu/card items (GET /menu, GET /api/v1/menu)
   */
  @Get()
  @ApiOperation({ summary: 'Get all registered system & plugin menu items' })
  async getMenuRoot() {
    return this.menuService.getAllMenuItems();
  }

  /**
   * Endpoint lấy danh sách thẻ Menu Card theo Role của người dùng đang đăng nhập
   * Hỗ trợ cả trường hợp có hoặc không có Bearer Token (nếu không có thì xem như guest hoặc fallback)
   */
  @Get(['my-cards', 'cards'])
  @ApiOperation({ summary: 'Get accessible launcher menu cards for current user' })
  async getMyCards(@Req() req: any) {
    let userRoles: string[] = [];

    // 1. Trích xuất roles từ req.user nếu đã qua guard
    if (req.user) {
      if (Array.isArray(req.user.roles)) {
        userRoles = req.user.roles.map((r: any) => (typeof r === 'string' ? r : r.code || r.name));
      } else if (req.user.userType) {
        userRoles = [req.user.userType];
      }
    }

    // 2. Nếu req.user chưa có, bóc tách Bearer token từ Authorization header để parse payload JWT
    if (userRoles.length === 0) {
      const authHeader = req.headers?.authorization || req.headers?.Authorization;
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            if (payload.roles && Array.isArray(payload.roles)) {
              userRoles = payload.roles.map((r: any) => (typeof r === 'string' ? r : r.code || r.name));
            } else if (payload.role) {
              userRoles = [payload.role];
            } else if (payload.userType) {
              userRoles = [payload.userType];
            }
          }
        } catch (e) {
          // Token không giải mã được -> xem như không có role hợp lệ
        }
      }
    }

    const cards = await this.menuService.getCardsForRoles(userRoles);
    return {
      success: true,
      data: cards,
      items: cards,
    };
  }

  /**
   * Endpoint lấy toàn bộ danh mục menu/card items (Dành cho Quản trị viên quản lý gán menu)
   */
  @Get(['admin/items', 'admin/menu-items'])
  @ApiOperation({ summary: 'Get all registered system & plugin menu items' })
  async getAllItems() {
    const items = await this.menuService.getAllMenuItems();
    return {
      success: true,
      data: items,
      items: items,
    };
  }

  /**
   * Endpoint lấy ma trận phân quyền hiện tại theo Role
   */
  @Get(['admin/role-assignments', 'admin/assignments'])
  @ApiOperation({ summary: 'Get current role menu permission assignments' })
  async getRoleAssignments() {
    const assignments = await this.menuService.getRoleAssignments();
    return {
      success: true,
      data: assignments,
    };
  }

  /**
   * Endpoint gán danh sách Menu Item cho một Role cụ thể
   */
  @Post('admin/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign menu items to a role' })
  async assignRoleMenu(@Body() dto: AssignRoleMenuDto) {
    const success = await this.menuService.assignRoleMenu(dto.roleCode, dto.menuItemIds);
    return {
      success,
      message: `Menu permissions updated for role ${dto.roleCode}`,
    };
  }
}
