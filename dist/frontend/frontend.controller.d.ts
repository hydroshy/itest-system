import { Request, Response } from 'express';
export declare class FrontendController {
    private setNoCacheHeaders;
    private clearAllCookies;
    root(req: Request, res: Response): any;
    getLoginPage(req: Request, res: Response): void;
    getDashboardPage(req: Request, res: Response): any;
    getControlPanelPage(req: Request, res: Response): any;
    resetSessionGet(res: Response): any;
    resetSessionPost(res: Response): any;
    clearSession(res: Response): any;
    getManagerRedirect(req: Request, res: Response): any;
    getOpsRedirect(req: Request, res: Response): any;
}
