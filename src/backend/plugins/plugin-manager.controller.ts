import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { PluginManagerService } from './plugin-manager.service';
import {
  InstallPluginUrlDto,
  RegisterPluginDto,
  PluginFilterDto,
  RemotePluginManifest,
} from './plugin-manifest.interface';

@Controller('api/v1/plugins')
export class PluginManagerController {
  private readonly logger = new Logger(PluginManagerController.name);

  constructor(private readonly pluginManager: PluginManagerService) {}

  /**
   * List installed plugins with optional filters
   * GET /api/v1/plugins?type=PROTOCOL&status=ACTIVE&search=modbus
   */
  @Get()
  async listPlugins(@Query() filter: PluginFilterDto) {
    try {
      const plugins = await this.pluginManager.listPlugins(filter);
      return {
        success: true,
        count: plugins.length,
        data: plugins,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get audit logs
   * GET /api/v1/plugins/audit/logs?pluginId=modbus-rtu&limit=50
   */
  @Get('audit/logs')
  async getAuditLogs(
    @Query('pluginId') pluginId?: string,
    @Query('limit') limitStr?: string,
  ) {
    try {
      const limit = limitStr ? parseInt(limitStr, 10) : 50;
      const logs = await this.pluginManager.getAuditLogs(pluginId, limit);
      return {
        success: true,
        count: logs.length,
        data: logs,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get plugin details by ID
   * GET /api/v1/plugins/:id
   */
  @Get(':id')
  async getPlugin(@Param('id') id: string) {
    const plugin = await this.pluginManager.getPlugin(id);
    if (!plugin) {
      throw new HttpException(
        { success: false, message: `Plugin [${id}] not found` },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      success: true,
      data: plugin,
    };
  }

  /**
   * Register plugin manifest directly
   * POST /api/v1/plugins/register
   */
  @Post('register')
  async registerPlugin(@Body() dto: RegisterPluginDto) {
    try {
      if (!dto.manifest) {
        throw new Error('Manifest is required');
      }
      const plugin = await this.pluginManager.registerPlugin(dto.manifest, {
        bundleUrl: dto.bundleUrl,
        autoEnable: dto.autoEnable ?? true,
      });
      return {
        success: true,
        message: `Plugin [${plugin.id}] registered successfully`,
        data: plugin,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Install plugin from remote URL (CDN, GitHub raw manifest, or zip archive)
   * POST /api/v1/plugins/install-url
   */
  @Post('install-url')
  async installFromUrl(@Body() dto: InstallPluginUrlDto) {
    try {
      const plugin = await this.pluginManager.installFromUrl(dto);
      return {
        success: true,
        message: `Plugin [${plugin.id}] installed successfully from URL`,
        data: plugin,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Upload plugin archive bundle (.zip, .tgz)
   * POST /api/v1/plugins/upload
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPluginArchive(@UploadedFile() file: any) {
    try {
      if (!file || !file.buffer) {
        throw new Error('File upload is required (multipart field name: "file")');
      }
      const fileName = file.originalname || 'plugin-bundle.zip';
      const plugin = await this.pluginManager.installFromArchive(file.buffer, fileName);
      return {
        success: true,
        message: `Plugin [${plugin.id}] extracted and installed successfully`,
        data: plugin,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Enable plugin
   * POST /api/v1/plugins/:id/enable
   */
  @Post(':id/enable')
  async enablePlugin(@Param('id') id: string) {
    try {
      const plugin = await this.pluginManager.enablePlugin(id);
      return {
        success: true,
        message: `Plugin [${id}] enabled`,
        data: plugin,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Disable plugin
   * POST /api/v1/plugins/:id/disable
   */
  @Post(':id/disable')
  async disablePlugin(@Param('id') id: string) {
    try {
      const plugin = await this.pluginManager.disablePlugin(id);
      return {
        success: true,
        message: `Plugin [${id}] disabled`,
        data: plugin,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update plugin runtime configuration
   * PATCH /api/v1/plugins/:id/config
   */
  @Patch(':id/config')
  async updateConfig(
    @Param('id') id: string,
    @Body() config: Record<string, any>,
  ) {
    try {
      const plugin = await this.pluginManager.updateConfig(id, config);
      return {
        success: true,
        message: `Plugin [${id}] config updated`,
        data: plugin,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Uninstall and delete plugin
   * DELETE /api/v1/plugins/:id
   */
  @Delete(':id')
  async uninstallPlugin(@Param('id') id: string) {
    try {
      await this.pluginManager.uninstallPlugin(id);
      return {
        success: true,
        message: `Plugin [${id}] uninstalled successfully`,
      };
    } catch (err: any) {
      throw new HttpException(
        { success: false, message: err.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Serve dynamic plugin bundle files with proper MIME types & CORS headers
   * GET /api/v1/plugins/:id/bundle/*
   */
  @Get(':id/bundle/*')
  async serveBundleFile(
    @Param('id') id: string,
    @Param() params: any,
    @Res() res: Response,
  ) {
    const rawPath = params['0'] || 'entry.js';
    const { filePath, mimeType, exists } = this.pluginManager.resolveBundleFile(id, rawPath);

    if (!exists) {
      throw new HttpException(
        { success: false, message: `File [${rawPath}] not found for plugin [${id}]` },
        HttpStatus.NOT_FOUND,
      );
    }

    // Set CORS and caching headers for dynamic module loading (Vite / ESM import)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
