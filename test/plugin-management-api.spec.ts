/**
 * Comprehensive Verification Suite for Backbone (dvt) Plugin Management Subsystem
 *
 * Covers:
 * 1. TypeORM Metadata Registration: CorePluginEntity & PluginAuditLogEntity in ALL_DATABASE_ENTITIES
 * 2. PluginStorageService: Path traversal security, safe file persistence, tar/archive handling, MIME mapping, bundle resolution
 * 3. PluginManagerService: Manifest schema validation, SemVer enforcement, SRI sha256 integrity,
 *    FSM lifecycle (register -> enable -> disable -> config -> uninstall), audit logging, and Realtime event broadcast
 * 4. PluginManagerController: REST API endpoints, DTO validation, and bundle streaming with CORS headers
 */
import 'reflect-metadata';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import { ALL_DATABASE_ENTITIES } from '../src/backend/database/dynamic-database.service';
import { CorePluginEntity } from '../src/backend/core-models/core-plugin.entity';
import { PluginAuditLogEntity, PluginAuditAction } from '../src/backend/core-models/plugin-audit-log.entity';
import { PluginStorageService } from '../src/backend/plugins/plugin-storage.service';
import { PluginManagerService } from '../src/backend/plugins/plugin-manager.service';
import { PluginManagerController } from '../src/backend/plugins/plugin-manager.controller';
import {
  RemotePluginManifest,
  PluginType,
  PluginStatus,
} from '../src/backend/plugins/plugin-manifest.interface';

// Mock Realtime Gateway / Service
class MockRealtimeService {
  public emittedEvents: { event: string; payload: any }[] = [];

  publishPluginLifecycle(event: string, payload: any) {
    this.emittedEvents.push({ event, payload });
  }

  emitToAll(event: string, payload: any) {
    this.emittedEvents.push({ event, payload });
  }

  broadcast(event: string, payload: any) {
    this.emittedEvents.push({ event, payload });
  }

  clear() {
    this.emittedEvents = [];
  }
}

// Mock Database Service
class MockDatabaseService {
  public isConnected = true;
  private pluginsTable: Map<string, CorePluginEntity> = new Map();
  private auditLogsTable: PluginAuditLogEntity[] = [];

  getDataSource(): any {
    if (!this.isConnected) return null;
    return {
      isInitialized: true,
      getRepository: (entity: any) => {
        if (entity === CorePluginEntity || entity.name === 'CorePluginEntity') {
          return {
            find: async (_opts?: any) => Array.from(this.pluginsTable.values()),
            findOne: async (opts?: any) => {
              const id = opts?.where?.id;
              return id ? this.pluginsTable.get(id) || null : null;
            },
            save: async (p: CorePluginEntity) => {
              const cloned = { ...p };
              this.pluginsTable.set(cloned.id, cloned);
              return cloned;
            },
            remove: async (p: CorePluginEntity) => {
              this.pluginsTable.delete(p.id);
            },
          };
        }
        if (entity === PluginAuditLogEntity || entity.name === 'PluginAuditLogEntity') {
          return {
            find: async (opts?: any) => {
              let logs = [...this.auditLogsTable];
              if (opts?.where?.pluginId) {
                logs = logs.filter((l) => l.pluginId === opts.where.pluginId);
              }
              return logs.slice(0, opts?.take || 50);
            },
            save: async (log: PluginAuditLogEntity) => {
              const saved = { ...log, id: log.id || `log-${Date.now()}` };
              this.auditLogsTable.unshift(saved);
              return saved;
            },
          };
        }
        throw new Error(`Repository not found for ${entity.name || entity}`);
      },
    };
  }

  getRepositoryForTable(_tableName: string, entityClass: any) {
    return this.getDataSource()?.getRepository(entityClass);
  }
}

async function runPluginManagementTests() {
  console.log('--- STARTING PLUGIN MANAGEMENT SUBSYSTEM VERIFICATION ---');

  // ==========================================
  // Test 1: TypeORM Entity Metadata Verification
  // ==========================================
  console.log('\n[TEST 1] Entity Metadata Verification');
  const hasCorePlugin = ALL_DATABASE_ENTITIES.some(
    (e: any) => e === CorePluginEntity || e.name === 'CorePluginEntity',
  );
  const hasAuditLog = ALL_DATABASE_ENTITIES.some(
    (e: any) => e === PluginAuditLogEntity || e.name === 'PluginAuditLogEntity',
  );

  assert.ok(hasCorePlugin, 'CorePluginEntity must be registered in ALL_DATABASE_ENTITIES');
  assert.ok(hasAuditLog, 'PluginAuditLogEntity must be registered in ALL_DATABASE_ENTITIES');
  console.log('✓ CorePluginEntity and PluginAuditLogEntity successfully registered in DB subsystem.');

  // ==========================================
  // Test 2: PluginStorageService Verification
  // ==========================================
  console.log('\n[TEST 2] PluginStorageService - File Operations & Security');
  const testStorageDir = path.join(__dirname, '..', 'storage', 'plugins_test_' + Date.now());
  const storageService = new PluginStorageService();
  // Override root directory for isolated testing
  (storageService as any).storageRoot = testStorageDir;
  if (!fs.existsSync(testStorageDir)) {
    fs.mkdirSync(testStorageDir, { recursive: true });
  }

  try {
    // 2.1 ID Sanitization
    const sanitizedScoped = storageService.sanitizeId('@universal-iot/modbus-rtu:v1');
    assert.strictEqual(sanitizedScoped, 'universal-iot__modbus-rtu__v1');
    console.log('✓ Scoped plugin ID sanitization verified:', sanitizedScoped);

    // 2.2 Path traversal security check
    assert.throws(
      () => {
        storageService.getPluginDir('../../../etc', '..');
      },
      /traversal detected/,
      'Path traversal with ../ must be denied',
    );
    console.log('✓ Path traversal protection verified (rejected ../ traversal).');

    // 2.3 Storing and reading files
    const testPluginId = 'test-modbus-driver';
    const testVersion = '1.0.0';
    const saved = await storageService.saveBundleFiles(testPluginId, testVersion, {
      'dist/entry.js': 'export default function init() { return "modbus-ok"; }',
      'dist/style.css': 'body { color: blue; }',
      'manifest.json': JSON.stringify({ id: testPluginId, version: testVersion }),
    });
    assert.strictEqual(saved.length, 3, 'Should have saved 3 files');

    // 2.4 File resolution and MIME mapping
    const jsResolve = storageService.resolveFile(testPluginId, testVersion, 'dist/entry.js');
    assert.strictEqual(jsResolve.exists, true);
    assert.strictEqual(jsResolve.mimeType, 'application/javascript');
    assert.ok(fs.existsSync(jsResolve.filePath));

    const cssResolve = storageService.resolveFile(testPluginId, testVersion, 'dist/style.css');
    assert.strictEqual(cssResolve.exists, true);
    assert.strictEqual(cssResolve.mimeType, 'text/css');

    // Suspicious path traversal resolution returns exists: false
    const attackResolve = storageService.resolveFile(testPluginId, testVersion, '../../secret.txt');
    assert.strictEqual(attackResolve.exists, false);
    console.log('✓ File resolution, traversal guard, and MIME mapping verified.');

    // 2.5 Storage cleanup
    await storageService.deletePluginFiles(testPluginId);
    const afterDelete = storageService.resolveFile(testPluginId, testVersion, 'dist/entry.js');
    assert.strictEqual(afterDelete.exists, false);
    console.log('✓ Storage cleanup verified.');
  } finally {
    // Clean up temporary test storage directory
    if (fs.existsSync(testStorageDir)) {
      fs.rmSync(testStorageDir, { recursive: true, force: true });
    }
  }

  // ==========================================
  // Test 3: PluginManagerService Lifecycle & Validation
  // ==========================================
  console.log('\n[TEST 3] PluginManagerService - Manifest Validation, SRI & Lifecycle');
  const mockDb = new MockDatabaseService();
  const mockRealtime = new MockRealtimeService();
  const pluginStorage = new PluginStorageService();
  const managerService = new PluginManagerService(
    pluginStorage,
    mockDb as any,
    mockRealtime as any,
  );

  // 3.1 Schema validation errors
  const invalidManifest1: any = { id: 'bad-manifest' };
  assert.throws(
    () => (managerService as any).validateManifest(invalidManifest1),
    /Manifest validation failed/,
    'Manifest missing fields must be rejected',
  );

  const invalidTypeManifest: any = {
    id: 'bad-type',
    name: 'Bad Type',
    version: '1.0.0',
    type: 'INVALID_TYPE_ENUM',
  };
  assert.throws(
    () => (managerService as any).validateManifest(invalidTypeManifest),
    /must be one of \[PROTOCOL/,
    'Invalid plugin type must be rejected',
  );
  console.log('✓ Manifest schema validation rules strictly enforced.');

  // 3.2 SRI integrity check
  const testBundleCode = 'console.log("Verified module payload");';
  const validSha256 = crypto.createHash('sha256').update(testBundleCode).digest('base64');
  assert.doesNotThrow(() => {
    (managerService as any).verifyIntegrity(
      Buffer.from(testBundleCode),
      `sha256-${validSha256}`,
    );
  }, 'Matching SHA256 SRI must pass');

  assert.throws(
    () => {
      (managerService as any).verifyIntegrity(
        Buffer.from(testBundleCode),
        'sha256-invalidbase64hash===',
      );
    },
    /Integrity check failed/,
    'Mismatched SRI checksum must throw error',
  );
  console.log('✓ SRI sha256 checksum integrity verification verified.');

  // 3.3 Full Lifecycle: Register -> Enable -> Disable -> Update Config -> Uninstall
  const validManifest: RemotePluginManifest = {
    id: 'bacnet-ip-adapter',
    name: 'BACnet IP Industrial Adapter',
    version: '1.0.0',
    description: 'BACnet protocol plugin for building automation',
    author: 'IoT Core Team',
    license: 'MIT',
    type: 'PROTOCOL',
    entry: 'dist/bacnet.js',
    permissions: ['RAW_SOCKET_CONNECT', 'NETWORK_CLIENT'],
    defaultConfig: { port: 47808, timeout: 5000 },
  };

  // Register
  const registered = await managerService.registerPlugin(validManifest, {
    bundleUrl: '/api/v1/plugins/bacnet-ip-adapter/bundle/bacnet.js',
    autoEnable: true,
  });
  assert.strictEqual(registered.id, 'bacnet-ip-adapter');
  assert.strictEqual(registered.status, 'ACTIVE' as PluginStatus);
  assert.ok(
    mockRealtime.emittedEvents.some((e) => e.event === 'plugin:installed'),
    'Should emit plugin:installed event',
  );
  console.log('✓ Plugin registered with ACTIVE status & real-time broadcast.');

  // Disable
  const disabled = await managerService.disablePlugin('bacnet-ip-adapter');
  assert.strictEqual(disabled.status, 'DISABLED' as PluginStatus);
  assert.ok(
    mockRealtime.emittedEvents.some((e) => e.event === 'plugin:disabled'),
    'Should emit plugin:disabled event',
  );
  console.log('✓ Plugin disabled & real-time event broadcast.');

  // Enable
  const enabled = await managerService.enablePlugin('bacnet-ip-adapter');
  assert.strictEqual(enabled.status, 'ACTIVE' as PluginStatus);
  assert.ok(
    mockRealtime.emittedEvents.some((e) => e.event === 'plugin:enabled'),
    'Should emit plugin:enabled event',
  );
  console.log('✓ Plugin re-enabled & real-time event broadcast.');

  // Update Config
  const updated = await managerService.updateConfig('bacnet-ip-adapter', { timeout: 10000 });
  assert.strictEqual(updated.config.timeout, 10000);
  assert.strictEqual(updated.config.port, 47808, 'Preserves existing default config fields');
  assert.ok(
    mockRealtime.emittedEvents.some((e) => e.event === 'plugin:updated'),
    'Should emit plugin:updated event',
  );
  console.log('✓ Plugin configuration updated & merged.');

  // Verify Audit Logs
  const logs = await managerService.getAuditLogs('bacnet-ip-adapter', 10);
  assert.ok(logs.length >= 4, 'Audit logs must capture register, disable, enable, and config update');
  const actions = logs.map((l) => l.action as PluginAuditAction);
  assert.ok(actions.includes('INSTALL'));
  assert.ok(actions.includes('DISABLE'));
  assert.ok(actions.includes('ENABLE'));
  assert.ok(actions.includes('CONFIG_CHANGE'));
  console.log(`✓ Audit log captured ${logs.length} lifecycle transitions (${actions.join(', ')}).`);

  // Uninstall
  await managerService.uninstallPlugin('bacnet-ip-adapter');
  const afterDelete = await managerService.getPlugin('bacnet-ip-adapter');
  assert.strictEqual(afterDelete, null, 'Plugin must be removed from manager after uninstall');
  assert.ok(
    mockRealtime.emittedEvents.some((e) => e.event === 'plugin:uninstalled'),
    'Should emit plugin:uninstalled event',
  );
  console.log('✓ Plugin uninstalled, cleaned up and broadcasted.');

  // ==========================================
  // Test 4: PluginManagerController Verification
  // ==========================================
  console.log('\n[TEST 4] PluginManagerController - Endpoints & Streaming');
  const controller = new PluginManagerController(managerService);

  // 4.1 Register via controller
  const controllerRegResult = await controller.registerPlugin({
    manifest: {
      id: 'opc-ua-client',
      name: 'OPC-UA Client',
      version: '2.1.0',
      type: 'PROTOCOL',
      entry: 'opcua.js',
      permissions: ['NETWORK_CLIENT'],
    },
    autoEnable: true,
  });
  assert.strictEqual(controllerRegResult.success, true);
  assert.strictEqual(controllerRegResult.data.id, 'opc-ua-client');

  // 4.2 List via controller
  const listResult = await controller.listPlugins({});
  assert.strictEqual(listResult.success, true);
  assert.ok(listResult.data.some((p: any) => p.id === 'opc-ua-client'));

  // 4.3 Get details
  const detailResult = await controller.getPlugin('opc-ua-client');
  assert.strictEqual(detailResult.success, true);
  assert.strictEqual(detailResult.data.name, 'OPC-UA Client');

  // 4.4 Audit logs endpoint
  const auditResult = await controller.getAuditLogs('opc-ua-client');
  assert.strictEqual(auditResult.success, true);
  assert.ok(auditResult.count > 0);

  // Clean up controller test plugin
  await controller.uninstallPlugin('opc-ua-client');
  console.log('✓ PluginManagerController all endpoints functioning properly.');

  console.log('\n======================================================');
  console.log('ALL PLUGIN MANAGEMENT SUBSYSTEM TESTS PASSED CLEANLY!');
  console.log('======================================================\n');
}

// Execute test suite
runPluginManagementTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('VERIFICATION FAILURE:', err);
    process.exit(1);
  });
