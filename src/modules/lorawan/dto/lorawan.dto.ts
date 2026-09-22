import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  devEUI: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  appEUI?: string;

  @IsString()
  @IsOptional()
  appKey?: string;

  @IsString()
  @IsOptional()
  activationType?: string;

  @IsString()
  @IsOptional()
  networkServerId?: string;

  @IsString()
  @IsOptional()
  regionProfileId?: string;

  @IsString()
  @IsOptional()
  decoderId?: string;

  @IsString()
  @IsOptional()
  itemCodeId?: string;

  @IsString()
  @IsOptional()
  salesOrderId?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @IsString()
  @IsOptional()
  payloadFormatterScript?: string;

  @IsString()
  @IsOptional()
  provisionTarget?: 'SERVER' | 'LOCAL';

  @IsOptional()
  isActive?: boolean;
}

export class RegisterGatewayDto {
  @IsString()
  @IsNotEmpty()
  gatewayEUI: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsNumber()
  altitude?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  networkServerId?: string;

  @IsString()
  @IsOptional()
  regionProfileId?: string;
}

export class UplinkPayloadDto {
  @IsString()
  @IsNotEmpty()
  devEUI: string;

  @IsString()
  @IsNotEmpty()
  payloadHex: string;

  @IsNumber()
  @IsOptional()
  fPort?: number;

  @IsNumber()
  @IsOptional()
  fCnt?: number;
}

export class TestPayloadFormatterDto {
  @IsString()
  @IsNotEmpty()
  script: string;

  @IsString()
  @IsNotEmpty()
  bytesHex: string;

  @IsNumber()
  @IsOptional()
  fPort?: number;
}
