import { IsString, IsOptional } from 'class-validator';

export class InitSuperAdminDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  pass?: string;
}
