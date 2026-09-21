import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OdooOrderLineDto {
  @ApiPropertyOptional({ description: 'Odoo order line ID' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional({ description: 'Line description or item code' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Product ID or [id, name]' })
  @IsOptional()
  product_id?: [number, string] | any;

  @ApiPropertyOptional({ description: 'Product SKU (default_code)' })
  @IsOptional()
  @IsString()
  default_code?: string;

  @ApiPropertyOptional({ description: 'Product quantity', default: 1 })
  @IsOptional()
  product_uom_qty?: number;

  @ApiPropertyOptional({ description: 'Explicit itemCode override' })
  @IsOptional()
  @IsString()
  item_code?: string;

  @ApiPropertyOptional({ description: 'Target firmware version' })
  @IsOptional()
  @IsString()
  firmware_version?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class OdooImportDto {
  @ApiPropertyOptional({ description: 'Odoo sale.order ID' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ description: 'Sales Order Name (mapped to soCode)', example: 'SO0042' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Customer: [id, name] or string', example: [14, 'Daviteq Customer'] })
  @IsOptional()
  partner_id?: [number, string] | string;

  @ApiPropertyOptional({ description: 'Order date', example: '2026-09-20 14:00:00' })
  @IsOptional()
  date_order?: string;

  @ApiPropertyOptional({ description: 'Order state in Odoo (draft, sale, done, cancel)', example: 'sale' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ type: [OdooOrderLineDto], description: 'Order lines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OdooOrderLineDto)
  order_line: OdooOrderLineDto[];
}
