import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
export declare class FrontendController {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    private setNoCacheHeaders;
    private clearAllCookies;
    private isValidToken;
    root(req: Request, res: Response): void;
    getLoginPage(req: Request, res: Response): void;
    getDashboardPage(req: Request, res: Response): void;
    getControlPanelPage(req: Request, res: Response): void;
    resetSessionGet(res: Response): void;
    resetSessionPost(res: Response): Response<any, Record<string, any>>;
    clearSession(res: Response): void;
    getManagerRedirect(req: Request, res: Response): void;
    getOpsRedirect(req: Request, res: Response): void;
}
