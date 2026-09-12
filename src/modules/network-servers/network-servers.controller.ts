import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NetworkServersService } from './network-servers.service';
import {
  CreateNetworkServerDto,
  UpdateNetworkServerDto,
  RegionProfileDto,
} from './dto/network-server.dto';
import { SendDownlinkDto, FlushQueueDto } from './dto/downlink.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Network Servers Management')
@Controller('api/network-servers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class NetworkServersController {
  constructor(private readonly networkServersService: NetworkServersService) {}

  @Get()
  @RequirePermissions('network_server:read')
  @ApiOperation({ summary: 'Danh sách tất cả Network Servers (ThingPark, ChirpStack)' })
  async findAll() {
    return await this.networkServersService.findAll();
  }

  @Get('downlinks/history')
  @RequirePermissions('lorawan:device:read')
  @ApiOperation({ summary: 'Retrieve downlink execution history and audit logs' })
  @ApiQuery({ name: 'devEUI', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDownlinkHistory(
    @Query('devEUI') devEUI?: string,
    @Query('limit') limit?: number,
  ) {
    return await this.networkServersService.getDownlinkHistory({ devEUI, limit });
  }

  @Post('downlink')
  @RequirePermissions('lorawan:device:read')
  @ApiOperation({ summary: 'Dispatch downlink Hex command to LoRaWAN device via selected Network Server' })
  async sendDownlink(@Body() dto: SendDownlinkDto, @Req() req: any) {
    const author = req.user?.username || req.user?.fullName || 'Operator';
    return await this.networkServersService.sendDownlink({
      ...dto,
      author,
    });
  }

  @Post('flush-queue')
  @RequirePermissions('lorawan:device:read')
  @ApiOperation({ summary: 'Flush device downlink queue on Network Server' })
  async flushQueue(@Body() dto: FlushQueueDto, @Req() req: any) {
    const author = req.user?.username || req.user?.fullName || 'Operator';
    return await this.networkServersService.flushDeviceQueue({
      devEUI: dto.devEUI,
      networkServerId: dto.networkServerId,
      author,
    });
  }

  @Get(':id')
  @RequirePermissions('network_server:read')
  @ApiOperation({ summary: 'Lấy chi tiết Network Server theo ID' })
  async findOne(@Param('id') id: string) {
    return await this.networkServersService.findOne(id);
  }

  @Post()
  @RequirePermissions('network_server:manage')
  @ApiOperation({ summary: 'Tạo mới Network Server (ThingPark, ChirpStack) cùng RouteRef và Region Profiles' })
  async create(@Body() dto: CreateNetworkServerDto) {
    return await this.networkServersService.create(dto);
  }

  @Put(':id')
  @RequirePermissions('network_server:manage')
  @ApiOperation({ summary: 'Cập nhật thông tin cấu hình Network Server' })
  async update(@Param('id') id: string, @Body() dto: UpdateNetworkServerDto) {
    return await this.networkServersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('network_server:manage')
  @ApiOperation({ summary: 'Xóa Network Server' })
  async remove(@Param('id') id: string) {
    return await this.networkServersService.remove(id);
  }

  @Post(':id/test')
  @RequirePermissions('network_server:read')
  @ApiOperation({ summary: 'Kiểm tra kết nối và tính hợp lệ của cấu hình Network Server' })
  async testConnection(@Param('id') id: string) {
    return await this.networkServersService.testConnection(id);
  }

  @Post(':id/regions')
  @RequirePermissions('network_server:manage')
  @ApiOperation({ summary: 'Thêm hoặc cập nhật Region Profile cho Network Server' })
  async addRegionProfile(@Param('id') id: string, @Body() regionDto: RegionProfileDto) {
    return await this.networkServersService.addOrUpdateRegionProfile(id, regionDto);
  }

  @Delete(':id/regions/:regionId')
  @RequirePermissions('network_server:manage')
  @ApiOperation({ summary: 'Xóa Region Profile khỏi Network Server' })
  async deleteRegionProfile(@Param('id') id: string, @Param('regionId') regionId: string) {
    return await this.networkServersService.deleteRegionProfile(id, regionId);
  }

  @Get(':id/devices')
  @RequirePermissions('network_server:read')
  @ApiOperation({ summary: 'Danh sách các thiết bị thuộc Network Server này' })
  async getLinkedDevices(@Param('id') id: string) {
    return await this.networkServersService.getLinkedDevices(id);
  }

  @Get(':id/gateways')
  @RequirePermissions('network_server:read')
  @ApiOperation({ summary: 'Danh sách các gateway thuộc Network Server này' })
  async getLinkedGateways(@Param('id') id: string) {
    return await this.networkServersService.getLinkedGateways(id);
  }
}
