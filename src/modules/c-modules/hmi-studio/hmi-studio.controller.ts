import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

  @Get('devices/:devEUI/telemetry-fields')
  @ApiOperation({ summary: 'Auto-detect decoded telemetry tags & RF metrics for a device' })
  async getDeviceTelemetryFields(@Param('devEUI') devEUI: string) {
    return await this.hmiStudioService.getDeviceTelemetryFields(devEUI);
  }
}

