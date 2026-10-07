export interface GitVersionInfo {
    commitHash: string;
    shortHash: string;
    branch: string;
    commitMessage: string;
    author: string;
    commitDate: string;
    tag?: string;
    source: string;
}
export interface SystemVersionResponse {
    success: boolean;
    version: string;
    git: GitVersionInfo;
    opsAgent: {
        online: boolean;
        url: string;
        containerStatus?: string;
        dockerAvailable?: boolean;
        error?: string;
    };
    server: {
        uptimeSeconds: number;
        nodeVersion: string;
        platform: string;
        environment: string;
    };
    timestamp: string;
}
export declare class SystemOpsService {
    private readonly logger;
    private activeOpsAgentUrl;
    private readonly jwtSecret;
    private readonly repoDirs;
    private getSuperAdminAuthToken;
    private get candidateOpsUrls();
    getSystemVersion(): Promise<SystemVersionResponse>;
    restartServer(): Promise<{
        success: boolean;
        message: string;
        details?: any;
    }>;
    getContainerLogs(tail?: number): Promise<{
        success: boolean;
        logs: string;
    }>;
    private getLocalGitMetadata;
    private queryOpsAgent;
    private executeHttpRequest;
}
