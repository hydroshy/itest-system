import { Request, Response } from 'express';
export declare class FrontendController {
    private setNoCacheHeaders;
    private clearAllCookies;
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
