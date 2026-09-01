import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminPanelService } from './admin-panel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Panel')
@Controller('admin-panel')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Thống kê Admin & trạng thái kết nối các DB pool' })
  async getDashboard() {
    return await this.adminPanelService.getDashboardStats();
  }

  @Post('reload-db-config')
  @ApiOperation({ summary: 'Reload cấu hình DB động không cần restart server' })
  async reloadDbConfig() {
    return await this.adminPanelService.reloadDbConfig();
  }
}
