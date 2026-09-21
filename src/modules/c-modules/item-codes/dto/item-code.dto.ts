import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItemCodeDto {
  @ApiProperty({ description: 'Unique Item Code', example: 'ITEM-WSLRW-ATH-01' })
  @IsNotEmpty()
  @IsString()
  itemCode: string;

  @ApiProperty({ description: 'Device SKU', example: 'WSLRW-ATH' })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiPropertyOptional({ description: 'Firmware version without v prefix', example: '6', default: '1.0' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string = '1.0';

  @ApiPropertyOptional({ description: 'Default Test Template UUID' })
  @IsOptional()
  @IsUUID()
  defaultTemplateId?: string;

  @ApiPropertyOptional({ description: 'Item description', example: 'Temperature & Humidity Sensor' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active in catalog', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Extra metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateItemCodeDto {
  @ApiPropertyOptional({ description: 'Unique Item Code' })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({ description: 'Device SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Firmware version without v prefix' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @ApiPropertyOptional({ description: 'Default Test Template UUID' })
  @IsOptional()
  @IsUUID()
  defaultTemplateId?: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Active in catalog' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Extra metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QueryItemCodeDto {
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

  @ApiPropertyOptional({ description: 'Search keyword for itemCode, sku, skuFw, description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by exact SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Filter by active state' })
  @IsOptional()
  isActive?: any;
}

export class ItemCodePickerItemDto {
  id: string;
  itemCode: string;
  sku: string;
  firmwareVersion: string;
  skuFw: string; // e.g. "WSLRW-ATH_6"
  defaultTemplateId?: string;
  defaultTemplateName?: string;
  description?: string;
}
