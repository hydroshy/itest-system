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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { TestBuilderService } from './test-builder.service';
import {
  CreateTestTemplateDto,
  UpdateTestTemplateDto,
  DryRunTestDto,
} from './dto/test-builder.dto';

@ApiTags('C-Module: LoRaWAN Test Builder & Automation')
@Controller(['api/test-builder', 'api/c-modules/test-builder'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TestBuilderController {
  constructor(private readonly testBuilderService: TestBuilderService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Lấy danh sách tất cả kịch bản kiểm thử (Test Templates)' })
  async findAll() {
    return await this.testBuilderService.findAll();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Lấy chi tiết kịch bản kiểm định kèm danh sách assertions' })
  async findOne(@Param('id') id: string) {
    return await this.testBuilderService.findOne(id);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Tạo mới kịch bản kiểm định (hỗ trợ Visual Flow / Custom Script)' })
  async create(@Body() dto: CreateTestTemplateDto, @CurrentUser() user: User) {
    try {
      const author = user?.username || user?.fullName || 'admin';
      return await this.testBuilderService.create(dto, author);
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Không thể tạo kịch bản kiểm định',
        err.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Cập nhật kịch bản kiểm định' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTestTemplateDto,
    @CurrentUser() user: User,
  ) {
    try {
      const author = user?.username || user?.fullName || 'admin';
      return await this.testBuilderService.update(id, dto, author);
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Không thể cập nhật kịch bản kiểm định',
        err.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Xóa kịch bản kiểm định' })
  async remove(@Param('id') id: string) {
    return await this.testBuilderService.remove(id);
  }

  @Get('available-fields')
  @ApiOperation({ summary: 'Lấy danh sách field telemetry khả dụng từ SKU và FirmwareVersion' })
  @ApiQuery({ name: 'sku', required: false })
  @ApiQuery({ name: 'firmwareVersion', required: false })
  async getAvailableFields(
    @Query('sku') sku?: string,
    @Query('firmwareVersion') firmwareVersion?: string,
  ) {
    return await this.testBuilderService.getAvailableFields(sku, firmwareVersion);
  }

  @Post('dry-run')
  @ApiOperation({ summary: 'Chạy thử kịch bản kiểm định trong Sandbox với Mock Packet' })
  async dryRun(@Body() dto: DryRunTestDto) {
    try {
      return await this.testBuilderService.dryRun(dto);
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Lỗi khi chạy thử Dry-Run',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
