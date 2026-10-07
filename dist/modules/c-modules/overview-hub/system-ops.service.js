"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SystemOpsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemOpsService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const child_process_1 = require("child_process");
const http = require("http");
let SystemOpsService = SystemOpsService_1 = class SystemOpsService {
    constructor() {
        this.logger = new common_1.Logger(SystemOpsService_1.name);
        this.activeOpsAgentUrl = null;
        this.jwtSecret = process.env.JWT_SECRET || 'super_secret_lorawan_key_2025';
        this.repoDirs = [
            path.resolve(__dirname, '../../../../'),
            '/app/dvt',
            '/app/repo',
            process.cwd(),
        ];
    }
    getSuperAdminAuthToken() {
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({
            sub: 'nest_system',
            username: 'admin',
            userType: 'ADMIN',
            roles: ['SUPER_ADMIN'],
            iss: 'daviteq-backend',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
        })).toString('base64url');
        const signature = crypto.createHmac('sha256', this.jwtSecret).update(`${header}.${payload}`).digest('base64url');
        return `${header}.${payload}.${signature}`;
    }
    get candidateOpsUrls() {
        const urls = [];
        if (process.env.OPS_AGENT_URL) {
            urls.push(process.env.OPS_AGENT_URL);
        }
        if (this.activeOpsAgentUrl) {
            urls.push(this.activeOpsAgentUrl);
        }
        urls.push('http://ops_agent:3099');
        urls.push('http://daviteq_ops_agent:3099');
        urls.push('http://localhost:3099');
        urls.push('http://127.0.0.1:3099');
        urls.push('http://host.docker.internal:3099');
        return [...new Set(urls)];
    }
    async getSystemVersion() {
        const localGit = this.getLocalGitMetadata();
        const opsStatus = await this.queryOpsAgent('/api/status');
        const currentUrl = this.activeOpsAgentUrl || process.env.OPS_AGENT_URL || 'http://ops_agent:3099';
        if (opsStatus && opsStatus.success) {
            return {
                success: true,
                version: '1.0.0',
                git: opsStatus.git || localGit,
                opsAgent: {
                    online: true,
                    url: currentUrl,
                    containerStatus: opsStatus.container?.status || 'running',
                    dockerAvailable: opsStatus.container?.dockerAvailable ?? false,
                    error: opsStatus.container?.error || undefined,
                },
                server: {
                    uptimeSeconds: Math.round(process.uptime()),
                    nodeVersion: process.version,
                    platform: process.platform,
                    environment: process.env.NODE_ENV || 'production',
                },
                timestamp: new Date().toISOString(),
            };
        }
        return {
            success: true,
            version: '1.0.0',
            git: localGit,
            opsAgent: {
                online: false,
                url: currentUrl,
                error: 'Ops Agent microservice is not reachable on configured port.',
            },
            server: {
                uptimeSeconds: Math.round(process.uptime()),
                nodeVersion: process.version,
                platform: process.platform,
                environment: process.env.NODE_ENV || 'production',
            },
            timestamp: new Date().toISOString(),
        };
    }
    async restartServer() {
        const currentUrl = this.activeOpsAgentUrl || process.env.OPS_AGENT_URL || 'http://ops_agent:3099';
        this.logger.warn(`🔄 Triggering NestJS server container restart via Ops Agent at ${currentUrl}...`);
        const result = await this.queryOpsAgent('/api/restart-backend', 'POST');
        if (!result) {
            return {
                success: false,
                message: `Could not connect to Ops Agent at ${currentUrl}. Ensure the daviteq-ops-agent container is running with /var/run/docker.sock mounted.`,
            };
        }
        return result;
    }
    async getContainerLogs(tail = 50) {
        const currentUrl = this.activeOpsAgentUrl || process.env.OPS_AGENT_URL || 'http://ops_agent:3099';
        const result = await this.queryOpsAgent(`/api/logs?tail=${tail}`, 'GET');
        if (!result) {
            return {
                success: false,
                logs: `Ops Agent at ${currentUrl} is offline.`,
            };
        }
        return result;
    }
    getLocalGitMetadata() {
        let gitInfo = {
            commitHash: process.env.GIT_COMMIT_HASH || 'unknown',
            shortHash: process.env.GIT_COMMIT_SHORT || 'unknown',
            branch: process.env.GIT_BRANCH || 'main',
            commitMessage: process.env.GIT_COMMIT_MSG || 'Production Build',
            author: process.env.GIT_COMMIT_AUTHOR || 'Daviteq Core Team',
            commitDate: process.env.GIT_COMMIT_DATE || new Date().toISOString(),
            tag: process.env.GIT_TAG || 'v1.0.0',
            source: 'env',
        };
        for (const dir of this.repoDirs) {
            try {
                if (fs.existsSync(path.join(dir, '.git'))) {
                    const logOutput = (0, child_process_1.execSync)('git log -1 --format="%H|%h|%s|%an|%ad|%D"', {
                        cwd: dir,
                        encoding: 'utf8',
                        timeout: 2000,
                    }).trim();
                    const branchOutput = (0, child_process_1.execSync)('git rev-parse --abbrev-ref HEAD', {
                        cwd: dir,
                        encoding: 'utf8',
                        timeout: 2000,
                    }).trim();
                    if (logOutput) {
                        const parts = logOutput.split('|');
                        gitInfo = {
                            commitHash: parts[0] || 'unknown',
                            shortHash: parts[1] || (parts[0] ? parts[0].substring(0, 7) : 'unknown'),
                            commitMessage: parts[2] || '',
                            author: parts[3] || 'Daviteq Team',
                            commitDate: parts[4] || new Date().toISOString(),
                            branch: branchOutput || 'main',
                            tag: parts[5] || '',
                            source: 'git-repo',
                        };
                        return gitInfo;
                    }
                }
            }
            catch (err) {
                try {
                    const headFile = path.join(dir, '.git', 'HEAD');
                    if (fs.existsSync(headFile)) {
                        const headContent = fs.readFileSync(headFile, 'utf8').trim();
                        if (headContent.startsWith('ref: ')) {
                            const refPath = headContent.replace('ref: ', '').trim();
                            gitInfo.branch = refPath.replace('refs/heads/', '');
                            const refFile = path.join(dir, '.git', refPath);
                            if (fs.existsSync(refFile)) {
                                const hash = fs.readFileSync(refFile, 'utf8').trim();
                                gitInfo.commitHash = hash;
                                gitInfo.shortHash = hash.substring(0, 7);
                                gitInfo.source = 'git-files';
                                return gitInfo;
                            }
                        }
                        else {
                            gitInfo.commitHash = headContent;
                            gitInfo.shortHash = headContent.substring(0, 7);
                            gitInfo.source = 'git-head-detached';
                            return gitInfo;
                        }
                    }
                }
                catch (fErr) { }
            }
        }
        return gitInfo;
    }
    async queryOpsAgent(apiPath, method = 'GET', postData = null) {
        const candidates = this.candidateOpsUrls;
        for (const baseUrl of candidates) {
            const res = await this.executeHttpRequest(baseUrl, apiPath, method, postData);
            if (res !== null) {
                this.activeOpsAgentUrl = baseUrl;
                return res;
            }
        }
        return null;
    }
    executeHttpRequest(baseUrl, apiPath, method, postData) {
        return new Promise((resolve) => {
            try {
                const target = new URL(apiPath, baseUrl);
                const options = {
                    hostname: target.hostname,
                    port: target.port || 3099,
                    path: target.pathname + target.search,
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getSuperAdminAuthToken()}`,
                    },
                    timeout: 2500,
                };
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (c) => (data += c));
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data));
                        }
                        catch (e) {
                            resolve({ statusCode: res.statusCode, raw: data });
                        }
                    });
                });
                req.on('error', () => {
                    resolve(null);
                });
                req.on('timeout', () => {
                    req.destroy();
                    resolve(null);
                });
                if (postData) {
                    req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
                }
                req.end();
            }
            catch (err) {
                resolve(null);
            }
        });
    }
};
exports.SystemOpsService = SystemOpsService;
exports.SystemOpsService = SystemOpsService = SystemOpsService_1 = __decorate([
    (0, common_1.Injectable)()
], SystemOpsService);
//# sourceMappingURL=system-ops.service.js.map