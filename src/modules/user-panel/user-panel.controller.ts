import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserPanelService } from './user-panel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Panel')
@Controller('user-panel')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserPanelController {
  constructor(private readonly userPanelService: UserPanelService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard cá nhân cho User theo dõi thiết bị' })
  async getDashboard(@CurrentUser() user: any) {
    return await this.userPanelService.getUserDashboard(user?.id || user?.userId);
  }
}
