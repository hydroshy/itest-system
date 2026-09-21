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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { SalesOrdersService } from './sales-orders.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  QuerySalesOrderDto,
} from './dto/sales-order.dto';
import { CsvImportDto } from './dto/csv-import.dto';
import { OdooApiSyncDto } from './dto/odoo-api-sync.dto';

@ApiTags('C-Module: Sales Orders & Items')
@Controller(['api/sales-orders', 'api/c-modules/sales-orders'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesOrdersController {
  constructor(private readonly service: SalesOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List sales orders with pagination, search, and status/source filters' })
  async findAll(@Query() query: QuerySalesOrderDto) {
    return await this.service.findAll(query);
  }

  @Get('mapping/test-template')
  @ApiOperation({ summary: 'Auto-detect test template by SKU and firmware version' })
  @ApiQuery({ name: 'sku', required: true, type: String })
  @ApiQuery({ name: 'firmwareVersion', required: false, type: String })
  async resolveTemplate(
    @Query('sku') sku: string,
    @Query('firmwareVersion') firmwareVersion?: string,
  ) {
    return await this.service.resolveTestTemplate(sku, firmwareVersion);
  }

  @Get(':soCode/items/:itemCode/test-status')
  @ApiOperation({ summary: 'Get real-time test progress & pass/fail counts from D-Module test_sessions' })
  async getItemTestStatus(
    @Param('soCode') soCode: string,
    @Param('itemCode') itemCode: string,
  ) {
    return await this.service.getItemTestStatus(soCode, itemCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single sales order by UUID or soCode' })
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create manual sales order with item codes' })
  async create(@Body() dto: CreateSalesOrderDto, @CurrentUser() user: User) {
    const author = user?.username || user?.fullName || 'admin';
    return await this.service.create(dto, author);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update sales order details and items' })
  async update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sales order (cascades to items)' })
  async remove(@Param('id') id: string) {
    return await this.service.remove(id);
  }

  @Post('import/odoo-json')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import sales order from Odoo JSON payload (webhook or direct export)' })
  async importOdooJson(@Body() payload: any, @CurrentUser() user: User) {
    const author = user?.username || user?.fullName || 'odoo-sync';
    return await this.service.importOdooJson(payload, author);
  }

  @Post('import/csv')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import sales orders and items from raw CSV content' })
  async importCsv(@Body() dto: CsvImportDto, @CurrentUser() user: User) {
    const author = user?.username || user?.fullName || 'csv-import';
    return await this.service.importCsv(dto, author);
  }

  @Post('import/odoo-api')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync sales order directly from remote Odoo ERP by soCode or odooId' })
  async syncOdooApi(@Body() dto: OdooApiSyncDto, @CurrentUser() user: User) {
    const author = user?.username || user?.fullName || 'odoo-api';
    return await this.service.syncOdooApi(dto, author);
  }
}
