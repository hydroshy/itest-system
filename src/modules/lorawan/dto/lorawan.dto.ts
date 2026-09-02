import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  devEUI: string;

  @IsString()
  @IsOptional()
  name?: string;

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
  payloadFormatterScript?: string;
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
