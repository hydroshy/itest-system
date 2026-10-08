import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceTestedStatus } from '../entities/device-tested.entity';

export class VerifyDeviceTestedDto {
  @ApiProperty({ description: 'Serial Number to verify', example: 'SN2026040001' })
  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @ApiPropertyOptional({ description: 'Item Code to verify against', example: 'WSLRW-ATH-01' })
  @IsString()
  @IsOptional()
  item_code?: string;

  @ApiPropertyOptional({ description: 'Selected Sales Order to verify against', example: 'SO-2026-001' })
  @IsString()
  @IsOptional()
  so?: string;
}

export class CreateDeviceTestedDto {
  @ApiProperty({ description: 'Sales Order Code', example: 'SO-2026-001' })
  @IsString()
  @IsNotEmpty()
  so: string;

  @ApiProperty({ description: 'Item Code', example: 'WSLRW-ATH-01' })
  @IsString()
  @IsNotEmpty()
  item_code: string;

  @ApiProperty({ description: 'Serial Number', example: 'SN2026040001' })
  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @ApiProperty({ description: 'Device EUI (Hex 16 chars)', example: 'A84041000182ABCD' })
  @IsString()
  @IsNotEmpty()
  dev_eui: string;

  @ApiProperty({ description: 'Product SKU', example: 'WSLRW-ATH' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Firmware Version', example: '1.0.4' })
  @IsString()
  @IsNotEmpty()
  firmware_version: string;

  @ApiPropertyOptional({ description: 'Short FW version (e.g. 1)', default: 1 })
  @IsInt()
  @IsOptional()
  short_fw?: number;

  @ApiPropertyOptional({ description: 'Sensor Type Code', default: 0 })
  @IsInt()
  @IsOptional()
  sensor_type?: number;

  @ApiPropertyOptional({ description: 'QA Testing Status', enum: ['PASS', 'PASSED', 'FAIL', 'FAILED', 'PENDING'], default: 'PASS' })
  @IsOptional()
  status?: DeviceTestedStatus;

  @ApiPropertyOptional({ description: 'Testing Station ID', default: 'STATION-01' })
  @IsString()
  @IsOptional()
  station_id?: string;

  @ApiPropertyOptional({ description: 'Operator username', default: 'admin' })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({ description: 'LoRaWAN AppKey if tested' })
  @IsString()
  @IsOptional()
  app_key?: string;

  @ApiPropertyOptional({ description: 'Testing Timestamp' })
  @IsOptional()
  tested_at?: Date | string;

  @ApiPropertyOptional({ description: 'Test Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata JSON' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QueryDeviceTestedDto {
  @ApiPropertyOptional({ description: 'Filter by SO' })
  @IsString()
  @IsOptional()
  so?: string;

  @ApiPropertyOptional({ description: 'Filter by Item Code' })
  @IsString()
  @IsOptional()
  item_code?: string;

  @ApiPropertyOptional({ description: 'Filter by Serial Number' })
  @IsString()
  @IsOptional()
  serial_number?: string;

  @ApiPropertyOptional({ description: 'Filter by Status' })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Keyword search' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  limit?: number;
}
