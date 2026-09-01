import { Controller, Post, Put, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LorawanService } from './lorawan.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('LoRaWAN & Webhook Ingestion')
@Controller('lorawan')
export class LorawanController {
  constructor(private readonly lorawanService: LorawanService) {}

  @Post('devices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng ký thiết bị LoRaWAN mới (DevEUI, OTAA/ABP)' })
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
  @ApiOperation({ summary: 'Generic Webhook nhận gói tin thô Uplink Hex & tự giải mã (Datacake / TTN style)' })
  async handleUplink(@Body() body: { devEUI: string; payloadHex: string; fPort?: number; fCnt?: number }) {
    return await this.lorawanService.handleUplink(body.devEUI, body.payloadHex, body.fPort, body.fCnt);
  }

  @Post('webhook/chirpstack')
  @ApiOperation({ summary: 'Webhook nhận uplink từ ChirpStack v3/v4 và chuyển vào database' })
  async handleChirpstackWebhook(@Body() body: any) {
    return await this.lorawanService.handleChirpstackWebhook(body);
  }

  @Post('webhook/thingpark')
  @ApiOperation({ summary: 'Webhook nhận uplink từ ThingPark Wireless và chuyển vào database' })
  async handleThingparkWebhook(@Body() body: any) {
    return await this.lorawanService.handleThingparkWebhook(body);
  }

  @Post('payload-formatter/test')
  @ApiOperation({ summary: 'Kiểm thử trực tiếp JavaScript Payload Formatter trong JS Sandbox (Node vm)' })
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

  @Get('telemetry')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:telemetry:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách dữ liệu Telemetry nhận từ Webhook' })
  @ApiQuery({ name: 'devEUI', required: false, description: 'Lọc theo DevEUI' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số bản ghi tối đa (mặc định 50)' })
  async getTelemetry(@Query('devEUI') devEUI?: string, @Query('limit') limit?: number) {
    return await this.lorawanService.getTelemetry(devEUI, limit ? Number(limit) : 50);
  }
}

