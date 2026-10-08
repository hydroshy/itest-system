import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum FinalConfigStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NONE = 'NONE',
}

export class QueryPresetsDto {
  @IsOptional()
  @IsString()
  so?: string;

  @IsOptional()
  @IsString()
  item_code?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number;
}

export class QueryPresetBySoItemDto {
  @IsNotEmpty()
  @IsString()
  so: string;

  @IsNotEmpty()
  @IsString()
  item_code: string;
}

export class QueryDevicesDto {
  @IsOptional()
  @IsEnum(FinalConfigStatus)
  status?: FinalConfigStatus;

  @IsOptional()
  @IsString()
  so?: string;

  @IsOptional()
  @IsString()
  item_code?: string;

  @IsOptional()
  @IsString()
  serial_number?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number;
}

export class DeviceRegisterDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNumber()
  @Min(0)
  address: number;

  @IsOptional()
  @IsString()
  modbus_reg_hex?: string;

  @IsOptional()
  @IsNumber()
  slave?: number;

  @IsOptional()
  @IsNumber()
  reg_num?: number;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  parameter_name?: string;

  @IsOptional()
  @IsString()
  value_to_write?: string;

  @IsOptional()
  @IsString()
  value_read_back?: string;

  @IsOptional()
  @IsEnum(FinalConfigStatus)
  status?: FinalConfigStatus;

  @IsOptional()
  @IsString()
  endianness?: string;

  @IsOptional()
  @IsString()
  fn_read?: string;

  @IsOptional()
  @IsString()
  fn_write?: string;

  @IsOptional()
  @IsNumber()
  order_no?: number;
}

export class SaveDeviceFinalConfigDto {
  @IsNotEmpty()
  @IsString()
  serial_number: string;

  @IsNotEmpty()
  @IsString()
  item_code: string;

  @IsOptional()
  @IsString()
  so?: string;

  @IsOptional()
  @IsString()
  preset_id?: string;

  @IsNotEmpty()
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  firmware_version?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  short_fw?: number;

  @IsOptional()
  @IsEnum(FinalConfigStatus)
  status?: FinalConfigStatus;

  @IsOptional()
  @IsString()
  dev_eui?: string;

  @IsOptional()
  @IsString()
  app_key?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  registers?: DeviceRegisterDto[];
}

export class SyncFromPresetDto {
  @IsNotEmpty()
  @IsString()
  so: string;

  @IsNotEmpty()
  @IsString()
  item_code: string;

  @IsArray()
  @IsNotEmpty()
  serial_numbers: string[];

  @IsOptional()
  @IsString()
  operator?: string;
}

export class UpdateDeviceStatusDto {
  @IsNotEmpty()
  @IsEnum(FinalConfigStatus)
  status: FinalConfigStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsArray()
  registers?: Partial<DeviceRegisterDto>[];
}
