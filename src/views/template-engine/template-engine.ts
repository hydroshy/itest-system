import * as fs from 'fs';
import * as path from 'path';

export interface TemplateContext {
  [key: string]: string | number | boolean | undefined;
}

export interface SlotMap {
  [slotName: string]: string;
}

/**
 * High-performance, zero-dependency Template Engine for Micro-kernel SSR View rendering.
 * Supports:
 * 1. Modular HTML partial loading with cached file reading in production.
 * 2. Slot injection via `<!-- @slot:slotName -->` or `{{slot:slotName}}`.
 * 3. Safe fallback when partial or slot is omitted.
 * 4. Nested layouts and recursive template composition.
 */
export class TemplateEngine {
  private static cache: Map<string, string> = new Map();
  private static isProd = process.env.NODE_ENV === 'production';

  /**
   * Load an HTML/CSS template from the filesystem.
   * Caches in memory for production efficiency while allowing instant reload in development.
   */
  public static loadFile(relativeOrAbsolutePath: string): string {
    const filePath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.join(__dirname, '..', 'templates', relativeOrAbsolutePath);

    if (this.isProd && this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    try {
      if (!fs.existsSync(filePath)) {
        // Fallback for dist / source paths in dev mode
        const altPath = filePath.replace(path.sep + 'dist' + path.sep, path.sep + 'src' + path.sep);
        if (fs.existsSync(altPath)) {
          const content = fs.readFileSync(altPath, 'utf8');
          if (this.isProd) this.cache.set(filePath, content);
          return content;
        }
        return `<!-- Template file not found: ${filePath} -->`;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      if (this.isProd) {
        this.cache.set(filePath, content);
      }
      return content;
    } catch (err: any) {
      console.error(`[TemplateEngine] Error loading template from ${filePath}:`, err?.message);
      return `<!-- Error loading template: ${err?.message} -->`;
    }
  }

  /**
   * Render a layout by injecting named slots into placeholders.
   * Placeholders can be:
   *   <!-- @slot:header -->
   *   {{slot:header}}
   */
  public static renderLayout(layoutTemplate: string, slots: SlotMap): string {
    let result = layoutTemplate;

    for (const [slotName, slotContent] of Object.entries(slots)) {
      const commentPattern = new RegExp(`<!--\\s*@slot:${slotName}\\s*-->`, 'g');
      const mustachePattern = new RegExp(`\\{\\{\\s*slot:${slotName}\\s*\\}\\}`, 'g');

      result = result.replace(commentPattern, slotContent || '');
      result = result.replace(mustachePattern, slotContent || '');
    }

    // Clean up any remaining unrendered comment slots
    result = result.replace(/<!--\s*@slot:[a-zA-Z0-9_-]+\s*-->/g, '');
    return result;
  }

  /**
   * Compose a full document from a base template and multiple modular partials.
   */
  public static compose(basePath: string, slots: SlotMap): string {
    const baseContent = this.loadFile(basePath);
    return this.renderLayout(baseContent, slots);
  }

  /**
   * Clear template cache (useful in dev reload or tests).
   */
  public static clearCache(): void {
    this.cache.clear();
  }
}
