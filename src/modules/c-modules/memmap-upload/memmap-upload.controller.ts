import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { MemmapUploadService } from './memmap-upload.service';
import { UploadMemmapDto } from './dto/upload-memmap.dto';

@ApiTags('C-Module: Memory Map Upload')
@Controller(['api/c-modules/memmap-upload', 'api/memmap'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemmapUploadController {
  constructor(private readonly memmapUploadService: MemmapUploadService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upload and validate Modbus Register Memory Map linked by SKU and short FW version',
  })
  async uploadMemmap(@Body() dto: UploadMemmapDto, @CurrentUser() user?: User) {
    const author = user?.username || user?.fullName || 'admin';
    return await this.memmapUploadService.uploadMemmap(dto, author);
  }

  @Get('by-sku/:sku/:shortFw')
  @ApiOperation({
    summary: 'Lookup stored Memory Map and 16-field Modbus registers by SKU and short FW',
  })
  @ApiParam({ name: 'sku', example: 'WSLRW-ATH' })
  @ApiParam({ name: 'shortFw', example: 6 })
  async getBySkuAndShortFw(
    @Param('sku') sku: string,
    @Param('shortFw') shortFw: string,
  ) {
    return await this.memmapUploadService.getBySkuAndShortFw(sku, shortFw);
  }

  @Get()
  @ApiOperation({ summary: 'List all registered Memory Map payloads' })
  async findAll() {
    const data = await this.memmapUploadService.findAll();
    return { success: true, data };
  }
}
