import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsIn,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssertionDto {
  @ApiProperty({ description: 'Extracted payload field name (e.g. temperature, co2, battery)' })
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @ApiPropertyOptional({ description: 'User-facing display label' })
  @IsOptional()
  @IsString()
  fieldLabel?: string;

  @ApiProperty({ description: 'Matching operator', enum: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN_RANGE', 'BETWEEN', 'REGEX', 'IS_NOT_NULL', 'CONTAINS'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN_RANGE', 'BETWEEN', 'REGEX', 'IS_NOT_NULL', 'CONTAINS'])
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN_RANGE' | 'BETWEEN' | 'REGEX' | 'IS_NOT_NULL' | 'CONTAINS';

  @ApiPropertyOptional({ description: 'Expected value (scalar or { min, max })' })
  @IsOptional()
  expectedValue?: any;

  @ApiPropertyOptional({ description: 'Allowed tolerance' })
  @IsOptional()
  @IsNumber()
  tolerance?: number;

  @ApiPropertyOptional({ description: 'Engineering unit (e.g. °C, ppm, V)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Severity level', enum: ['ERROR', 'WARNING'] })
  @IsOptional()
  @IsIn(['ERROR', 'WARNING'])
  severity?: 'ERROR' | 'WARNING';

  @ApiPropertyOptional({ description: 'Order index' })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Description of assertion rule' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTestTemplateDto {
  @ApiProperty({ description: 'Test template name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique template code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Target device SKU' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Firmware version' })
  @IsString()
  @IsNotEmpty()
  firmwareVersion: string;

  @ApiPropertyOptional({ description: 'Execution mode', enum: ['FLOW', 'SCRIPT', 'HYBRID'] })
  @IsOptional()
  @IsIn(['FLOW', 'SCRIPT', 'HYBRID'])
  executionMode?: 'FLOW' | 'SCRIPT' | 'HYBRID';

  @ApiPropertyOptional({ description: 'Visual Flow DAG configuration (Node-RED style)' })
  @IsOptional()
  @IsObject()
  flowConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'JavaScript verification script' })
  @IsOptional()
  @IsString()
  customScript?: string;

  @ApiPropertyOptional({ description: 'Timeout in seconds' })
  @IsOptional()
  @IsNumber()
  timeoutSeconds?: number;

  @ApiPropertyOptional({ description: 'Minimum packets required to evaluate' })
  @IsOptional()
  @IsNumber()
  minPacketsRequired?: number;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [CreateAssertionDto], description: 'List of test assertions' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssertionDto)
  assertions?: CreateAssertionDto[];
}

export class UpdateTestTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firmwareVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['FLOW', 'SCRIPT', 'HYBRID'])
  executionMode?: 'FLOW' | 'SCRIPT' | 'HYBRID';

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  flowConfig?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customScript?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  timeoutSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minPacketsRequired?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [CreateAssertionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssertionDto)
  assertions?: CreateAssertionDto[];
}

export class DryRunTestDto {
  @ApiPropertyOptional({ description: 'Template code or ID' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Execution mode', enum: ['FLOW', 'SCRIPT', 'HYBRID'] })
  @IsOptional()
  @IsIn(['FLOW', 'SCRIPT', 'HYBRID'])
  executionMode?: 'FLOW' | 'SCRIPT' | 'HYBRID';

  @ApiPropertyOptional({ type: [CreateAssertionDto], description: 'List of assertions' })
  @IsOptional()
  @IsArray()
  assertions?: CreateAssertionDto[];

  @ApiPropertyOptional({ description: 'JavaScript verification script' })
  @IsOptional()
  @IsString()
  customScript?: string;

  @ApiProperty({ description: 'Mock telemetry packet' })
  @IsObject()
  mockPacket: {
    fPort?: number;
    fCnt?: number;
    rssi?: number;
    snr?: number;
    payloadHex?: string;
    decoded?: Record<string, any>;
    decodedData?: Record<string, any>;
  };

  @ApiPropertyOptional({ description: 'Visual Flow DAG configuration (nodes & edges/wires)' })
  @IsOptional()
  @IsObject()
  flowConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Test execution context' })
  @IsOptional()
  @IsObject()
  context?: {
    packetCount?: number;
    minPackets?: number;
    durationSeconds?: number;
    buffer?: Record<string, number[]>;
    referenceDevices?: Record<string, any>;
    goldenUnit?: Record<string, any>;
    [key: string]: any;
  };
}

export class ValidateFlowDto {
  @ApiProperty({ description: 'Visual Flow graph configuration to validate' })
  @IsNotEmpty()
  @IsObject()
  flowConfig: Record<string, any>;
}

export class ExecuteFlowDto {
  @ApiProperty({ description: 'Visual Flow graph configuration to execute' })
  @IsNotEmpty()
  @IsObject()
  flowConfig: Record<string, any>;

  @ApiPropertyOptional({ description: 'Mock telemetry packet' })
  @IsOptional()
  @IsObject()
  mockPacket?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Test execution context (buffer, goldenUnit, referenceDevices...)' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

