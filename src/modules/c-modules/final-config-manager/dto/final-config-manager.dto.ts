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
  default_value?: string;

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

export interface TraceabilityData {
  fw_code: string;                  // Reg 0:  Mã loại cảm biến (VD: "SATH")
  fw_version: string;               // Reg 5:  Phiên bản FW (VD: "6F0328")
  hw_version: string;               // Reg 9:  Phiên bản HW (VD: "1H")
  lorawan_protocol_version: string; // Reg 11: Phiên bản LoRaWAN (VD: "01.00.03")
  spare_15?: string;                // Reg 15: Dải spare nhà máy (hex)
  dev_eui: string;                  // Reg 27: DevEUI thiết bị (hex, 16 ký tự)
  app_eui: string;                  // Reg 31: AppEUI thiết bị (hex, 16 ký tự)
  factory_app_key: string;          // Reg 35: AppKey gốc ban đầu (hex, 32 ký tự)
  factory_nwk_skey: string;         // Reg 43: NwkSkey xuất xưởng (hex, 32 ký tự)
  factory_app_skey: string;         // Reg 51: AppSkey xuất xưởng (hex, 32 ký tự)
  read_at: string;                  // ISO 8601 Timestamp thời điểm đọc
  read_duration_ms?: number;        // Tổng thời gian đọc chu kỳ traceability (ms)
  max_read_attempts?: number;       // Cấu hình số lần đọc tối đa (5)
}

export interface FinalConfigSnMetadata {
  traceability?: TraceabilityData;
  client_environment?: {
    app_version?: string;
    serial_port?: string;
  };
  [key: string]: any;
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
  metadata?: FinalConfigSnMetadata;

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
