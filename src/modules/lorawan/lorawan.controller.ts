import { Controller, Post, Put, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LorawanService } from './lorawan.service';
import { RegisterDeviceDto, RegisterGatewayDto, UplinkPayloadDto, TestPayloadFormatterDto } from './dto/lorawan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('LoRaWAN & Webhook Ingestion')
@Controller(['lorawan', 'api/lorawan'])
export class LorawanController {
  constructor(private readonly lorawanService: LorawanService) {}

  @Post('devices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng ký thiết bị LoRaWAN mới (DevEUI, OTAA/ABP, Network Server)' })
  async registerDevice(@Body() body: RegisterDeviceDto, @CurrentUser() user: any) {
    return await this.lorawanService.registerDevice(body, user);
  }

  @Post('gateways')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:gateway:manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đăng ký Gateway LoRaWAN mới' })
  async registerGateway(@Body() body: RegisterGatewayDto) {
    return await this.lorawanService.registerGateway(body);
  }

  @Put('devices/:devEUI/payload-formatter')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật script JS Payload Formatter cho thiết bị' })
  async updatePayloadFormatter(@Param('devEUI') devEUI: string, @Body('script') script: string) {
    return await this.lorawanService.updatePayloadFormatter(devEUI, script);
  }

  @Post('uplink')
  @ApiOperation({ summary: 'Generic Webhook nhận gói tin thô Uplink Hex & tự giải mã (Datacake / TTN style)' })
  async handleUplink(@Body() body: UplinkPayloadDto) {
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
  testPayloadFormatter(@Body() body: TestPayloadFormatterDto) {
    return this.lorawanService.testPayloadFormatter(body.script, body.bytesHex, body.fPort);
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Danh sách các thiết bị LoRaWAN' })
  async listDevices(@CurrentUser() user: any) {
    return await this.lorawanService.listDevices(user);
  }

  @Get('devices/:devEUI')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết một thiết bị LoRaWAN theo DevEUI' })
  async findOneDevice(@Param('devEUI') devEUI: string, @CurrentUser() user: any) {
    return await this.lorawanService.findOneDevice(devEUI, user);
  }

  @Put('devices/:devEUI')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật cấu hình thiết bị LoRaWAN' })
  async updateDevice(@Param('devEUI') devEUI: string, @Body() body: Partial<RegisterDeviceDto>, @CurrentUser() user: any) {
    return await this.lorawanService.updateDevice(devEUI, body, user);
  }

  @Delete('devices/:devEUI')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa thiết bị LoRaWAN khỏi hệ thống và Network Server' })
  async deleteDevice(@Param('devEUI') devEUI: string, @CurrentUser() user: any) {
    return await this.lorawanService.deleteDevice(devEUI, user);
  }

  @Post('devices/:devEUI/sync')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đồng bộ/Provisioning lại thiết bị lên Network Server (ThingPark / ChirpStack)' })
  async syncDevice(@Param('devEUI') devEUI: string, @CurrentUser() user: any) {
    return await this.lorawanService.syncDeviceToNetworkServer(devEUI, user);
  }

  @Post('devices/:devEUI/health')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:device:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kiểm tra trạng thái trực tuyến / sức khỏe thiết bị từ Network Server API' })
  async checkDeviceHealth(@Param('devEUI') devEUI: string, @CurrentUser() user: any) {
    return await this.lorawanService.checkDeviceHealth(devEUI, user);
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
  @ApiQuery({ name: 'limit', required: false, description: 'Số bản ghi tối đa (0 để lấy toàn bộ)' })
  async getTelemetry(@Query('devEUI') devEUI?: string, @Query('limit') limit?: number) {
    const parsedLimit = limit !== undefined ? Number(limit) : (devEUI ? 0 : 100);
    return await this.lorawanService.getTelemetry(devEUI, parsedLimit);
  }

  @Get('devices/:devEUI/telemetry-fields')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('lorawan:telemetry:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tự nhận diện danh sách các trường Telemetry / Decoded Tags từ payload gần nhất' })
  async getDeviceTelemetryFields(@Param('devEUI') devEUI: string) {
    return await this.lorawanService.getDeviceTelemetryFields(devEUI);
  }
}

