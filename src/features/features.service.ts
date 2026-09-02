import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserType } from '../modules/users/entities/user.entity';
import { FeatureModule, FEATURE_MODULES_REGISTRY } from './feature-registry';

export interface CreateFeatureDto {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  category: 'Monitoring' | 'Fleet' | 'Analytics' | 'System' | 'Reports' | 'Custom';
  requiredPermission?: string;
  allowedRoleCodes?: string[];
  status?: 'active' | 'ready' | 'beta';
  isActive?: boolean;
}

export interface UpdateFeatureDto extends Partial<CreateFeatureDto> {}

@Injectable()
export class FeaturesService implements OnModuleInit {
  private readonly logger = new Logger(FeaturesService.name);
  private readonly configPath = path.join(process.cwd(), 'config', 'dashboard-modules.json');
  private modules: FeatureModule[] = [];

  onModuleInit() {
    this.loadModules();
  }

  private loadModules() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.modules = parsed;
          this.logger.log(`Loaded ${this.modules.length} dashboard feature modules from config.`);
          return;
        }
      }

      // Default fallback
      this.modules = JSON.parse(JSON.stringify(FEATURE_MODULES_REGISTRY));
      this.saveModules();
      this.logger.log(`Initialized default ${this.modules.length} dashboard modules.`);
    } catch (err: any) {
      this.logger.error(`Error loading modules: ${err.message}`, err.stack);
      this.modules = JSON.parse(JSON.stringify(FEATURE_MODULES_REGISTRY));
    }
  }

  private saveModules() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.modules, null, 2), 'utf8');
    } catch (err: any) {
      this.logger.error(`Failed to save modules to ${this.configPath}: ${err.message}`);
    }
  }

  getAllModules(): FeatureModule[] {
    return this.modules;
  }

  getAccessibleFeatures(user: User): FeatureModule[] {
    const isSuperAdmin =
      user.userType === UserType.ADMIN ||
      String(user.userType).toUpperCase() === 'ADMIN' ||
      user.username === 'admin' ||
      user.roles?.some((r) => r.code === 'SUPER_ADMIN');

    if (isSuperAdmin) {
      return this.modules.filter((m) => m.isActive !== false);
    }

    const userRoleCodes = new Set<string>((user.roles || []).map((r) => (r.code || r.name || '').toUpperCase()));
    const userPermissions = new Set<string>();
    user.roles?.forEach((role) => {
      role.permissions?.forEach((p) => userPermissions.add(p.name));
    });

    return this.modules.filter((feature) => {
      // Must be active
      if (feature.isActive === false) return false;

      // Check role code bindings
      if (feature.allowedRoleCodes && feature.allowedRoleCodes.length > 0) {
        const hasRole = feature.allowedRoleCodes.some((code) => userRoleCodes.has(code.toUpperCase()));
        if (hasRole) return true;
      }

      // Check permission bindings
      if (feature.requiredPermission) {
        return userPermissions.has(feature.requiredPermission);
      }

      // If no permission and no specific role specified, accessible to all logged in users
      if (!feature.allowedRoleCodes || feature.allowedRoleCodes.length === 0) {
        return true;
      }

      return false;
    });
  }

  createModule(dto: CreateFeatureDto): FeatureModule {
    const cleanId = dto.id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (this.modules.some((m) => m.id === cleanId)) {
      throw new Error(`Module with ID '${cleanId}' already exists.`);
    }

    const newModule: FeatureModule = {
      id: cleanId,
      code: dto.code ? dto.code.trim().toUpperCase() : `FEATURE_${cleanId.toUpperCase().replace(/-/g, '_')}`,
      title: dto.title.trim(),
      description: dto.description?.trim() || '',
      icon: dto.icon?.trim() || 'fa-solid fa-layer-group',
      color: dto.color?.trim() || 'from-sky-500 to-cyan-600',
      badge: dto.badge?.trim() || dto.category || 'Feature',
      category: dto.category || 'Monitoring',
      requiredPermission: dto.requiredPermission?.trim() || undefined,
      allowedRoleCodes: dto.allowedRoleCodes || [],
      status: dto.status || 'active',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    };

    this.modules.push(newModule);
    this.saveModules();
    this.logger.log(`Created new dashboard feature module: ${newModule.id} (${newModule.title})`);
    return newModule;
  }

  updateModule(id: string, dto: UpdateFeatureDto): FeatureModule {
    const index = this.modules.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Module with ID '${id}' not found.`);
    }

    const current = this.modules[index];
    const updated: FeatureModule = {
      ...current,
      title: dto.title !== undefined ? dto.title.trim() : current.title,
      code: dto.code !== undefined ? dto.code.trim().toUpperCase() : current.code,
      description: dto.description !== undefined ? dto.description.trim() : current.description,
      icon: dto.icon !== undefined ? dto.icon.trim() : current.icon,
      color: dto.color !== undefined ? dto.color.trim() : current.color,
      badge: dto.badge !== undefined ? dto.badge.trim() : current.badge,
      category: dto.category !== undefined ? dto.category : current.category,
      requiredPermission: dto.requiredPermission !== undefined ? (dto.requiredPermission.trim() || undefined) : current.requiredPermission,
      allowedRoleCodes: dto.allowedRoleCodes !== undefined ? dto.allowedRoleCodes : current.allowedRoleCodes,
      status: dto.status !== undefined ? dto.status : current.status,
      isActive: dto.isActive !== undefined ? dto.isActive : current.isActive,
    };

    this.modules[index] = updated;
    this.saveModules();
    this.logger.log(`Updated dashboard feature module: ${id}`);
    return updated;
  }

  deleteModule(id: string): { success: boolean; message: string } {
    const index = this.modules.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Module with ID '${id}' not found.`);
    }

    const removed = this.modules.splice(index, 1);
    this.saveModules();
    this.logger.log(`Deleted dashboard feature module: ${id}`);
    return { success: true, message: `Module '${removed[0]?.title || id}' deleted successfully.` };
  }

  resetToDefaults(): FeatureModule[] {
    this.modules = JSON.parse(JSON.stringify(FEATURE_MODULES_REGISTRY));
    this.saveModules();
    this.logger.log(`Reset all feature modules to default registry.`);
    return this.modules;
  }
}
