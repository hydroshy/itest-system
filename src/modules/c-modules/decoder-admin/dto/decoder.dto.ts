import { IsNotEmpty, IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDecoderDto {
  @ApiProperty({ example: 'WSLRW-V1A', description: 'Product SKU code' })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiProperty({ example: 9, description: 'Firmware version number between 1 and 32' })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(32)
  firmwareVersion: number;

  @ApiProperty({
    example: 'function decodeUplink(input) { return { data: { raw: input.bytes } }; }',
    description: 'JavaScript payload decoder function code with optional sub-functions',
  })
  @IsNotEmpty()
  @IsString()
  decoderCode: string;

  @ApiPropertyOptional({ example: 'Decoder for WSLRW-V1A Ambient Temperature & Humidity sensor', description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDecoderDto {
  @ApiPropertyOptional({
    example: 'function decodeUplink(input) { return { data: { temp: input.bytes[0] } }; }',
    description: 'JavaScript payload decoder function code',
  })
  @IsOptional()
  @IsString()
  decoderCode?: string;

  @ApiPropertyOptional({ example: 'Updated description', description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class TestDecoderDto {
  @ApiProperty({
    example: 'function decodeUplink(input) { return { data: { temp: input.bytes[0] } }; }',
    description: 'JavaScript decoder function code to test',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: '09C441', description: 'Hex-encoded payload string' })
  @IsNotEmpty()
  @IsString()
  hex: string;

  @ApiPropertyOptional({ example: 1, description: 'LoRaWAN fPort', default: 1 })
  @IsOptional()
  @IsInt()
  fPort?: number;
}
