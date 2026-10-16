import { IsArray, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserPermissionsDto {
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
