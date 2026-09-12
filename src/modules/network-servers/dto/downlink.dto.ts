import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class SendDownlinkDto {
  @ApiProperty({ description: 'DevEUI of target LoRaWAN device (16 hex chars)', example: '0102030405060708' })
  @IsNotEmpty()
  @IsString()
  devEUI: string;

  @ApiPropertyOptional({ description: 'LoRaWAN fPort (1-223)', default: 1, example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(223)
  fPort?: number;

  @ApiProperty({ description: 'Downlink Hex payload', example: '0102A3FF' })
  @IsNotEmpty()
  @IsString()
  payloadHex: string;

  @ApiPropertyOptional({ description: 'Whether to require confirmed ACK', default: false, example: false })
  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;

  @ApiPropertyOptional({ description: 'Flush existing downlink queue on Network Server before enqueueing', default: false, example: false })
  @IsOptional()
  @IsBoolean()
  flushQueue?: boolean;

  @ApiPropertyOptional({ description: 'Target Network Server ID (optional override)', example: 'a1b2c3d4-0000-0000-0000-000000000000' })
  @IsOptional()
  @IsString()
  networkServerId?: string;
}

export class FlushQueueDto {
  @ApiProperty({ description: 'DevEUI of target LoRaWAN device', example: '0102030405060708' })
  @IsNotEmpty()
  @IsString()
  devEUI: string;

  @ApiPropertyOptional({ description: 'Network Server ID', example: 'a1b2c3d4-0000-0000-0000-000000000000' })
  @IsOptional()
  @IsString()
  networkServerId?: string;
}
