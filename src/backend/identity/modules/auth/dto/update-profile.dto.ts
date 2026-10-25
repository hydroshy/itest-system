import { IsString, IsOptional, IsEmail, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Tên hiển thị đầy đủ của người dùng' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'user@daviteq.com', description: 'Email liên hệ' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;
}
