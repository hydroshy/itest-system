import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { LOGIN_HTML } from './views/login.view';
import { CONTROL_PANEL_HTML } from './views/control-panel.view';

@Controller()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  root(@Req() req: Request, @Res() res: Response) {
    const isLogout = req.query?.logout === '1' || req.query?.logout === 'true';
    if (isLogout) {
      res.clearCookie('access_token', { path: '/', sameSite: 'lax', httpOnly: false });
      res.clearCookie('lorawan_token', { path: '/', sameSite: 'lax', httpOnly: false });
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('lorawan_token', { path: '/' });
      return res.redirect('/login?logout=1');
    }
    const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
    if (token && token !== 'undefined' && token !== 'null') {
      return res.redirect('/control-panel');
    }
    return res.redirect('/login');
  }

  @Get('login')
  @ApiExcludeEndpoint()
  getLoginPage(@Req() req: Request, @Res() res: Response) {
    const isLogout = req.query?.logout === '1' || req.query?.logout === 'true';
    if (isLogout) {
      res.clearCookie('access_token', { path: '/', sameSite: 'lax', httpOnly: false });
      res.clearCookie('lorawan_token', { path: '/', sameSite: 'lax', httpOnly: false });
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('lorawan_token', { path: '/' });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(LOGIN_HTML);
    }
    const token = req.cookies?.['access_token'] || req.cookies?.['lorawan_token'];
    if (token && token !== 'undefined' && token !== 'null') {
      return res.redirect('/control-panel');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(LOGIN_HTML);
  }

  @Get('control-panel')
  @ApiExcludeEndpoint()
  getControlPanelPage(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(CONTROL_PANEL_HTML);
  }
}
