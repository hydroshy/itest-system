const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = parseInt(process.env.PORT || '3099', 10);
const DEFAULT_TARGET_CONTAINER = process.env.TARGET_CONTAINER_NAME || 'nestjs_api';
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const OPS_SECRET_TOKEN = process.env.OPS_SECRET_TOKEN || 'daviteq_ops_secret_token_2026';

const CANDIDATE_REPO_DIRS = [
  process.env.REPO_DIR,
  '/app/dvt',
  '/app/repo',
  path.resolve(__dirname, '../../'),
  process.cwd()
].filter(Boolean);

console.log(`[Daviteq Ops Agent] Initializing service...`);
console.log(`[Daviteq Ops Agent] Default target container: ${DEFAULT_TARGET_CONTAINER}`);
console.log(`[Daviteq Ops Agent] Docker socket path: ${DOCKER_SOCKET}`);
console.log(`[Daviteq Ops Agent] Candidate repo directories: ${CANDIDATE_REPO_DIRS.join(', ')}`);

/**
 * Extract Git metadata safely from repo candidate directories or environment
 */
function getGitMetadata() {
  let gitInfo = {
    commitHash: process.env.GIT_COMMIT_HASH || 'unknown',
    shortHash: process.env.GIT_COMMIT_SHORT || 'unknown',
    branch: process.env.GIT_BRANCH || 'main',
    commitMessage: process.env.GIT_COMMIT_MSG || 'Production build',
    author: process.env.GIT_COMMIT_AUTHOR || 'Daviteq Core Team',
    commitDate: process.env.GIT_COMMIT_DATE || new Date().toISOString(),
    tag: process.env.GIT_TAG || 'v1.0.0',
    source: 'env',
  };

  for (const dir of CANDIDATE_REPO_DIRS) {
    try {
      if (fs.existsSync(path.join(dir, '.git'))) {
        const logOutput = execSync('git log -1 --format="%H|%h|%s|%an|%ad|%D"', {
          cwd: dir,
          encoding: 'utf8',
          timeout: 2000,
        }).trim();

        const branchOutput = execSync('git rev-parse --abbrev-ref HEAD', {
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
    } catch (err) {
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
          } else {
            gitInfo.commitHash = headContent;
            gitInfo.shortHash = headContent.substring(0, 7);
            gitInfo.source = 'git-head-detached';
            return gitInfo;
          }
        }
      } catch (fallbackErr) {}
    }
  }

  return gitInfo;
}

/**
 * Call Docker Engine Unix Socket
 */
function callDockerSocket(apiPath, method = 'GET', postData = null) {
  return new Promise((resolve) => {
    if (!fs.existsSync(DOCKER_SOCKET)) {
      return resolve({
        available: false,
        error: `Docker socket '${DOCKER_SOCKET}' is not mounted or accessible in this environment.`,
      });
    }

    const options = {
      socketPath: DOCKER_SOCKET,
      path: apiPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          if (data && (res.headers['content-type'] || '').includes('application/json')) {
            resolve({ statusCode: res.statusCode, available: true, data: JSON.parse(data) });
          } else {
            resolve({ statusCode: res.statusCode, available: true, raw: data });
          }
        } catch (e) {
          resolve({ statusCode: res.statusCode, available: true, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        available: false,
        error: `Docker API Socket Error: ${err.message}`,
      });
    });

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }

    req.end();
  });
}

/**
 * Automatically resolve target container name from Docker or fallback
 */
async function resolveTargetContainer(requestedName) {
  if (requestedName) return requestedName;

  // Try checking direct default
  if (DEFAULT_TARGET_CONTAINER) {
    const check = await callDockerSocket(`/v1.41/containers/${DEFAULT_TARGET_CONTAINER}/json`);
    if (check.available && check.statusCode === 200) {
      return DEFAULT_TARGET_CONTAINER;
    }
  }

  // Fallback candidate search
  try {
    const listRes = await callDockerSocket('/v1.41/containers/json?all=1');
    if (listRes.available && Array.isArray(listRes.data)) {
      const match = listRes.data.find((c) => {
        const names = c.Names || [];
        return names.some((n) =>
          n.includes('nestjs') ||
          n.includes('nest_lorawan') ||
          n.includes('dvt') ||
          n.includes('backend')
        );
      });
      if (match && match.Names && match.Names[0]) {
        return match.Names[0].replace(/^\//, '');
      }
    }
  } catch (e) {}

  return DEFAULT_TARGET_CONTAINER || 'nestjs_api';
}

/**
 * Verify authentication token
 */
function isAuthorized(req) {
  const tokenHeader = req.headers['x-ops-token'] || req.headers['authorization'];
  if (!tokenHeader) return false;
  const token = tokenHeader.replace(/^Bearer\s+/i, '').trim();
  return token === OPS_SECRET_TOKEN;
}

/**
 * Send JSON response with CORS headers
 */
function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ops-Token',
  });
  res.end(JSON.stringify(body, null, 2));
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ops-Token',
    });
    return res.end();
  }

  // 1. Health check
  if (pathname === '/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'daviteq-ops-agent',
      uptime: Math.round(process.uptime()),
      defaultTarget: DEFAULT_TARGET_CONTAINER,
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Status & Version Information
  if (pathname === '/api/status' && req.method === 'GET') {
    const gitInfo = getGitMetadata();
    const target = await resolveTargetContainer(url.searchParams.get('container'));
    const dockerStatus = await callDockerSocket(`/v1.41/containers/${target}/json`);

    let containerInfo = {
      name: target,
      status: dockerStatus.available ? (dockerStatus.data?.State?.Status || 'running') : 'unknown_socket_unmounted',
      state: dockerStatus.data?.State || null,
      created: dockerStatus.data?.Created || null,
      dockerAvailable: dockerStatus.available,
      error: dockerStatus.error || null,
    };

    return sendJson(res, 200, {
      success: true,
      service: 'daviteq-ops-agent',
      targetContainer: target,
      git: gitInfo,
      container: containerInfo,
      system: {
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Restart Target Container
  if (pathname === '/api/restart-backend' && req.method === 'POST') {
    if (!isAuthorized(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized. Invalid or missing X-Ops-Token header.' });
    }

    let bodyData = {};
    try {
      let bodyText = '';
      for await (const chunk of req) {
        bodyText += chunk;
      }
      if (bodyText) bodyData = JSON.parse(bodyText);
    } catch (e) {}

    const target = await resolveTargetContainer(bodyData.container || url.searchParams.get('container'));
    console.log(`[Daviteq Ops Agent] 🔄 Received restart request for container '${target}'...`);

    const restartResult = await callDockerSocket(`/v1.41/containers/${target}/restart?t=5`, 'POST');

    if (!restartResult.available) {
      return sendJson(res, 200, {
        success: false,
        dockerAvailable: false,
        error: restartResult.error,
        message: `Restart requested, but Docker socket is not mounted at ${DOCKER_SOCKET}. Mount /var/run/docker.sock to enable actual Docker restarts.`,
      });
    }

    if (restartResult.statusCode === 204 || restartResult.statusCode === 200) {
      console.log(`[Daviteq Ops Agent] Container '${target}' restart signal executed successfully.`);
      return sendJson(res, 200, {
        success: true,
        message: `Container '${target}' restarted successfully via Docker Engine API.`,
        container: target,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error(`[Daviteq Ops Agent] ❌ Container restart failed:`, restartResult);
      return sendJson(res, 500, {
        success: false,
        error: `Docker Engine returned HTTP ${restartResult.statusCode}: ${JSON.stringify(restartResult.data || restartResult.raw || restartResult.error)}`,
      });
    }
  }

  // 4. Container Logs
  if (pathname === '/api/logs' && req.method === 'GET') {
    if (!isAuthorized(req)) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized. Invalid or missing X-Ops-Token header.' });
    }

    const target = await resolveTargetContainer(url.searchParams.get('container'));
    const tail = parseInt(url.searchParams.get('tail') || '50', 10);
    const logsResult = await callDockerSocket(`/v1.41/containers/${target}/logs?stdout=1&stderr=1&tail=${tail}&timestamps=1`);

    return sendJson(res, 200, {
      success: true,
      container: target,
      logs: logsResult.raw || logsResult.data || logsResult.error || 'No logs available',
      dockerAvailable: logsResult.available,
    });
  }

  // 404 fallback
  return sendJson(res, 404, { error: 'Not found', availableEndpoints: ['/health', '/api/status', '/api/restart-backend', '/api/logs'] });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Daviteq Ops Agent] Server listening on http://0.0.0.0:${PORT}`);
});
