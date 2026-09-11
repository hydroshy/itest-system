import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HmiStudioService } from './hmi-studio.service';
import {
  CreateHmiScreenDto,
  UpdateHmiScreenDto,
  CloneHmiScreenDto,
  PublishHmiScreenDto,
} from './dto/hmi-screen.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';

@ApiTags('HMI SCADA Studio (C-Module)')
@Controller('api/hmi/screens')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class HmiStudioController {
  constructor(private readonly hmiStudioService: HmiStudioService) {}

  @Get()
  @ApiOperation({ summary: 'Get all HMI screens (Admin Designer view)' })
  async findAll() {
    return await this.hmiStudioService.findAll();
  }

  @Get('published')
  @ApiOperation({ summary: 'Get published screens accessible to current user role' })
  async findPublished(@Req() req: any) {
    const role = req.user?.roles?.[0]?.code || req.user?.userType || 'VIEWER';
    return await this.hmiStudioService.findPublished(role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get HMI screen details by ID' })
  async findOne(@Param('id') id: string) {
    return await this.hmiStudioService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new HMI screen' })
  async create(@Body() dto: CreateHmiScreenDto, @Req() req: any) {
    const author = req.user?.username || req.user?.fullName || 'Admin';
    return await this.hmiStudioService.create(dto, author);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update HMI screen layout, canvas, and widgets' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHmiScreenDto,
    @Req() req: any,
  ) {
    const author = req.user?.username || req.user?.fullName || 'Admin';
    return await this.hmiStudioService.update(id, dto, author);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete HMI screen' })
  async delete(@Param('id') id: string) {
    return await this.hmiStudioService.delete(id);
  }

  @Post('downlink')
  @ApiOperation({ summary: 'Trigger LoRaWAN downlink control action from HMI widget' })
  async downlink(@Body() body: any, @Req() req: any) {
    return await this.hmiStudioService.executeDownlink(body, req.user);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish HMI screen' })
  async publish(
    @Param('id') id: string,
    @Body() dto: PublishHmiScreenDto,
  ) {
    return await this.hmiStudioService.publish(id, dto);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone/duplicate an existing HMI screen' })
  async clone(
    @Param('id') id: string,
    @Body() dto: CloneHmiScreenDto,
    @Req() req: any,
  ) {
    const author = req.user?.username || req.user?.fullName || 'Admin';
    return await this.hmiStudioService.clone(id, dto, author);
  }

  @Get('telemetry/trend')
  @ApiOperation({ summary: 'Lấy chuỗi dữ liệu thời gian thực (time-series) cho Trend Widgets' })
  @ApiQuery({ name: 'devEUIs', required: false, description: 'Danh sách DevEUI (phân cách bằng dấu phẩy)' })
  @ApiQuery({ name: 'from', required: false, description: 'Từ mốc thời gian ISO' })
  @ApiQuery({ name: 'to', required: false, description: 'Đến mốc thời gian ISO' })
  @ApiQuery({ name: 'limit', required: false, description: 'Số điểm tối đa (mặc định 500)' })
  async getTelemetryTrend(
    @Query('devEUIs') devEUIs?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: number,
  ) {
    const devEUIList = devEUIs
      ? devEUIs
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : undefined;
    return await this.hmiStudioService.getTelemetryTrend({
      devEUIs: devEUIList,
      from,
      to,
      limit: limit !== undefined ? Number(limit) : 500,
    });
  }

  @Get('devices/:devEUI/telemetry-fields')
  @ApiOperation({ summary: 'Auto-detect decoded telemetry tags & RF metrics for a device' })
  async getDeviceTelemetryFields(@Param('devEUI') devEUI: string) {
    return await this.hmiStudioService.getDeviceTelemetryFields(devEUI);
  }
}

