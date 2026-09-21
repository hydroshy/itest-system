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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ItemCodesService } from './item-codes.service';
import {
  CreateItemCodeDto,
  UpdateItemCodeDto,
  QueryItemCodeDto,
} from './dto/item-code.dto';

@ApiTags('Item Codes Catalog')
@Controller(['api/item-codes', 'api/c-modules/item-codes'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ItemCodesController {
  constructor(private readonly service: ItemCodesService) {}

  @Get()
  @ApiOperation({ summary: 'List master item codes with pagination and search' })
  async findAll(@Query() query: QueryItemCodeDto) {
    return await this.service.findAll(query);
  }

  @Get('picker')
  @ApiOperation({ summary: 'Fast lightweight list for UI pickers and autocomplete dropdowns' })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findPicker(@Query('search') search?: string) {
    return await this.service.findPicker(search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single item code by UUID or unique itemCode' })
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new master item code with auto SKU_FW computation' })
  async create(@Body() dto: CreateItemCodeDto) {
    return await this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update master item code' })
  async update(@Param('id') id: string, @Body() dto: UpdateItemCodeDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete master item code (safeguarded against in-use items)' })
  async remove(@Param('id') id: string) {
    return await this.service.remove(id);
  }
}
