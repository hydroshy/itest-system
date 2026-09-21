import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OdooApiSyncDto {
  @ApiPropertyOptional({ description: 'Odoo Server URL', example: 'https://odoo.daviteq.com' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ description: 'Odoo Database Name', example: 'daviteq_prod' })
  @IsOptional()
  @IsString()
  db?: string;

  @ApiPropertyOptional({ description: 'Odoo Username / Email', example: 'admin@daviteq.com' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Odoo API Key or Password' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Sales Order Code to sync', example: 'SO0042' })
  @IsOptional()
  @IsString()
  soCode?: string;

  @ApiPropertyOptional({ description: 'Odoo sale.order ID to sync', example: 42 })
  @IsOptional()
  @IsInt()
  odooId?: number;
}
