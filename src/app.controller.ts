import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LOGIN_HTML } from './views/login.view';
import { DASHBOARD_HTML } from './views/dashboard.view';
import { CONTROL_PANEL_HTML } from './views/control-panel.view';

@Controller()
export class AppController {
  private setNoCacheHeaders(res: Response) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  private clearAllCookies(res: Response) {
    const cookieNames = ['access_token', 'lorawan_token', 'session_id', 'connect.sid'];
    cookieNames.forEach((name) => {
      res.clearCookie(name, { path: '/', sameSite: 'lax', httpOnly: false });
      res.clearCookie(name, { path: '/', sameSite: 'lax', httpOnly: true });
      res.clearCookie(name, { path: '/' });
      res.clearCookie(name);
    });
  }

  @Get()
  @ApiExcludeEndpoint()
  root(@Req() req: Request, @Res() res: Response) {
    this.setNoCacheHeaders(res);
    const isLogout = req.query?.logout === '1' || req.query?.logout === 'true' || req.query?.clear === '1';
    if (isLogout) {
      this.clearAllCookies(res);
      return res.redirect('/login?cleared=1');
    }
    const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
    if (token && token !== 'undefined' && token !== 'null' && token.length > 20) {
      return res.redirect('/dashboard');
    }
    return res.redirect('/login');
  }

  @Get('login')
  @ApiExcludeEndpoint()
  getLoginPage(@Req() req: Request, @Res() res: Response) {
    this.setNoCacheHeaders(res);
    const isClearing =
      req.query?.logout === '1' ||
      req.query?.logout === 'true' ||
      req.query?.clear === '1' ||
      req.query?.cleared === '1' ||
      req.query?.reset === '1';

    if (isClearing) {
      this.clearAllCookies(res);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(LOGIN_HTML);
  }

  @Get('dashboard')
  @ApiExcludeEndpoint()
  getDashboardPage(@Req() req: Request, @Res() res: Response) {
    this.setNoCacheHeaders(res);
    const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
    if (!token || token === 'undefined' || token === 'null' || token.length < 20) {
      return res.redirect('/login');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(DASHBOARD_HTML);
  }

  @Get('control-panel')
  @ApiExcludeEndpoint()
  getControlPanelPage(@Req() req: Request, @Res() res: Response) {
    this.setNoCacheHeaders(res);
    const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
    if (!token || token === 'undefined' || token === 'null' || token.length < 20) {
      return res.redirect('/login');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(CONTROL_PANEL_HTML);
  }

  @Get('reset-session')
  @ApiExcludeEndpoint()
  resetSessionGet(@Res() res: Response) {
    this.setNoCacheHeaders(res);
    this.clearAllCookies(res);
    return res.redirect('/login?cleared=1');
  }

  @Post('reset-session')
  @ApiExcludeEndpoint()
  resetSessionPost(@Res() res: Response) {
    this.setNoCacheHeaders(res);
    this.clearAllCookies(res);
    return res.json({ success: true, message: 'Session cleared successfully' });
  }

  @Get('auth/clear-session')
  @ApiExcludeEndpoint()
  clearSession(@Res() res: Response) {
    this.setNoCacheHeaders(res);
    this.clearAllCookies(res);
    return res.redirect('/login?cleared=1');
  }
}
