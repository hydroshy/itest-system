import { Controller, Get, Post, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SystemOpsService } from './system-ops.service';

@ApiTags('C-Module: System Ops & Lifecycle')
@Controller('api/system')
export class SystemOpsController {
  constructor(private readonly opsService: SystemOpsService) {}

  @Get('version')
  @ApiOperation({ summary: 'Get live Git commit metadata, build status, and Ops Agent status' })
  async getVersion() {
    return this.opsService.getSystemVersion();
  }

  @Post('restart')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request Ops Agent to restart NestJS server container' })
  async restartServer(@Request() req: any) {
    const user = req.user;
    const isSuperAdmin =
      user?.userType === 'ADMIN' ||
      user?.username === 'admin' ||
      (user?.roles &&
        user.roles.some((r: any) => {
          const code = (typeof r === 'string' ? r : (r.code || r.name || '')).toUpperCase();
          return code === 'SUPER_ADMIN' || code === 'SUPER ADMINISTRATOR' || code === 'ADMIN';
        }));

    if (!isSuperAdmin) {
      throw new ForbiddenException('Only Super Administrators are authorized to restart the platform server container.');
    }

    return this.opsService.restartServer();
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent Docker container output stream logs' })
  async getLogs(@Query('tail') tail?: string) {
    const count = parseInt(tail || '50', 10);
    return this.opsService.getContainerLogs(count);
  }
}
