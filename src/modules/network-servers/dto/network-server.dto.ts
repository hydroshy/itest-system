import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkServerType } from '../entities/network-server.entity';

export class RegionProfileDto {
  @ApiProperty({ description: 'ID định danh của region profile', example: 'prof-as923-vn' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Tên hiển thị của Region Profile', example: 'Vietnam AS923-1 Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Mã vùng tần số LoRaWAN', example: 'AS923-1' })
  @IsString()
  @IsNotEmpty()
  region: string;

  @ApiPropertyOptional({ description: 'Route Reference cho ThingPark Wireless', example: 'TP_VN_AS923_01' })
  @IsString()
  @IsOptional()
  routeRef?: string;

  @ApiPropertyOptional({ description: 'Device/Service Profile ID cho ChirpStack', example: 'dp_e62b6680-4966-419b' })
  @IsString()
  @IsOptional()
  profileId?: string;

  @ApiPropertyOptional({ description: 'Dải tần số hoạt động', example: '920-925 MHz' })
  @IsString()
  @IsOptional()
  frequencyBand?: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết region profile', example: 'Dành cho thị trường Việt Nam theo chuẩn AS923-1' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Trạng thái kích hoạt', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateNetworkServerDto {
  @ApiProperty({ description: 'Tên của Network Server', example: 'ThingPark Wireless Enterprise' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: NetworkServerType, description: 'Loại Network Server', example: NetworkServerType.THINGPARK })
  @IsEnum(NetworkServerType)
  type: NetworkServerType;

  @ApiPropertyOptional({ description: 'Mô tả Network Server', example: 'Actility ThingPark Enterprise Server for EU & AS regions' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Base API Endpoint URL', example: 'https://community.thingpark.io/thingpark/wireless/rest/v1' })
  @IsString()
  @IsOptional()
  apiUrl?: string;

  @ApiPropertyOptional({ description: 'API Key / Token / Secret', example: 'tp_sec_token_998822' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Route Reference mặc định (cho ThingPark)', example: 'DAVITEQ_TP_DEFAULT_ROUTE' })
  @IsString()
  @IsOptional()
  routeRef?: string;

  @ApiPropertyOptional({ description: 'Danh sách Region Profiles', type: [RegionProfileDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RegionProfileDto)
  regionProfiles?: RegionProfileDto[];

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động', example: 'ONLINE' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Đặt làm Network Server mặc định', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Metadata hoặc tùy chỉnh mở rộng' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNetworkServerDto {
  @ApiPropertyOptional({ description: 'Tên của Network Server' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: NetworkServerType, description: 'Loại Network Server' })
  @IsEnum(NetworkServerType)
  @IsOptional()
  type?: NetworkServerType;

  @ApiPropertyOptional({ description: 'Mô tả Network Server' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Base API Endpoint URL' })
  @IsString()
  @IsOptional()
  apiUrl?: string;

  @ApiPropertyOptional({ description: 'API Key / Token / Secret' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Route Reference mặc định' })
  @IsString()
  @IsOptional()
  routeRef?: string;

  @ApiPropertyOptional({ description: 'Danh sách Region Profiles', type: [RegionProfileDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RegionProfileDto)
  regionProfiles?: RegionProfileDto[];

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Đặt làm Network Server mặc định' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Metadata hoặc tùy chỉnh mở rộng' })
  @IsOptional()
  metadata?: Record<string, any>;
}
