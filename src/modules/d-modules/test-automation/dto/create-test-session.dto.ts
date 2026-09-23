import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateTestSessionDto {
  @ApiPropertyOptional({
    description: 'Unique test session code (e.g. TS-20260922-001). Auto-generated if omitted.',
    example: 'TS-20260922-001',
  })
  @IsString()
  @IsOptional()
  sessionCode?: string;

  @ApiProperty({
    description: 'Sales Order Code (e.g. SO-2026-8899)',
    example: 'SO-2026-8899',
  })
  @IsString()
  @IsNotEmpty()
  soCode: string;

  @ApiProperty({
    description: 'Item Code within the Sales Order (e.g. WSLRW-TH-01)',
    example: 'WSLRW-TH-01',
  })
  @IsString()
  @IsNotEmpty()
  itemCode: string;

  @ApiPropertyOptional({
    description: 'Test Template UUID (auto-detected from Item Code / SKU if omitted)',
  })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiProperty({
    description:
      'List of 16-hex-character DevEUIs to test. Can be passed as an array of strings or newline/comma-separated text.',
    example: ['0011223344556601', '0011223344556602'],
  })
  devEUIs: string[] | string;

  @ApiPropertyOptional({
    description: 'Session notes or factory batch/lot identifier',
    example: 'Batch 50 units for Factory Inspection ISO audit',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Immediately start the test session upon creation',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoStart?: boolean;

  @ApiPropertyOptional({
    description: 'Custom metadata payload',
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Explicit device SKU for manual SO creation',
  })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({
    description: 'Explicit device firmware version for manual SO creation',
  })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;
}
