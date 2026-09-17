import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModbusRegisterItem } from '../entities/modbus-preset.entity';

export class CreateModbusPresetDto {
  @ApiProperty({ description: 'Template Display Name', example: 'Daviteq LKS Gas Sensor - RD1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Template description or notes' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Target profile type', example: 'RD1', default: 'Custom' })
  @IsString()
  @IsOptional()
  profileType?: string;

  @ApiPropertyOptional({ description: 'Author or creator username' })
  @IsString()
  @IsOptional()
  createdBy?: string;

  @ApiProperty({ description: 'Array of Modbus register mappings' })
  @IsArray()
  registers: ModbusRegisterItem[];
}

export class UpdateModbusPresetDto {
  @ApiPropertyOptional({ description: 'Template Display Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description or notes' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Target profile type' })
  @IsString()
  @IsOptional()
  profileType?: string;

  @ApiPropertyOptional({ description: 'Array of Modbus register mappings' })
  @IsArray()
  @IsOptional()
  registers?: ModbusRegisterItem[];
}
