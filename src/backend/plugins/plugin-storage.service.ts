import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import { RemotePluginManifest } from './plugin-manifest.interface';

@Injectable()
export class PluginStorageService implements OnModuleInit {
  private readonly logger = new Logger(PluginStorageService.name);
  private storageRoot: string =
    process.env.PLUGIN_STORAGE_PATH ||
    path.resolve(process.cwd(), 'storage', 'plugins');

  constructor() {
    this.ensureStorageRoot();
  }

  onModuleInit() {
    this.ensureStorageRoot();
  }

  private ensureStorageRoot() {
    if (!fs.existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
      this.logger.log(`Initialized plugin storage directory at: ${this.storageRoot}`);
    }
  }

  public getStorageRoot(): string {
    return this.storageRoot;
  }

  /**
   * Sanitize plugin ID into a safe filesystem folder name
   * e.g., "@universal-iot/modbus-rtu" -> "universal-iot__modbus-rtu"
   */
  public sanitizeId(pluginId: string): string {
    return pluginId
      .replace(/^@/, '')
      .replace(/[\/\\:]+/g, '__')
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  }

  /**
   * Get target directory for a plugin version
   */
  public getPluginDir(pluginId: string, version: string = 'latest'): string {
    if (pluginId.includes('..') || version.includes('..')) {
      throw new Error(`Invalid plugin path traversal detected for ${pluginId}@${version}`);
    }

    const safeId = this.sanitizeId(pluginId);
    const safeVer = version.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const targetDir = path.resolve(this.storageRoot, safeId, safeVer);

    // Path traversal check
    const normalizedRoot = path.resolve(this.storageRoot);
    if (!targetDir.startsWith(normalizedRoot + path.sep) && targetDir !== normalizedRoot) {
      throw new Error(`Invalid plugin path traversal detected for ${pluginId}@${version}`);
    }

    return targetDir;
  }

  /**
   * Save individual bundle files into the plugin storage directory
   */
  public async saveBundleFiles(
    pluginId: string,
    version: string,
    files: Record<string, Buffer | string>,
  ): Promise<string[]> {
    const pluginDir = this.getPluginDir(pluginId, version);
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    const savedFiles: string[] = [];
    for (const [relPath, content] of Object.entries(files)) {
      // Normalize and guard against directory traversal inside archive
      const cleanRelPath = relPath.replace(/^\/+/, '').replace(/\.\.\//g, '');
      const filePath = path.resolve(pluginDir, cleanRelPath);

      if (!filePath.startsWith(pluginDir)) {
        this.logger.warn(`Skipping suspicious file path: ${relPath}`);
        continue;
      }

      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(filePath, content);
      savedFiles.push(cleanRelPath);
    }

    this.logger.log(`Saved ${savedFiles.length} files for plugin [${pluginId}@${version}]`);
    return savedFiles;
  }

  /**
   * Extract bundle archive (.zip, .tgz, .tar.gz) using platform-native tar
   */
  public async extractArchive(
    pluginId: string,
    version: string,
    archiveBuffer: Buffer,
    archiveFileName: string,
  ): Promise<{ extractedFiles: string[]; manifest?: RemotePluginManifest }> {
    const pluginDir = this.getPluginDir(pluginId, version);
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    // Write temp archive file
    const tempExt = path.extname(archiveFileName) || '.zip';
    const tempArchivePath = path.resolve(pluginDir, `__temp_upload${tempExt}`);
    fs.writeFileSync(tempArchivePath, archiveBuffer);

    try {
      // Use bsdtar (built-in Windows & Linux) with stdio ignore for sandbox safety
      execFileSync('tar', ['-xf', tempArchivePath, '-C', pluginDir], {
        stdio: 'ignore',
      });
    } catch (err: any) {
      this.logger.error(`Failed to extract archive with tar: ${err.message}`);
      throw new Error(`Extraction failed: ${err.message}`);
    } finally {
      if (fs.existsSync(tempArchivePath)) {
        try {
          fs.unlinkSync(tempArchivePath);
        } catch {
          // Ignore temp cleanup error
        }
      }
    }

    // Scan extracted files and discover manifest
    const extractedFiles = this.scanDirRecursive(pluginDir, pluginDir);
    let manifest: RemotePluginManifest | undefined;

    // Look for manifest.json or package.json
    const manifestFile = extractedFiles.find(
      (f) => path.basename(f).toLowerCase() === 'manifest.json',
    );
    if (manifestFile) {
      try {
        const raw = fs.readFileSync(path.resolve(pluginDir, manifestFile), 'utf8');
        manifest = JSON.parse(raw);
      } catch (err: any) {
        this.logger.warn(`Could not parse manifest.json: ${err.message}`);
      }
    }

    return { extractedFiles, manifest };
  }

  /**
   * Resolve an asset file for HTTP static serving with strict traversal check
   */
  public resolveFile(
    pluginId: string,
    version: string,
    relativePath: string,
  ): { filePath: string; mimeType: string; exists: boolean } {
    const pluginDir = this.getPluginDir(pluginId, version);
    const safeRel = relativePath.replace(/^[\/\\]+/, '');
    const targetPath = path.resolve(pluginDir, safeRel);

    if (!targetPath.startsWith(pluginDir)) {
      return { filePath: '', mimeType: 'text/plain', exists: false };
    }

    const exists = fs.existsSync(targetPath) && fs.statSync(targetPath).isFile();
    const ext = path.extname(targetPath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.js': 'application/javascript',
      '.mjs': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.html': 'text/html',
      '.wasm': 'application/wasm',
    };

    const mimeType = mimeMap[ext] || 'application/octet-stream';
    return { filePath: targetPath, mimeType, exists };
  }

  /**
   * Delete all stored files for a plugin
   */
  public async deletePluginFiles(pluginId: string): Promise<boolean> {
    const safeId = this.sanitizeId(pluginId);
    const targetDir = path.resolve(this.storageRoot, safeId);

    if (targetDir.startsWith(this.storageRoot) && fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      this.logger.log(`Deleted storage directory for plugin [${pluginId}]`);
      return true;
    }
    return false;
  }

  /**
   * Read manifest.json directly from disk
   */
  public readStoredManifest(pluginId: string, version: string = 'latest'): RemotePluginManifest | null {
    const pluginDir = this.getPluginDir(pluginId, version);
    const manifestPath = path.resolve(pluginDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const raw = fs.readFileSync(manifestPath, 'utf8');
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }

  private scanDirRecursive(baseDir: string, currentDir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(currentDir)) return results;

    const list = fs.readdirSync(currentDir);
    for (const item of list) {
      const fullPath = path.resolve(currentDir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(this.scanDirRecursive(baseDir, fullPath));
      } else {
        results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
      }
    }
    return results;
  }
}
