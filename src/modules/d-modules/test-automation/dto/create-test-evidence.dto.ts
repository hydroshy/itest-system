import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsObject,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateTestEvidenceDto {
  @ApiPropertyOptional({ description: 'Test Session UUID' })
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Test Device Run UUID' })
  @IsUUID()
  @IsOptional()
  deviceRunId?: string;

  @ApiPropertyOptional({ description: 'Test Session Code' })
  @IsString()
  @IsOptional()
  sessionCode?: string;

  @ApiPropertyOptional({ description: 'Sales Order Code' })
  @IsString()
  @IsOptional()
  soCode?: string;

  @ApiPropertyOptional({ description: 'Item Code' })
  @IsString()
  @IsOptional()
  itemCode?: string;

  @ApiProperty({ description: '16-hex DevEUI' })
  @IsString()
  @IsNotEmpty()
  devEUI: string;

  @ApiPropertyOptional({ description: 'Hardware Serial Number (Modbus Reg 259)' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ description: 'SKU' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiPropertyOptional({ description: 'Firmware Version' })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @ApiPropertyOptional({ description: 'Hardware Version' })
  @IsString()
  @IsOptional()
  hardwareVersion?: string;

  @ApiProperty({ description: 'Raw hex uplink payload' })
  @IsString()
  @IsNotEmpty()
  payloadHex: string;

  @ApiProperty({ description: 'All decoded sensor fields' })
  @IsObject()
  decodedFields: Record<string, any>;

  @ApiPropertyOptional({ description: 'Assertion verification results' })
  @IsArray()
  @IsOptional()
  assertionResults?: any[];

  @ApiPropertyOptional({ description: 'Verdict (PASSED, FAILED, TIMEOUT, WARNING)' })
  @IsString()
  @IsOptional()
  verdict?: string;

  @ApiPropertyOptional({ description: 'Failure reason if not passed' })
  @IsString()
  @IsOptional()
  failureReason?: string;

  @ApiPropertyOptional({ description: 'LoRaWAN fPort' })
  @IsNumber()
  @IsOptional()
  fPort?: number;

  @ApiPropertyOptional({ description: 'Frame Counter' })
  @IsNumber()
  @IsOptional()
  fCnt?: number;

  @ApiPropertyOptional({ description: 'RSSI' })
  @IsNumber()
  @IsOptional()
  rssi?: number;

  @ApiPropertyOptional({ description: 'SNR' })
  @IsNumber()
  @IsOptional()
  snr?: number;

  @ApiPropertyOptional({ description: 'Battery Voltage' })
  @IsNumber()
  @IsOptional()
  batteryVoltage?: number;

  @ApiPropertyOptional({ description: 'Operator Username' })
  @IsString()
  @IsOptional()
  operatorUsername?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
