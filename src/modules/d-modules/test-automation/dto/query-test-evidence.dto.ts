import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTestEvidenceDto {
  @ApiPropertyOptional({ description: 'Filter by Sales Order Code' })
  @IsString()
  @IsOptional()
  soCode?: string;

  @ApiPropertyOptional({ description: 'Filter by Item Code' })
  @IsString()
  @IsOptional()
  itemCode?: string;

  @ApiPropertyOptional({ description: 'Filter by DevEUI' })
  @IsString()
  @IsOptional()
  devEUI?: string;

  @ApiPropertyOptional({ description: 'Filter by Serial Number (Modbus Reg 259)' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Filter by SKU' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Filter by Test Verdict (PASSED, FAILED, TIMEOUT, ALL)' })
  @IsString()
  @IsOptional()
  verdict?: string;

  @ApiPropertyOptional({ description: 'Filter by Session UUID' })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Global text search across DevEUI, Serial, SO, Item Code' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number (default 1)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default 20, max 100)', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}
