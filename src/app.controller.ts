import { Controller, Get, Redirect, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { LOGIN_HTML } from './views/login.view';
import { CONTROL_PANEL_HTML } from './views/control-panel.view';

@Controller()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  @Redirect('/login', 302)
  redirectToLogin() {
    return { url: '/login' };
  }

  @Get('login')
  @ApiExcludeEndpoint()
  getLoginPage(@Res() res: Response) {
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
