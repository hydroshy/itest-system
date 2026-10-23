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
   * Endpoint lấy danh sách thẻ Menu Card theo Role của người dùng đang đăng nhập
   * Hỗ trợ cả trường hợp có hoặc không có Bearer Token (nếu không có thì xem như guest hoặc fallback)
   */
  @Get(['my-cards', 'cards'])
  @ApiOperation({ summary: 'Get accessible launcher menu cards for current user' })
  async getMyCards(@Req() req: any) {
    let userRoles: string[] = [];

    // Trích xuất roles từ JWT payload nếu có
    if (req.user) {
      if (Array.isArray(req.user.roles)) {
        userRoles = req.user.roles.map((r: any) => (typeof r === 'string' ? r : r.code || r.name));
      } else if (req.user.userType) {
        userRoles = [req.user.userType];
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
  @Get('admin/items')
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
  @Get('admin/role-assignments')
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
