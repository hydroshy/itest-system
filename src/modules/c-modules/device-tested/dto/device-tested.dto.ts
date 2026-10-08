import { IsString, IsNotEmpty, IsOptional, IsInt, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceTestedStatus } from '../entities/device-tested.entity';

export class VerifyDeviceTestedDto {
  @ApiProperty({ description: 'Serial Number to verify', example: 'LRRS26000599' })
  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @ApiPropertyOptional({ description: 'Device Key / DevEUI (Hex 16 chars)', example: '373137315832700E' })
  @IsString()
  @IsOptional()
  device_key?: string;

  @ApiPropertyOptional({ description: 'Item Code to verify against', example: 'WSLRW-IEC485-04-DC-RT' })
  @IsString()
  @IsOptional()
  item_code?: string;

  @ApiPropertyOptional({ description: 'Firmware Version to verify against', example: '3F0819' })
  @IsString()
  @IsOptional()
  fw_ver?: string;

  @ApiPropertyOptional({ description: 'Hardware Version to verify against', example: '1H' })
  @IsString()
  @IsOptional()
  hw_ver?: string;

  @ApiPropertyOptional({ description: 'Selected Sales Order to verify against', example: 'SO/2026/01462' })
  @IsString()
  @IsOptional()
  so?: string;
}

export class CreateDeviceTestedDto {
  @ApiPropertyOptional({ description: 'Sales Order Code', example: 'SO/2026/01462' })
  @IsString()
  @IsOptional()
  so?: string;

  @ApiPropertyOptional({ description: 'Sales Order Number', example: 'SO/2026/01462' })
  @IsString()
  @IsOptional()
  so_number?: string;

  @ApiProperty({ description: 'Item Code', example: 'WSLRW-IEC485-04-DC-RT' })
  @IsString()
  @IsNotEmpty()
  item_code: string;

  @ApiProperty({ description: 'Serial Number', example: 'LRRS26000599' })
  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @ApiPropertyOptional({ description: 'Device EUI (Hex 16 chars)', example: '373137315832700E' })
  @IsString()
  @IsOptional()
  dev_eui?: string;

  @ApiPropertyOptional({ description: 'Device Key (DevEUI)', example: '373137315832700E' })
  @IsString()
  @IsOptional()
  device_key?: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'WSLRW-IEC485' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Firmware Version', example: '3F0819' })
  @IsString()
  @IsOptional()
  firmware_version?: string;

  @ApiPropertyOptional({ description: 'Firmware Version (Standard)', example: '3F0819' })
  @IsString()
  @IsOptional()
  fw_ver?: string;

  @ApiPropertyOptional({ description: 'Hardware Version', example: '1H' })
  @IsString()
  @IsOptional()
  hw_ver?: string;

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

  @ApiPropertyOptional({ description: 'QA Testing Result', default: 'PASS' })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiPropertyOptional({ description: 'QA Automated Check Status', default: 'PASS' })
  @IsString()
  @IsOptional()
  auto_check?: string;

  @ApiPropertyOptional({ description: 'QA Test ID' })
  @IsString()
  @IsOptional()
  test_id?: string;

  @ApiPropertyOptional({ description: 'Label Check Code' })
  @IsString()
  @IsOptional()
  label_check_code?: string;

  @ApiPropertyOptional({ description: 'Start Time' })
  @IsString()
  @IsOptional()
  start_time?: string;

  @ApiPropertyOptional({ description: 'Duration Time' })
  @IsString()
  @IsOptional()
  duration_time?: string;

  @ApiPropertyOptional({ description: 'Finish Epoch Timestamp' })
  @IsOptional()
  time_finish?: number | string;

  @ApiPropertyOptional({ description: 'Testing Station ID', default: 'STATION-01' })
  @IsString()
  @IsOptional()
  station_id?: string;

  @ApiPropertyOptional({ description: 'Testing Station' })
  @IsString()
  @IsOptional()
  test_station?: string;

  @ApiPropertyOptional({ description: 'Operator username', default: 'admin' })
  @IsString()
  @IsOptional()
  operator?: string;

  @ApiPropertyOptional({ description: 'Test Person' })
  @IsString()
  @IsOptional()
  test_person?: string;

  @ApiPropertyOptional({ description: 'Test Result ID' })
  @IsString()
  @IsOptional()
  test_result_id?: string;

  @ApiPropertyOptional({ description: 'LoRaWAN AppKey if configured' })
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

  @ApiPropertyOptional({ description: 'Test Note' })
  @IsString()
  @IsOptional()
  test_note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata JSON' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Raw 63 CSV fields JSON' })
  @IsObject()
  @IsOptional()
  csv_raw_data?: Record<string, any>;
}

export class UpdateAppKeyDto {
  @ApiProperty({ description: '128-bit LoRaWAN AppKey (32 Hex characters)', example: '2B7E151628AED2A6ABF7158809CF4F3C' })
  @IsString()
  @IsNotEmpty()
  app_key: string;
}

export class ImportCsvDto {
  @ApiPropertyOptional({ description: 'Raw CSV text' })
  @IsString()
  @IsOptional()
  csv_content?: string;

  @ApiPropertyOptional({ description: 'Parsed CSV row array' })
  @IsOptional()
  records?: Array<Record<string, any>>;
}

export class QueryDeviceTestedDto {
  @ApiPropertyOptional({ description: 'Filter by SO' })
  @IsString()
  @IsOptional()
  so?: string;

  @ApiPropertyOptional({ description: 'Filter by SO Number' })
  @IsString()
  @IsOptional()
  so_number?: string;

  @ApiPropertyOptional({ description: 'Filter by Item Code' })
  @IsString()
  @IsOptional()
  item_code?: string;

  @ApiPropertyOptional({ description: 'Filter by Serial Number' })
  @IsString()
  @IsOptional()
  serial_number?: string;

  @ApiPropertyOptional({ description: 'Filter by Device Key' })
  @IsString()
  @IsOptional()
  device_key?: string;

  @ApiPropertyOptional({ description: 'Filter by Status / Result' })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by Auto Check status' })
  @IsOptional()
  auto_check?: string;

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
