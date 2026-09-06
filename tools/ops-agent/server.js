const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const PORT = parseInt(process.env.PORT || '3099', 10);
const DEFAULT_TARGET_CONTAINER = process.env.TARGET_CONTAINER_NAME || 'nestjs_api';
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_lorawan_key_2025';

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

// ==================== DATABASE CONFIGURATION & CONNECTION ====================

function loadDbRoutingConfig() {
  for (const repo of CANDIDATE_REPO_DIRS) {
    const configPath = path.join(repo, 'config', 'db-routing.config.json');
    try {
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {}
  }
  return {};
}

const dbRoutingConfig = loadDbRoutingConfig();
const coreDbConfig = dbRoutingConfig.connections?.core_db || {};

const DB_PORT = parseInt(process.env.DB_PORT || coreDbConfig.port || '5432', 10);
const DB_USER = process.env.DB_USERNAME || process.env.DB_USER || coreDbConfig.username || 'admin';
const DB_PASS = process.env.DB_PASSWORD || process.env.DB_PASS || coreDbConfig.password || 'mason';
const DB_NAME = process.env.DB_DATABASE || process.env.DB_NAME || coreDbConfig.database || 'dvt';

const CANDIDATE_DB_HOSTS = [
  process.env.DB_HOST,
  coreDbConfig.host,
  'mas.local',
  'postgres_db',
  'postgres',
  'host.docker.internal',
  'localhost',
  '127.0.0.1'
].filter(Boolean);

let activeDbPool = null;
let activeDbHost = '';

async function getDbPool() {
  if (activeDbPool) return activeDbPool;

  const hostsToTry = [...new Set(CANDIDATE_DB_HOSTS)];
  for (const host of hostsToTry) {
    const pool = new Pool({
      host,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      connectionTimeoutMillis: 2000,
      max: 5
    });

    try {
      const client = await pool.connect();
      client.release();
      activeDbPool = pool;
      activeDbHost = host;
      console.log(`[Daviteq Ops Agent] ✅ PostgreSQL DB connected successfully on host: ${host}:${DB_PORT}/${DB_NAME}`);
      return activeDbPool;
    } catch (err) {
      // Host unreachable, try next candidate
      pool.end().catch(() => {});
    }
  }

  // Fallback default pool if all candidates failed initially
  const defaultHost = process.env.DB_HOST || coreDbConfig.host || 'mas.local';
  activeDbPool = new Pool({
    host: defaultHost,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    connectionTimeoutMillis: 3000,
    max: 5
  });
  activeDbHost = defaultHost;
  return activeDbPool;
}

// ==================== JWT & AUTHENTICATION UTILS ====================

function createSessionToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    userId: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName || user.username,
    userType: user.userType,
    roles: user.roles || ['SUPER_ADMIN'],
    iss: 'daviteq-ops-agent',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

function verifySessionToken(tokenString) {
  if (!tokenString || typeof tokenString !== 'string') return null;
  const token = tokenString.replace(/^Bearer\s+/i, '').trim();

  // Validate JWT signature and payload
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    // Verify Super-Admin authorization
    const isSuperAdmin = (
      payload.userType === 'ADMIN' ||
      payload.username === 'admin' ||
      (Array.isArray(payload.roles) && payload.roles.some((r) => {
        const code = (typeof r === 'string' ? r : (r.code || r.name || '')).toUpperCase();
        return code === 'SUPER_ADMIN' || code === 'SUPER ADMINISTRATOR' || code === 'ADMIN';
      }))
    );

    if (!isSuperAdmin) return null;

    return payload;
  } catch (e) {
    return null;
  }
}

function extractTokenFromRequest(req) {
  // 1. Check Authorization Bearer header (explicitly sent by Ops UI or NestJS backend service)
  const authHeader = req.headers['authorization'];
  if (authHeader) return authHeader.replace(/^Bearer\s+/i, '').trim();

  // 2. Check X-Ops-Token header
  const opsToken = req.headers['x-ops-token'];
  if (opsToken) return opsToken.trim();

  return null;
}

function isAuthorized(req) {
  const token = extractTokenFromRequest(req);
  if (!token) return null;
  return verifySessionToken(token);
}

// ==================== GIT METADATA EXTRACTOR ====================

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

// ==================== DOCKER ENGINE API ====================

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

async function resolveTargetContainer(requestedName) {
  if (requestedName) return requestedName;

  if (DEFAULT_TARGET_CONTAINER) {
    const check = await callDockerSocket(`/v1.41/containers/${DEFAULT_TARGET_CONTAINER}/json`);
    if (check.available && check.statusCode === 200) {
      return DEFAULT_TARGET_CONTAINER;
    }
  }

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

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Ops-Token',
  });
  res.end(JSON.stringify(body, null, 2));
}

const { MANAGER_HTML } = require('./ui.js');

// ==================== HTTP SERVER & ROUTER ====================

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

  // 0. Standalone Web UI (Manager Dashboard)
  if ((pathname === '/' || pathname === '/manager' || pathname === '/ops') && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    return res.end(MANAGER_HTML);
  }

  // 1. Health check
  if (pathname === '/health' && req.method === 'GET') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'daviteq-ops-agent',
      uptime: Math.round(process.uptime()),
      defaultTarget: DEFAULT_TARGET_CONTAINER,
      dbHost: activeDbHost || 'mas.local',
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Authentication: Super Admin Database Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let bodyData = {};
    try {
      let bodyText = '';
      for await (const chunk of req) bodyText += chunk;
      if (bodyText) bodyData = JSON.parse(bodyText);
    } catch (e) {}

    const { username, password } = bodyData;
    if (!username || !password) {
      return sendJson(res, 400, { success: false, error: 'Username and password are required.' });
    }

    try {
      const pool = await getDbPool();
      const queryResult = await pool.query(
        `SELECT u."id", u."username", u."email", u."passwordHash", u."fullName", u."userType", u."isActive",
                COALESCE(array_agg(r."code") FILTER (WHERE r."code" IS NOT NULL), '{}') as roles
         FROM "users" u
         LEFT JOIN "user_role" ur ON ur."user_id" = u."id"
         LEFT JOIN "roles" r ON r."id" = ur."role_id"
         WHERE (LOWER(u."username") = LOWER($1) OR LOWER(u."email") = LOWER($1))
         GROUP BY u."id"
         LIMIT 1;`,
        [username.trim()]
      );

      const user = queryResult.rows[0];
      if (!user) {
        return sendJson(res, 401, { success: false, error: 'Invalid username or password.' });
      }

      if (user.isActive === false) {
        return sendJson(res, 403, { success: false, error: 'Account has been deactivated.' });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isPasswordValid) {
        return sendJson(res, 401, { success: false, error: 'Invalid username or password.' });
      }

      // Check Super-Admin authorization
      const isSuperAdmin = (
        user.userType === 'ADMIN' ||
        user.username === 'admin' ||
        (Array.isArray(user.roles) && user.roles.some((r) => {
          const code = String(r).toUpperCase();
          return code === 'SUPER_ADMIN' || code === 'SUPER ADMINISTRATOR' || code === 'ADMIN';
        }))
      );

      if (!isSuperAdmin) {
        return sendJson(res, 403, {
          success: false,
          error: 'Access denied: Only Super Administrator accounts (SUPER_ADMIN) are permitted to access Ops Manager.',
        });
      }

      const sessionToken = createSessionToken(user);
      console.log(`[Daviteq Ops Agent] 🔑 Super-Admin logged in successfully: ${user.username} (${user.fullName})`);

      return sendJson(res, 200, {
        success: true,
        token: sessionToken,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName || user.username,
          email: user.email,
          userType: user.userType,
          roles: user.roles,
        },
      });
    } catch (err) {
      console.error('[Daviteq Ops Agent] Database authentication error:', err);
      return sendJson(res, 500, {
        success: false,
        error: `Database authentication failure: ${err.message}`,
      });
    }
  }

  // 3. Authentication: Verify Current Session (Me)
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const authUser = isAuthorized(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized or session expired.' });
    }
    return sendJson(res, 200, {
      success: true,
      user: authUser,
      dbHost: activeDbHost || 'PostgreSQL',
    });
  }

  // 4. Status & Version Information
  if (pathname === '/api/status' && req.method === 'GET') {
    const authUser = isAuthorized(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized. Super-Admin login required.' });
    }

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
      dbHost: activeDbHost,
      system: {
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // 5. Restart Target Container
  if (pathname === '/api/restart-backend' && req.method === 'POST') {
    const authUser = isAuthorized(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized. Super-Admin login required.' });
    }

    let bodyData = {};
    try {
      let bodyText = '';
      for await (const chunk of req) bodyText += chunk;
      if (bodyText) bodyData = JSON.parse(bodyText);
    } catch (e) {}

    const target = await resolveTargetContainer(bodyData.container || url.searchParams.get('container'));
    console.log(`[Daviteq Ops Agent] 🔄 [by ${authUser.username}] Received restart request for container '${target}'...`);

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

  // 6. Container Action (start | stop | restart)
  if (pathname === '/api/container-action' && req.method === 'POST') {
    const authUser = isAuthorized(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized. Super-Admin login required.' });
    }

    let bodyData = {};
    try {
      let bodyText = '';
      for await (const chunk of req) bodyText += chunk;
      if (bodyText) bodyData = JSON.parse(bodyText);
    } catch (e) {}

    const action = (bodyData.action || 'restart').toLowerCase();
    const target = await resolveTargetContainer(bodyData.container || url.searchParams.get('container'));

    if (!['start', 'stop', 'restart'].includes(action)) {
      return sendJson(res, 400, { success: false, error: "Invalid action. Supported actions: 'start', 'stop', 'restart'." });
    }

    console.log(`[Daviteq Ops Agent] ⚡ [by ${authUser.username}] Executing '${action}' on container '${target}'...`);
    const actionResult = await callDockerSocket(`/v1.41/containers/${target}/${action}`, 'POST');

    if (!actionResult.available) {
      return sendJson(res, 200, {
        success: false,
        dockerAvailable: false,
        error: actionResult.error,
        message: `Docker socket is not mounted at ${DOCKER_SOCKET}.`,
      });
    }

    if (actionResult.statusCode === 204 || actionResult.statusCode === 200 || actionResult.statusCode === 304) {
      return sendJson(res, 200, {
        success: true,
        message: `Container '${target}' executed action '${action}' successfully.`,
        container: target,
        action: action,
        timestamp: new Date().toISOString(),
      });
    } else {
      return sendJson(res, 500, {
        success: false,
        error: `Docker Engine returned HTTP ${actionResult.statusCode}: ${JSON.stringify(actionResult.data || actionResult.raw || actionResult.error)}`,
      });
    }
  }

  // 7. Container Logs
  if (pathname === '/api/logs' && req.method === 'GET') {
    const authUser = isAuthorized(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized. Super-Admin login required.' });
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

  // 8. List all containers
  if (pathname === '/api/containers' && req.method === 'GET') {
    const authUser = isAuthorized(req);
    if (!authUser) {
      return sendJson(res, 401, { success: false, error: 'Unauthorized. Super-Admin login required.' });
    }

    const listRes = await callDockerSocket('/v1.41/containers/json?all=1');
    return sendJson(res, 200, {
      success: listRes.available,
      containers: listRes.data || [],
      error: listRes.error || null,
    });
  }

  // 404 fallback
  return sendJson(res, 404, { error: 'Not found', availableEndpoints: ['/', '/manager', '/health', '/api/auth/login', '/api/auth/me', '/api/status', '/api/restart-backend', '/api/container-action', '/api/logs', '/api/containers'] });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Daviteq Ops Agent] Server listening on http://0.0.0.0:${PORT}`);
  getDbPool().catch(() => {});
});
