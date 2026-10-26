import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  permissionIds?: string[];
}

export class AssignRoleUsersDto {
  @IsArray()
  userIds: string[];
}

export class AssignRolePermissionsDto {
  @IsArray()
  permissionIds: string[];
}

export class AssignRoleMenusDto {
  @IsArray()
  @IsOptional()
  menuIds?: string[];

  @IsArray()
  @IsOptional()
  menuKeys?: string[];

  @IsArray()
  @IsOptional()
  menuItemIds?: string[];
}

