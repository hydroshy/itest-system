import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalesOrderStatus, SalesOrderSource } from '../entities/sales-order.entity';
import { SalesOrderItemStatus } from '../entities/sales-order-item.entity';

export class CreateSalesOrderItemDto {
  @ApiProperty({ description: 'Item Code within SO (e.g. ITEM-001, WSLRW-ATH-01)', example: 'ITEM-001' })
  @IsNotEmpty()
  @IsString()
  itemCode: string;

  @ApiProperty({ description: 'Device SKU (e.g. WSLRW-ATH)', example: 'WSLRW-ATH' })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiPropertyOptional({ description: 'Ordered quantity', example: 10, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number = 1;

  @ApiPropertyOptional({ description: 'Target firmware version', example: '1.0', default: '1.0' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string = '1.0';

  @ApiPropertyOptional({ description: 'Explicit Test Template UUID (optional, auto-mapped if omitted)' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Line item remarks' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Line item metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateSalesOrderDto {
  @ApiProperty({ description: 'Unique Sales Order code (e.g. SO-2026-001)', example: 'SO-2026-001' })
  @IsNotEmpty()
  @IsString()
  soCode: string;

  @ApiPropertyOptional({ description: 'Customer or partner name', example: 'Daviteq IoT Corp' })
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiPropertyOptional({ description: 'Order date ISO string', example: '2026-09-20T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ enum: SalesOrderStatus, default: SalesOrderStatus.DRAFT })
  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus = SalesOrderStatus.DRAFT;

  @ApiPropertyOptional({ enum: SalesOrderSource, default: SalesOrderSource.MANUAL })
  @IsOptional()
  @IsEnum(SalesOrderSource)
  source?: SalesOrderSource = SalesOrderSource.MANUAL;

  @ApiPropertyOptional({ description: 'Remote Odoo sale.order ID' })
  @IsOptional()
  @IsInt()
  odooId?: number;

  @ApiPropertyOptional({ description: 'Order remarks' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Extra metadata' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ type: [CreateSalesOrderItemDto], description: 'List of items in Sales Order' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items: CreateSalesOrderItemDto[];
}

export class UpdateSalesOrderItemDto {
  @ApiPropertyOptional({ description: 'Item ID for updating existing item' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ description: 'Item Code' })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({ description: 'Device SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Target firmware version' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @ApiPropertyOptional({ description: 'Test Template UUID' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Number of tested units' })
  @IsOptional()
  @IsInt()
  testedQuantity?: number;

  @ApiPropertyOptional({ description: 'Number of passed units' })
  @IsOptional()
  @IsInt()
  passedQuantity?: number;

  @ApiPropertyOptional({ description: 'Number of failed units' })
  @IsOptional()
  @IsInt()
  failedQuantity?: number;

  @ApiPropertyOptional({ enum: SalesOrderItemStatus })
  @IsOptional()
  @IsEnum(SalesOrderItemStatus)
  status?: SalesOrderItemStatus;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSalesOrderDto {
  @ApiPropertyOptional({ description: 'Sales Order Code' })
  @IsOptional()
  @IsString()
  soCode?: string;

  @ApiPropertyOptional({ description: 'Customer Name' })
  @IsOptional()
  @IsString()
  customer?: string;

  @ApiPropertyOptional({ description: 'Order Date' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ enum: SalesOrderStatus })
  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;

  @ApiPropertyOptional({ enum: SalesOrderSource })
  @IsOptional()
  @IsEnum(SalesOrderSource)
  source?: SalesOrderSource;

  @ApiPropertyOptional({ description: 'Odoo ID' })
  @IsOptional()
  @IsInt()
  odooId?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [UpdateSalesOrderItemDto], description: 'Items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSalesOrderItemDto)
  items?: UpdateSalesOrderItemDto[];
}

export class QuerySalesOrderDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search keyword for soCode or customer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SalesOrderStatus })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: SalesOrderSource })
  @IsOptional()
  @IsString()
  source?: string;
}
