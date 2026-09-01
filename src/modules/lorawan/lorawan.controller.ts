import { Controller, Post, Put, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LorawanService } from './lorawan.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('LoRaWAN')
@Controller('lorawan')
export class LorawanController {
  constructor(private readonly lorawanService: LorawanService) {}

  @Post('devices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng ký thiết bị LoRaWAN mới' })
  async registerDevice(@Body() body: any) {
    return await this.lorawanService.registerDevice(body);
  }

  @Put('devices/:devEUI/payload-formatter')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật script JS Payload Formatter cho thiết bị' })
  async updatePayloadFormatter(@Param('devEUI') devEUI: string, @Body('script') script: string) {
    return await this.lorawanService.updatePayloadFormatter(devEUI, script);
  }

  @Post('uplink')
  @ApiOperation({ summary: 'Webhook nhận gói tin thô Uplink Hex & tự giải mã (Datacake / TTN style)' })
  async handleUplink(@Body() body: { devEUI: string; payloadHex: string; fPort?: number; fCnt?: number }) {
    return await this.lorawanService.handleUplink(body.devEUI, body.payloadHex, body.fPort, body.fCnt);
  }

  @Post('payload-formatter/test')
  @ApiOperation({ summary: 'Kiểm thử trực tiếp JavaScript Payload Formatter' })
  testPayloadFormatter(@Body() body: { script: string; bytesHex: string; fPort?: number }) {
    return this.lorawanService.testPayloadFormatter(body.script, body.bytesHex, body.fPort);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách các thiết bị LoRaWAN' })
  async listDevices() {
    return await this.lorawanService.listDevices();
  }

  @Get('gateways')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:gateway:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách các Gateway LoRaWAN' })
  async listGateways() {
    return await this.lorawanService.listGateways();
  }
}
