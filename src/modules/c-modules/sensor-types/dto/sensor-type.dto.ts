import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSensorTypeDto {
  @ApiProperty({ description: 'Modbus Sensor Type decimal code (1-255)', example: 71 })
  @IsNumber()
  @Min(1)
  @Max(255)
  @Type(() => Number)
  sensorTypeCode: number;

  @ApiProperty({ description: 'Hardware SKU code', example: 'WSLRW-LKS' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Human readable name', example: 'Wireless LoRaWAN Leak Sensor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Default LoRaWAN region', default: 'EU868' })
  @IsString()
  @IsOptional()
  defaultRegion?: string;

  @ApiPropertyOptional({ description: 'Default LoRaWAN class', default: 'A' })
  @IsString()
  @IsOptional()
  defaultClass?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSensorTypeDto {
  @ApiPropertyOptional({ description: 'Modbus Sensor Type decimal code (1-255)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(255)
  @Type(() => Number)
  sensorTypeCode?: number;

  @ApiPropertyOptional({ description: 'Hardware SKU code' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Human readable name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Default LoRaWAN region' })
  @IsString()
  @IsOptional()
  defaultRegion?: string;

  @ApiPropertyOptional({ description: 'Default LoRaWAN class' })
  @IsString()
  @IsOptional()
  defaultClass?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QuerySensorTypeDto {
  @ApiPropertyOptional({ description: 'Search term by sensorTypeCode, SKU, or name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  isActive?: boolean | string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Page limit', default: 50 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
