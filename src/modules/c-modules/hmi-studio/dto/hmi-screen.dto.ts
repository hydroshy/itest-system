import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsObject } from 'class-validator';
import { CanvasConfig, HmiWidget } from '../entities/hmi-screen.entity';

export class CreateHmiScreenDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  canvasConfig?: CanvasConfig;

  @IsArray()
  @IsOptional()
  widgets?: HmiWidget[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsArray()
  @IsOptional()
  allowedRoles?: string[];
}

export class UpdateHmiScreenDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  canvasConfig?: CanvasConfig;

  @IsArray()
  @IsOptional()
  widgets?: HmiWidget[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsArray()
  @IsOptional()
  allowedRoles?: string[];
}

export class CloneHmiScreenDto {
  @IsString()
  @IsOptional()
  name?: string;
}

export class PublishHmiScreenDto {
  @IsBoolean()
  isPublished: boolean;
}
