import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as http from 'http';

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

@Injectable()
export class SystemOpsService {
  private readonly logger = new Logger(SystemOpsService.name);
  private readonly opsAgentUrl = process.env.OPS_AGENT_URL || 'http://localhost:3099';
  private readonly opsSecretToken = process.env.OPS_SECRET_TOKEN || 'daviteq_ops_secret_token_2026';
  private readonly repoDir = path.resolve(__dirname, '../../../../');

  /**
   * Get version & git metadata from Ops Agent or local repository fallback
   */
  async getSystemVersion(): Promise<SystemVersionResponse> {
    const localGit = this.getLocalGitMetadata();
    const opsStatus = await this.queryOpsAgent('/api/status');

    if (opsStatus && opsStatus.success) {
      return {
        success: true,
        version: '1.0.0',
        git: opsStatus.git || localGit,
        opsAgent: {
          online: true,
          url: this.opsAgentUrl,
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
        url: this.opsAgentUrl,
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

  /**
   * Request Ops Agent to restart the NestJS server container
   */
  async restartServer(): Promise<{ success: boolean; message: string; details?: any }> {
    this.logger.warn(`🔄 Triggering NestJS server container restart via Ops Agent at ${this.opsAgentUrl}...`);

    const result = await this.queryOpsAgent('/api/restart-backend', 'POST');
    if (!result) {
      return {
        success: false,
        message: `Could not connect to Ops Agent at ${this.opsAgentUrl}. Ensure the daviteq-ops-agent container is running with /var/run/docker.sock mounted.`,
      };
    }

    return result;
  }

  /**
   * Fetch recent container logs from Ops Agent
   */
  async getContainerLogs(tail: number = 50): Promise<{ success: boolean; logs: string }> {
    const result = await this.queryOpsAgent(`/api/logs?tail=${tail}`, 'GET');
    if (!result) {
      return {
        success: false,
        logs: `Ops Agent at ${this.opsAgentUrl} is offline.`,
      };
    }
    return result;
  }

  /**
   * Extract Git metadata directly from local repository
   */
  private getLocalGitMetadata(): GitVersionInfo {
    let gitInfo: GitVersionInfo = {
      commitHash: process.env.GIT_COMMIT_HASH || 'unknown',
      shortHash: process.env.GIT_COMMIT_SHORT || 'unknown',
      branch: process.env.GIT_BRANCH || 'main',
      commitMessage: process.env.GIT_COMMIT_MSG || 'Production Build',
      author: process.env.GIT_COMMIT_AUTHOR || 'Daviteq Core Team',
      commitDate: process.env.GIT_COMMIT_DATE || new Date().toISOString(),
      tag: process.env.GIT_TAG || 'v1.0.0',
      source: 'env',
    };

    try {
      if (fs.existsSync(path.join(this.repoDir, '.git'))) {
        const logOutput = execSync('git log -1 --format="%H|%h|%s|%an|%ad|%D"', {
          cwd: this.repoDir,
          encoding: 'utf8',
          timeout: 2000,
        }).trim();

        const branchOutput = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: this.repoDir,
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
        }
      }
    } catch (err: any) {
      // Direct file reading fallback
      try {
        const headFile = path.join(this.repoDir, '.git', 'HEAD');
        if (fs.existsSync(headFile)) {
          const headContent = fs.readFileSync(headFile, 'utf8').trim();
          if (headContent.startsWith('ref: ')) {
            const refPath = headContent.replace('ref: ', '').trim();
            gitInfo.branch = refPath.replace('refs/heads/', '');
            const refFile = path.join(this.repoDir, '.git', refPath);
            if (fs.existsSync(refFile)) {
              const hash = fs.readFileSync(refFile, 'utf8').trim();
              gitInfo.commitHash = hash;
              gitInfo.shortHash = hash.substring(0, 7);
              gitInfo.source = 'git-files';
            }
          } else {
            gitInfo.commitHash = headContent;
            gitInfo.shortHash = headContent.substring(0, 7);
            gitInfo.source = 'git-head-detached';
          }
        }
      } catch (fErr) {}
    }

    return gitInfo;
  }

  /**
   * Helper to query Ops Agent via HTTP
   */
  private queryOpsAgent(apiPath: string, method: string = 'GET', postData: any = null): Promise<any> {
    return new Promise((resolve) => {
      try {
        const target = new URL(apiPath, this.opsAgentUrl);
        const options: http.RequestOptions = {
          hostname: target.hostname,
          port: target.port || 3099,
          path: target.pathname + target.search,
          method,
          headers: {
            'Content-Type': 'application/json',
            'X-Ops-Token': this.opsSecretToken,
          },
          timeout: 4000,
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ statusCode: res.statusCode, raw: data });
            }
          });
        });

        req.on('error', (err) => {
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
      } catch (err) {
        resolve(null);
      }
    });
  }
}
