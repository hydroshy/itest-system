import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MemmapRegItemDto {
  @ApiProperty({ description: 'Row order number in CSV', example: 1 })
  @IsNumber()
  no: number;

  @ApiProperty({ description: 'Modbus Decimal Register', example: 0 })
  @IsNumber()
  modbus_reg_dec: number;

  @ApiProperty({ description: 'Modbus Hex Register', example: '0' })
  @IsString()
  @IsNotEmpty()
  modbus_reg_hex: string;

  @ApiPropertyOptional({ description: 'Function Code Read', example: '3', default: '3' })
  @IsString()
  @IsOptional()
  fn_read?: string;

  @ApiPropertyOptional({ description: 'Function Code Write', example: 'None', default: 'None' })
  @IsString()
  @IsOptional()
  fn_write?: string;

  @ApiProperty({ description: 'Number of registers occupied', example: 1, default: 1 })
  @IsNumber()
  num_regs: number;

  @ApiPropertyOptional({ description: 'Parameter description / tag name', example: 'FW_CODE' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Permitted range or values', example: '1-247' })
  @IsString()
  @IsOptional()
  range_val?: string;

  @ApiPropertyOptional({ description: 'Default value for end-users', example: 'SATH' })
  @IsString()
  @IsOptional()
  end_user_default?: string;

  @ApiPropertyOptional({ description: 'Data format', example: 'string' })
  @IsString()
  @IsOptional()
  format?: string;

  @ApiPropertyOptional({ description: 'Downlink type 5 support flag', example: 'No' })
  @IsString()
  @IsOptional()
  downlink_type_5?: string;

  @ApiProperty({ description: 'Flag in RD1 Template', example: false, default: false })
  @IsBoolean()
  in_rd1_template: boolean;

  @ApiPropertyOptional({ description: 'Detailed comments or multiline notes' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty({ description: 'Flag in Engineering Template', example: false, default: false })
  @IsBoolean()
  in_engineering_template: boolean;

  @ApiProperty({ description: 'Flag in End-user Template', example: false, default: false })
  @IsBoolean()
  in_end_user_template: boolean;

  @ApiProperty({ description: 'Flag in Full Template', example: true, default: false })
  @IsBoolean()
  in_full_template: boolean;
}

export class UploadMemmapDto {
  @ApiProperty({
    description: 'Hardware SKU (e.g. WSLRW-ATH)',
    example: 'WSLRW-ATH',
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({
    description: 'Full Firmware Version identifier string (e.g. 3F0825, 6Fmmdd)',
    example: '3F0825',
  })
  @IsString()
  @IsOptional()
  long_fw?: string;

  @ApiProperty({
    description: 'Strict integer Short Firmware Version without prefix or decimals (e.g. 6)',
    example: 6,
  })
  @IsNumber()
  short_fw: number;

  @ApiPropertyOptional({
    description: 'Original CSV filename',
    example: 'WSLRW-ATH-6.csv',
  })
  @IsString()
  @IsOptional()
  file_name?: string;

  @ApiProperty({
    description: 'Array of 16-field Modbus register items',
    type: [MemmapRegItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MemmapRegItemDto)
  registers: MemmapRegItemDto[];
}
