import { Controller, Get, Post, Delete, Put, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WebhookAdminService } from './webhook-admin.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('C-Module: Webhook Manager')
@Controller('api/webhooks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class WebhookAdminController {
  constructor(private readonly webhookAdminService: WebhookAdminService) {}

  @Get('logs')
  @RequirePermissions('lorawan:webhooks:read')
  @ApiOperation({ summary: 'Get filtered webhook packet logs from ChirpStack & ThingPark' })
  @ApiQuery({ name: 'serverType', required: false, description: 'CHIRPSTACK, THINGPARK, or ALL' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for DevEUI or Payload Hex' })
  @ApiQuery({ name: 'status', required: false, description: 'SUCCESS, ERROR, or ALL' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max records (default 50)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  async getLogs(
    @Query('serverType') serverType?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return await this.webhookAdminService.getLogs({
      serverType,
      search,
      status,
      limit,
      offset,
    });
  }

  @Get('stats')
  @RequirePermissions('lorawan:webhooks:read')
  @ApiOperation({ summary: 'Get webhook ingestion statistics and auto-pruning status' })
  async getStats() {
    return await this.webhookAdminService.getStats();
  }

  @Delete('logs')
  @RequirePermissions('lorawan:webhooks:read')
  @ApiOperation({ summary: 'Clear webhook packet logs (by serverType or ALL)' })
  @ApiQuery({ name: 'serverType', required: false, description: 'CHIRPSTACK, THINGPARK, or ALL' })
  async clearLogs(@Query('serverType') serverType?: string) {
    return await this.webhookAdminService.clearLogs(serverType);
  }

  @Put('retention')
  @RequirePermissions('lorawan:webhooks:read')
  @ApiOperation({ summary: 'Update automated log retention limit per server' })
  async setRetention(@Body('limit') limit: number) {
    return await this.webhookAdminService.setRetentionLimit(limit);
  }

  @Post('simulate')
  @RequirePermissions('lorawan:webhooks:read')
  @ApiOperation({ summary: 'Simulate an incoming webhook packet for ChirpStack or ThingPark' })
  async simulatePacket(
    @Body()
    body: {
      serverType: 'CHIRPSTACK' | 'THINGPARK';
      devEUI: string;
      payloadHex: string;
      fPort?: number;
      fCnt?: number;
    },
  ) {
    return await this.webhookAdminService.simulatePacket(body);
  }
}
