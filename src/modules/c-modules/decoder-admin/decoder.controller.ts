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
import { DecoderService } from './decoder.service';
import { CreateDecoderDto, UpdateDecoderDto, TestDecoderDto } from './dto/decoder.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('Decoder Manager (C-Module)')
@Controller('api/decoders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DecoderController {
  constructor(private readonly decoderService: DecoderService) {}

  @Get()
  @RequirePermissions('lorawan:decoder:read')
  @ApiOperation({ summary: 'Lấy danh sách tất cả payload decoders đã đăng ký theo SKU và Firmware' })
  async findAll() {
    return await this.decoderService.findAll();
  }

  @Get(':id')
  @RequirePermissions('lorawan:decoder:read')
  @ApiOperation({ summary: 'Lấy chi tiết decoder theo composite ID (vd: WSLRW-V1A_9)' })
  async findOne(@Param('id') id: string) {
    return await this.decoderService.findOne(id);
  }

  @Post()
  @RequirePermissions('lorawan:decoder:manage')
  @ApiOperation({ summary: 'Thêm mới decoder theo mã SKU và Firmware version (1-32)' })
  async create(@Body() dto: CreateDecoderDto, @Req() req: any) {
    const author = req.user?.username || req.user?.email || 'admin';
    return await this.decoderService.create(dto, author);
  }

  @Put(':id')
  @RequirePermissions('lorawan:decoder:manage')
  @ApiOperation({ summary: 'Cập nhật mã code JavaScript hoặc mô tả của decoder' })
  async update(@Param('id') id: string, @Body() dto: UpdateDecoderDto, @Req() req: any) {
    const author = req.user?.username || req.user?.email || 'admin';
    return await this.decoderService.update(id, dto, author);
  }

  @Delete(':id')
  @RequirePermissions('lorawan:decoder:manage')
  @ApiOperation({ summary: 'Xóa decoder khỏi database' })
  async remove(@Param('id') id: string) {
    return await this.decoderService.remove(id);
  }

  @Post('test')
  @RequirePermissions('lorawan:decoder:read')
  @ApiOperation({ summary: 'Kiểm thử hàm giải mã JavaScript với chuỗi Hex thực tế trong Sandbox' })
  testDecode(@Body() dto: TestDecoderDto) {
    return this.decoderService.testDecode(dto);
  }
}
