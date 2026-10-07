import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class SimulatePacketDto {
  @ApiProperty({
    description: 'DevEUI of the device under test (16 hex chars)',
    example: '0011223344556601',
  })
  @IsString()
  @IsNotEmpty()
  devEUI: string;

  @ApiPropertyOptional({
    description: 'LoRaWAN fPort number',
    default: 1,
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  fPort?: number;

  @ApiProperty({
    description: 'Hex-encoded payload from device uplink',
    example: '010100f50201025803010e10',
  })
  @IsString()
  @IsNotEmpty()
  payloadHex: string;

  @ApiPropertyOptional({
    description: 'RSSI signal strength in dBm',
    default: -75,
  })
  @IsNumber()
  @IsOptional()
  rssi?: number;

  @ApiPropertyOptional({
    description: 'SNR signal to noise ratio in dB',
    default: 9.5,
  })
  @IsNumber()
  @IsOptional()
  snr?: number;

  @ApiPropertyOptional({
    description: 'Gateway ID / MAC address',
    default: 'GW-BENCH-01',
  })
  @IsString()
  @IsOptional()
  gatewayId?: string;

  @ApiPropertyOptional({
    description: 'Frame counter fCnt',
    default: 1,
  })
  @IsNumber()
  @IsOptional()
  fCnt?: number;

  @ApiPropertyOptional({
    description: 'Hardware Serial Number (Modbus Reg 259)',
    example: 'WSLRW-ATH-260901',
  })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter packet ingestion by Sales Order code',
    example: 'SO-2025-001',
  })
  @IsString()
  @IsOptional()
  soCode?: string;

  @ApiPropertyOptional({
    description: 'Filter packet ingestion by Item Code',
    example: 'WSLRW-ATH-01',
  })
  @IsString()
  @IsOptional()
  itemCode?: string;

  @ApiPropertyOptional({
    description: 'Direct target test session UUID',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}
