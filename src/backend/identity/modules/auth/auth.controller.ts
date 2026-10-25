import { Controller, Post, Body, Get, Put, Patch, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Authentication & Control Panel Access')
@Controller(['auth', 'api/auth', 'api/v1/auth'])
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
  async logout(@Req() req: Request, @Res() res: Response) {
    const cookieNames = ['access_token', 'lorawan_token', 'session_id', 'connect.sid'];
    cookieNames.forEach((name) => {
      res.clearCookie(name, { path: '/', sameSite: 'lax', httpOnly: false });
      res.clearCookie(name, { path: '/', sameSite: 'lax', httpOnly: true });
      res.clearCookie(name, { path: '/' });
      res.clearCookie(name);
    });
    if (req.method === 'GET') {
      return res.redirect('/login?logout=1');
    }
    return res.json({ success: true, message: 'Logged out successfully' });
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
      isActive: user.isActive,
      roles: user.roles,
    };
  }

  @Put('profile')
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update personal profile (fullName, email)' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  @Put('change-password')
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }
}
