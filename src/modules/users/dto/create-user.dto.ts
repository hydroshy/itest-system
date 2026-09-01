import { IsString, IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional, IsArray, IsUUID } from 'class-validator';
import { UserType } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(UserType)
  @IsOptional()
  userType?: UserType; // SUB_ADMIN or USER

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  roleIds?: string[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  permissionIds?: string[];
}
