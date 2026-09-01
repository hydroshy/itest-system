import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Authentication & Control Panel Access')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập hệ thống (Lấy Bearer JWT Token)' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xem thông tin tài khoản hiện tại & ma trận phân quyền' })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      roles: user.roles,
      directPermissions: user.directPermissions,
    };
  }

  @Post('init-superadmin')
  @ApiOperation({ summary: 'Khởi tạo hoặc cập nhật tài khoản Super Admin (Mặc định: admin / Dvt@123)' })
  async initSuperAdmin(@Body() body?: { username?: string; email?: string; pass?: string }) {
    return this.authService.registerInitialAdmin(
      body?.username || 'admin',
      body?.email || 'admin@daviteq.com',
      body?.pass || 'Dvt@123',
    );
  }
}

