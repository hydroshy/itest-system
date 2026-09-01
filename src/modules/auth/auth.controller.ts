import { Controller, Post, Body, Get, Res, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
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
  @ApiOperation({ summary: 'Login and establish session (Sets auth cookie & returns JWT)' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    // Set session cookie for seamless browser navigation
    res.cookie('access_token', result.access_token, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600 * 1000,
    });
    return result;
  }

  @Get('logout')
  @Post('logout')
  @ApiOperation({ summary: 'Logout and clear session cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('lorawan_token', { path: '/' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('session')
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user session and permissions' })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      userType: user.userType,
      roles: user.roles,
    };
  }

  @Post('init-superadmin')
  @ApiOperation({ summary: 'Khởi tạo hoặc cập nhật tài khoản Super Admin (Mặc định: admin / Dvt@123)' })
  async initSuperAdmin(@Body() body?: { username?: string; email?: string; pass?: string }) {
    try {
      return await this.authService.registerInitialAdmin(
        body?.username || 'admin',
        body?.email || 'admin@daviteq.com',
        body?.pass || 'Dvt@123',
      );
    } catch (err: any) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Lỗi khởi tạo Super Admin: ${err.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

