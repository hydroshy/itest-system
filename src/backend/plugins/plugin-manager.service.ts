import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { RealtimeService } from '../realtime/modules/realtime/realtime.service';
import { PluginStorageService } from './plugin-storage.service';
import { CorePluginEntity, PluginAuditLogEntity } from '../core-models';
import {
  RemotePluginManifest,
  InstallPluginUrlDto,
  RegisterPluginDto,
  PluginFilterDto,
  PluginLifecycleEvent,
  PluginStatus,
  PluginType,
} from './plugin-manifest.interface';

@Injectable()
export class PluginManagerService implements OnModuleInit {
  private readonly logger = new Logger(PluginManagerService.name);

  // In-memory cache for fast lookups & offline fallback
  private readonly pluginsCache = new Map<string, CorePluginEntity>();
  private readonly auditLogsCache: PluginAuditLogEntity[] = [];

  constructor(
    private readonly storageService: PluginStorageService,
    @Optional() private readonly dbService?: DynamicDatabaseService,
    @Optional() private readonly realtimeService?: RealtimeService,
  ) {}

  async onModuleInit() {
    await this.syncPluginsFromDatabase();
    await this.scanAndSyncLocalPlugins();
  }

  /**
   * Scan local plugins directory and synchronize discovered plugins
   */
  public async scanAndSyncLocalPlugins(customDir?: string): Promise<CorePluginEntity[]> {
    const candidateDirs = [
      customDir,
      process.env.PLUGINS_DIR,
      path.resolve(process.cwd(), 'plugins'),
      path.resolve(process.cwd(), '../plugins'),
      path.resolve(process.cwd(), '../itest-plugins/plugins'),
    ].filter(Boolean) as string[];

    let targetDir: string | null = null;
    for (const dir of candidateDirs) {
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        targetDir = dir;
        break;
      }
    }

    if (!targetDir) {
      this.logger.log('No local plugins directory found for auto-discovery.');
      return [];
    }

    this.logger.log(`Scanning local plugins from directory: ${targetDir}`);
    const discovered: CorePluginEntity[] = [];

    try {
      const entries = fs.readdirSync(targetDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const pluginDir = path.join(targetDir, entry.name);
        const manifestPaths = [
          path.join(pluginDir, 'plugin.json'),
          path.join(pluginDir, 'manifest.json'),
          path.join(pluginDir, 'plugin-manifest.json'),
        ];

        let manifestFile = manifestPaths.find((p) => fs.existsSync(p));
        if (!manifestFile) continue;

        try {
          const raw = fs.readFileSync(manifestFile, 'utf-8');
          const data = JSON.parse(raw);

          if (!data.id) continue;

          // Normalize type to uppercase PluginType
          const rawType = (data.type || 'APPLICATION').toUpperCase();
          const validTypes: PluginType[] = [
            'PROTOCOL',
            'TRANSPORT',
            'DATA_PROCESSING',
            'APPLICATION',
            'UI',
            'PROCESSOR',
            'HYBRID',
          ];
          const type: PluginType = validTypes.includes(rawType) ? rawType : 'APPLICATION';

          const existing = this.pluginsCache.get(data.id);
          const entity = existing || new CorePluginEntity();

          entity.id = data.id;
          entity.name = data.name || data.id;
          entity.version = data.version || '1.0.0';
          entity.type = type;
          entity.status = existing?.status || 'ACTIVE';
          entity.description = data.description || '';
          entity.author = data.author || '';
          entity.license = data.license || 'MIT';
          entity.repositoryUrl = data.repository?.url || '';
          entity.bundleUrl = data.entry || entity.bundleUrl || '';
          entity.bundleType = 'ESM';
          entity.manifest = data;
          entity.uiEntry = (data.uiEntry || data.ui || { routes: [], menus: [], widgets: [] }) as any;
          entity.backendEntry = (data.backendEntry || {}) as any;
          entity.permissions = Array.isArray(data.permissions)
            ? data.permissions.map((p: any) => (typeof p === 'string' ? p : `${p.namespace || ''}:${p.resource || ''}:${p.action || ''}`))
            : [];
          entity.config = entity.config && Object.keys(entity.config).length > 0
            ? entity.config
            : data.defaultConfig || {};

          this.pluginsCache.set(entity.id, entity);
          await this.persistPlugin(entity);
          discovered.push(entity);
        } catch (err: any) {
          this.logger.warn(`Failed to parse plugin manifest in ${pluginDir}: ${err.message}`);
        }
      }

      this.logger.log(`Discovered and synchronized ${discovered.length} local plugin(s).`);
    } catch (err: any) {
      this.logger.error(`Error scanning local plugins: ${err.message}`);
    }

    return discovered;
  }

  /**
   * Synchronize plugins from PostgreSQL database into memory cache
   */
  public async syncPluginsFromDatabase(): Promise<void> {
    try {
      if (this.dbService) {
        const repo = this.dbService.getRepositoryForTable('core_plugins', CorePluginEntity);
        const plugins = await repo.find();
        for (const p of plugins) {
          this.pluginsCache.set(p.id, p);
        }
        this.logger.log(`Synchronized ${plugins.length} plugins from database into memory cache.`);
      }
    } catch (err: any) {
      this.logger.warn(`Could not sync plugins from database (offline/mock mode): ${err.message}`);
    }
  }

  /**
   * List installed plugins with optional filters
   */
  public async listPlugins(filter?: PluginFilterDto): Promise<CorePluginEntity[]> {
    let list = Array.from(this.pluginsCache.values());

    if (filter?.status) {
      list = list.filter((p) => p.status === filter.status);
    }
    if (filter?.type) {
      list = list.filter((p) => p.type === filter.type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    return list;
  }

  /**
   * Get single plugin by ID
   */
  public async getPlugin(id: string): Promise<CorePluginEntity | null> {
    return this.pluginsCache.get(id) || null;
  }

  /**
   * Register or install a plugin from its manifest and optional bundle files
   */
  public async registerPlugin(
    manifest: RemotePluginManifest,
    options?: {
      bundleBuffer?: Buffer;
      bundleUrl?: string;
      autoEnable?: boolean;
      operator?: string;
    },
  ): Promise<CorePluginEntity> {
    this.validateManifest(manifest);

    const operator = options?.operator || 'system';
    const isNew = !this.pluginsCache.has(manifest.id);

    // Save bundle files if provided
    let finalBundleUrl = options?.bundleUrl || manifest.remoteEntry || (manifest as any).bundleUrl;

    if (options?.bundleBuffer) {
      // If integrity is specified, verify it
      if (manifest.integrity) {
        this.verifyIntegrity(options.bundleBuffer, manifest.integrity);
      }

      const files: Record<string, Buffer | string> = {
        'manifest.json': JSON.stringify(manifest, null, 2),
        'entry.js': options.bundleBuffer,
      };
      await this.storageService.saveBundleFiles(manifest.id, manifest.version, files);
      finalBundleUrl = `/api/v1/plugins/${encodeURIComponent(manifest.id)}/bundle/entry.js`;
    }

    const plugin = new CorePluginEntity();
    plugin.id = manifest.id;
    plugin.name = manifest.name;
    plugin.version = manifest.version;
    plugin.type = manifest.type;
    plugin.status = (options?.autoEnable ?? true) ? 'ACTIVE' : 'DISABLED';
    plugin.description = manifest.description || '';
    plugin.author = manifest.author || '';
    plugin.license = manifest.license || 'MIT';
    plugin.repositoryUrl = manifest.repository?.url || '';
    plugin.bundleUrl = finalBundleUrl || '';
    plugin.bundleType = manifest.format ? manifest.format.toUpperCase() : 'ESM';
    plugin.manifest = manifest as any;
    plugin.uiEntry = (manifest.uiEntry || { routes: [], menus: [], widgets: [] }) as any;
    plugin.backendEntry = (manifest.backendEntry || {}) as any;
    plugin.permissions = (manifest.permissions || []) as any;
    plugin.config = manifest.defaultConfig || {};
    plugin.schemaName = 'public';
    plugin.createdAt = new Date();
    plugin.updatedAt = new Date();

    // Save to DB and Cache
    this.pluginsCache.set(plugin.id, plugin);
    await this.persistPlugin(plugin);

    // Audit log
    await this.recordAuditLog(
      plugin.id,
      plugin.version,
      isNew ? 'INSTALL' : 'UPDATE',
      operator,
      { manifest, bundleUrl: finalBundleUrl },
    );

    // Broadcast WebSocket lifecycle event
    this.broadcastLifecycle(isNew ? 'plugin:installed' : 'plugin:updated', plugin);

    this.logger.log(`Successfully registered plugin [${plugin.id}@${plugin.version}]`);
    return plugin;
  }

  /**
   * Install a plugin by fetching from a Remote URL (CDN / GitHub Releases / raw manifest)
   */
  public async installFromUrl(dto: InstallPluginUrlDto, operator: string = 'system'): Promise<CorePluginEntity> {
    if (!dto.url || !dto.url.startsWith('http')) {
      throw new Error(`Invalid URL: ${dto.url}. Must be http:// or https://`);
    }

    this.logger.log(`Fetching remote plugin from URL: ${dto.url}`);
    const response = await fetch(dto.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${dto.url}: HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || dto.url.endsWith('.json');
    const isZip = contentType.includes('zip') || dto.url.endsWith('.zip') || dto.url.endsWith('.tgz');

    if (isJson) {
      const manifest: RemotePluginManifest = await response.json();
      if (dto.integrity) {
        manifest.integrity = dto.integrity;
      }
      return await this.registerPlugin(manifest, {
        autoEnable: dto.autoEnable ?? true,
        operator,
      });
    } else if (isZip) {
      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const fileName = path.basename(new URL(dto.url).pathname) || 'bundle.zip';
      return await this.installFromArchive(buffer, fileName, operator);
    } else {
      // Treat as raw ESM / JS bundle
      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);

      const fileName = path.basename(new URL(dto.url).pathname) || 'bundle.js';
      const syntheticId = fileName.replace(/\.[^/.]+$/, '').toLowerCase();

      const manifest: RemotePluginManifest = {
        id: syntheticId,
        name: syntheticId,
        version: '1.0.0',
        type: dto.type || 'UI',
        remoteEntry: `/api/v1/plugins/${syntheticId}/bundle/entry.js`,
        format: 'esm',
        integrity: dto.integrity,
      };

      return await this.registerPlugin(manifest, {
        bundleBuffer: buffer,
        autoEnable: dto.autoEnable ?? true,
        operator,
      });
    }
  }

  /**
   * Install a plugin from an uploaded bundle archive (.zip, .tgz)
   */
  public async installFromArchive(
    archiveBuffer: Buffer,
    fileName: string,
    operator: string = 'system',
  ): Promise<CorePluginEntity> {
    const tempId = `temp_${Date.now()}`;
    const { extractedFiles, manifest } = await this.storageService.extractArchive(
      tempId,
      'extract',
      archiveBuffer,
      fileName,
    );

    let finalManifest: RemotePluginManifest;

    if (manifest) {
      finalManifest = manifest;
    } else {
      // Auto-synthesize manifest from archive contents
      const baseName = path.basename(fileName, path.extname(fileName));
      const jsEntry = extractedFiles.find((f) => f.endsWith('.js') || f.endsWith('.mjs')) || 'index.js';
      finalManifest = {
        id: baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        name: baseName,
        version: '1.0.0',
        type: 'PROTOCOL',
        entry: jsEntry,
        remoteEntry: `/api/v1/plugins/${baseName}/bundle/${jsEntry}`,
        format: 'esm',
      };
    }

    // Move or re-save extracted files into final plugin directory
    const pluginDir = this.storageService.getPluginDir(finalManifest.id, finalManifest.version);
    const tempDir = this.storageService.getPluginDir(tempId, 'extract');

    // Clean up temp extraction folder and register
    await this.storageService.deletePluginFiles(tempId);

    // Save bundle archive to persistent location
    await this.storageService.extractArchive(
      finalManifest.id,
      finalManifest.version,
      archiveBuffer,
      fileName,
    );

    return await this.registerPlugin(finalManifest, {
      autoEnable: true,
      operator,
    });
  }

  /**
   * Enable an installed plugin
   */
  public async enablePlugin(id: string, operator: string = 'system'): Promise<CorePluginEntity> {
    const plugin = this.pluginsCache.get(id);
    if (!plugin) {
      throw new Error(`Plugin [${id}] not found`);
    }

    plugin.status = 'ACTIVE';
    plugin.updatedAt = new Date();

    this.pluginsCache.set(id, plugin);
    await this.persistPlugin(plugin);

    await this.recordAuditLog(id, plugin.version, 'ENABLE', operator, {});
    this.broadcastLifecycle('plugin:enabled', plugin);

    this.logger.log(`Enabled plugin [${id}]`);
    return plugin;
  }

  /**
   * Disable an installed plugin
   */
  public async disablePlugin(id: string, operator: string = 'system'): Promise<CorePluginEntity> {
    const plugin = this.pluginsCache.get(id);
    if (!plugin) {
      throw new Error(`Plugin [${id}] not found`);
    }

    plugin.status = 'DISABLED';
    plugin.updatedAt = new Date();

    this.pluginsCache.set(id, plugin);
    await this.persistPlugin(plugin);

    await this.recordAuditLog(id, plugin.version, 'DISABLE', operator, {});
    this.broadcastLifecycle('plugin:disabled', plugin);

    this.logger.log(`Disabled plugin [${id}]`);
    return plugin;
  }

  /**
   * Uninstall and delete a plugin
   */
  public async uninstallPlugin(id: string, operator: string = 'system'): Promise<boolean> {
    const plugin = this.pluginsCache.get(id);
    if (!plugin) {
      throw new Error(`Plugin [${id}] not found`);
    }

    // Delete stored files
    await this.storageService.deletePluginFiles(id);

    // Remove from DB or mark UNINSTALLED
    try {
      if (this.dbService) {
        const repo = this.dbService.getRepositoryForTable('core_plugins', CorePluginEntity);
        if (typeof repo.delete === 'function') {
          await repo.delete({ id });
        } else if (typeof repo.remove === 'function') {
          const entity = await repo.findOne({ where: { id } });
          if (entity) await repo.remove(entity);
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not delete plugin from database: ${err.message}`);
    }

    this.pluginsCache.delete(id);

    await this.recordAuditLog(id, plugin.version, 'UNINSTALL', operator, {});
    this.broadcastLifecycle('plugin:uninstalled', { id, version: plugin.version, status: 'UNINSTALLED' });

    this.logger.log(`Uninstalled plugin [${id}]`);
    return true;
  }

  /**
   * Update plugin runtime configuration
   */
  public async updateConfig(
    id: string,
    config: Record<string, any>,
    operator: string = 'system',
  ): Promise<CorePluginEntity> {
    const plugin = this.pluginsCache.get(id);
    if (!plugin) {
      throw new Error(`Plugin [${id}] not found`);
    }

    plugin.config = { ...plugin.config, ...config };
    plugin.updatedAt = new Date();

    this.pluginsCache.set(id, plugin);
    await this.persistPlugin(plugin);

    await this.recordAuditLog(id, plugin.version, 'CONFIG_CHANGE', operator, { config });
    this.broadcastLifecycle('plugin:updated', plugin);

    return plugin;
  }

  /**
   * Query audit logs
   */
  public async getAuditLogs(pluginId?: string, limit: number = 50): Promise<PluginAuditLogEntity[]> {
    try {
      if (this.dbService) {
        const repo = this.dbService.getRepositoryForTable('plugin_audit_logs', PluginAuditLogEntity);
        const qb = repo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC').limit(limit);
        if (pluginId) {
          qb.where('log.pluginId = :pluginId', { pluginId });
        }
        return await qb.getMany();
      }
    } catch {
      // Fallback to memory
    }

    let logs = this.auditLogsCache;
    if (pluginId) {
      logs = logs.filter((l) => l.pluginId === pluginId);
    }
    return logs.slice(0, limit);
  }

  /**
   * Serve a bundle file from storage
   */
  public resolveBundleFile(
    pluginId: string,
    relativePath: string,
  ): { filePath: string; mimeType: string; exists: boolean } {
    const plugin = this.pluginsCache.get(pluginId);
    const version = plugin?.version || 'latest';
    return this.storageService.resolveFile(pluginId, version, relativePath);
  }

  // --- Internal Helpers ---

  private validateManifest(manifest: RemotePluginManifest): void {
    if (!manifest.id || typeof manifest.id !== 'string') {
      throw new Error('Manifest validation failed: "id" is required and must be a string');
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Manifest validation failed: "name" is required and must be a string');
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Manifest validation failed: "version" is required and must be a string');
    }
    const validTypes = ['PROTOCOL', 'TRANSPORT', 'DATA_PROCESSING', 'APPLICATION', 'UI', 'PROCESSOR', 'HYBRID'];
    if (!validTypes.includes(manifest.type)) {
      throw new Error(`Manifest validation failed: "type" must be one of [${validTypes.join(', ')}]`);
    }
  }

  private verifyIntegrity(buffer: Buffer, expectedIntegrity: string): void {
    if (expectedIntegrity.startsWith('sha256-')) {
      const hash = 'sha256-' + crypto.createHash('sha256').update(buffer).digest('base64');
      if (hash !== expectedIntegrity) {
        throw new Error(`Integrity check failed! Expected ${expectedIntegrity}, calculated ${hash}`);
      }
    } else if (expectedIntegrity.startsWith('sha384-')) {
      const hash = 'sha384-' + crypto.createHash('sha384').update(buffer).digest('base64');
      if (hash !== expectedIntegrity) {
        throw new Error(`Integrity check failed! Expected ${expectedIntegrity}, calculated ${hash}`);
      }
    } else {
      // Hex hash fallback
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      if (hash !== expectedIntegrity) {
        throw new Error(`Integrity check failed! Expected ${expectedIntegrity}, calculated ${hash}`);
      }
    }
  }

  private async persistPlugin(plugin: CorePluginEntity): Promise<void> {
    try {
      if (this.dbService) {
        const repo = this.dbService.getRepositoryForTable('core_plugins', CorePluginEntity);
        await repo.save(plugin);
      }
    } catch (err: any) {
      this.logger.warn(`Could not persist plugin to database: ${err.message}`);
    }
  }

  private async recordAuditLog(
    pluginId: string,
    version: string,
    action: any,
    operator: string,
    details: Record<string, any>,
  ): Promise<void> {
    const log = new PluginAuditLogEntity();
    log.id = crypto.randomUUID();
    log.pluginId = pluginId;
    log.version = version;
    log.action = action;
    log.operator = operator;
    log.details = details;
    log.createdAt = new Date();

    this.auditLogsCache.unshift(log);
    if (this.auditLogsCache.length > 500) {
      this.auditLogsCache.pop();
    }

    try {
      if (this.dbService) {
        const repo = this.dbService.getRepositoryForTable('plugin_audit_logs', PluginAuditLogEntity);
        await repo.save(log);
      }
    } catch {
      // Ignored in offline/mock mode
    }
  }

  private broadcastLifecycle(eventName: string, data: any): void {
    if (this.realtimeService) {
      this.realtimeService.publishPluginLifecycle(eventName, data);
    }
  }
}

