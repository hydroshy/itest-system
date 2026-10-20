import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  usernameOrEmail?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
