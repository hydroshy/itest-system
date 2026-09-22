import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTestSessionDto {
  @ApiPropertyOptional({ description: 'Filter by Sales Order Code' })
  @IsString()
  @IsOptional()
  soCode?: string;

  @ApiPropertyOptional({ description: 'Filter by Item Code' })
  @IsString()
  @IsOptional()
  itemCode?: string;

  @ApiPropertyOptional({
    description: 'Filter by status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED, ABORTED)',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'General keyword search across code, SO, item, notes' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 20;
}
