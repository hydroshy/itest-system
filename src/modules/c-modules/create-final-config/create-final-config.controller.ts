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
import { CreateFinalConfigService } from './create-final-config.service';
import { SaveFinalConfigDto } from './dto/create-final-config.dto';

@ApiTags('C-Module: Create Final Config')
@Controller(['api/c-modules/create-final-config', 'api/create-final-config'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreateFinalConfigController {
  constructor(private readonly finalConfigService: CreateFinalConfigService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save or update Final Configuration preset linked by SO, Item Code, SKU, and Firmware' })
  async saveFinalConfig(@Body() dto: SaveFinalConfigDto, @CurrentUser() user?: User) {
    const author = user?.username || user?.fullName || 'admin';
    return await this.finalConfigService.saveFinalConfig(dto, author);
  }

  @Get()
  @ApiOperation({ summary: 'List all Final Configuration presets' })
  async listFinalConfigs() {
    const data = await this.finalConfigService.listFinalConfigs();
    return { success: true, data };
  }

  @Get(':so/:itemCode')
  @ApiOperation({ summary: 'Get Final Configuration preset and registers by SO and Item Code' })
  @ApiParam({ name: 'so', example: 'SO/2026/00001' })
  @ApiParam({ name: 'itemCode', example: 'WSLRW-ATH-01' })
  async getFinalConfig(@Param('so') so: string, @Param('itemCode') itemCode: string) {
    const data = await this.finalConfigService.getFinalConfig(so, itemCode);
    return { success: true, data };
  }
}
