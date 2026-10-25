import { IsArray, IsUUID, IsOptional, IsBoolean, IsString, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  roleIds?: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  permissionIds?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
