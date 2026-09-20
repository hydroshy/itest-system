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
  @ApiProperty({ description: 'Tên trường trích xuất từ payload (vd: temperature, co2, battery)' })
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @ApiPropertyOptional({ description: 'Nhãn hiển thị người dùng' })
  @IsOptional()
  @IsString()
  fieldLabel?: string;

  @ApiProperty({ description: 'Phép toán so khớp', enum: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN_RANGE', 'BETWEEN', 'REGEX', 'IS_NOT_NULL', 'CONTAINS'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN_RANGE', 'BETWEEN', 'REGEX', 'IS_NOT_NULL', 'CONTAINS'])
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN_RANGE' | 'BETWEEN' | 'REGEX' | 'IS_NOT_NULL' | 'CONTAINS';

  @ApiPropertyOptional({ description: 'Giá trị kỳ vọng (scalar hoặc { min, max })' })
  @IsOptional()
  expectedValue?: any;

  @ApiPropertyOptional({ description: 'Dung sai cho phép' })
  @IsOptional()
  @IsNumber()
  tolerance?: number;

  @ApiPropertyOptional({ description: 'Đơn vị đo (vd: °C, ppm, V)' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ description: 'Mức độ nghiêm trọng', enum: ['ERROR', 'WARNING'] })
  @IsOptional()
  @IsIn(['ERROR', 'WARNING'])
  severity?: 'ERROR' | 'WARNING';

  @ApiPropertyOptional({ description: 'Thứ tự ưu tiên' })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'Mô tả kiểm thử cho trường này' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTestTemplateDto {
  @ApiProperty({ description: 'Tên kịch bản kiểm thử' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Mã kịch bản (duy nhất)' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Mã SKU thiết bị' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ description: 'Firmware version' })
  @IsString()
  @IsNotEmpty()
  firmwareVersion: string;

  @ApiPropertyOptional({ description: 'Chế độ tạo kịch bản', enum: ['FLOW', 'SCRIPT', 'HYBRID'] })
  @IsOptional()
  @IsIn(['FLOW', 'SCRIPT', 'HYBRID'])
  executionMode?: 'FLOW' | 'SCRIPT' | 'HYBRID';

  @ApiPropertyOptional({ description: 'Cấu hình đồ thị trực quan dạng Node-RED' })
  @IsOptional()
  @IsObject()
  flowConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Mã JavaScript hàm kiểm định đánh giá' })
  @IsOptional()
  @IsString()
  customScript?: string;

  @ApiPropertyOptional({ description: 'Thời gian timeout (giây)' })
  @IsOptional()
  @IsNumber()
  timeoutSeconds?: number;

  @ApiPropertyOptional({ description: 'Số lượng gói tin tối thiểu cần thu thập' })
  @IsOptional()
  @IsNumber()
  minPacketsRequired?: number;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Metadata bổ sung' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ type: [CreateAssertionDto], description: 'Danh sách các assertions kiểm định' })
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
  @ApiPropertyOptional({ description: 'Mã kịch bản hoặc ID' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Chế độ chạy', enum: ['FLOW', 'SCRIPT', 'HYBRID'] })
  @IsOptional()
  @IsIn(['FLOW', 'SCRIPT', 'HYBRID'])
  executionMode?: 'FLOW' | 'SCRIPT' | 'HYBRID';

  @ApiPropertyOptional({ type: [CreateAssertionDto], description: 'Danh sách assertions' })
  @IsOptional()
  @IsArray()
  assertions?: CreateAssertionDto[];

  @ApiPropertyOptional({ description: 'Mã JavaScript script' })
  @IsOptional()
  @IsString()
  customScript?: string;

  @ApiProperty({ description: 'Dữ liệu gói tin kiểm thử (mock packet)' })
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

  @ApiPropertyOptional({ description: 'Cấu hình đồ thị Visual Flow (DAG nodes & edges/wires)' })
  @IsOptional()
  @IsObject()
  flowConfig?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Ngữ cảnh kiểm thử' })
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
  @ApiProperty({ description: 'Cấu hình đồ thị Visual Flow cần kiểm tra DAG' })
  @IsNotEmpty()
  @IsObject()
  flowConfig: Record<string, any>;
}

export class ExecuteFlowDto {
  @ApiProperty({ description: 'Cấu hình đồ thị Visual Flow' })
  @IsNotEmpty()
  @IsObject()
  flowConfig: Record<string, any>;

  @ApiPropertyOptional({ description: 'Gói tin mock telemetry' })
  @IsOptional()
  @IsObject()
  mockPacket?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Ngữ cảnh kiểm thử (buffer, goldenUnit, referenceDevices...)' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

