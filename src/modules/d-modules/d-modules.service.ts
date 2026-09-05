import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserType } from '../users/entities/user.entity';
import { DModule, DEFAULT_D_MODULES, RoleLayoutConfig } from './d-module-registry';

export interface CreateDModuleDto {
  id: string;
  code?: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge?: string;
  category: 'Monitoring' | 'Fleet' | 'Analytics' | 'System' | 'Reports' | 'Infrastructure' | 'Custom';
  requiredPermission?: string;
  allowedRoleCodes?: string[];
  status?: 'active' | 'ready' | 'beta';
  isActive?: boolean;
}

export interface UpdateDModuleDto extends Partial<CreateDModuleDto> {}

export interface SaveRoleLayoutDto {
  moduleOrder?: string[];
  moduleIds?: string[];
  moduleSpans?: Record<string, number>;
  disabledModuleIds?: string[];
}

@Injectable()
export class DModulesService implements OnModuleInit {
  private readonly logger = new Logger(DModulesService.name);
  private readonly configPath = path.join(process.cwd(), 'config', 'dashboard-modules.json');
  private modules: DModule[] = [];
  private roleLayouts: Record<string, RoleLayoutConfig> = {};

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

        // Handle both formats: array or object with modules & roleLayouts
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.modules = parsed;
          this.roleLayouts = {};
        } else if (parsed && typeof parsed === 'object') {
          this.modules = Array.isArray(parsed.modules) ? parsed.modules : JSON.parse(JSON.stringify(DEFAULT_D_MODULES));
          if (parsed.roleLayouts && typeof parsed.roleLayouts === 'object') {
            for (const [code, val] of Object.entries(parsed.roleLayouts)) {
              if (Array.isArray(val)) {
                this.roleLayouts[code] = { roleCode: code, moduleOrder: val, disabledModuleIds: [] };
              } else if (val && typeof val === 'object') {
                this.roleLayouts[code] = val as RoleLayoutConfig;
              }
            }
          }
        }

        // Ensure all default modules exist
        for (const defMod of DEFAULT_D_MODULES) {
          if (!this.modules.some((m) => m.id === defMod.id)) {
            this.modules.push(JSON.parse(JSON.stringify(defMod)));
          }
        }

        this.logger.log(`Loaded ${this.modules.length} D-Modules and ${Object.keys(this.roleLayouts).length} Role Layouts from config.`);
        return;
      }

      // Default fallback
      this.modules = JSON.parse(JSON.stringify(DEFAULT_D_MODULES));
      this.roleLayouts = {};
      this.saveModules();
      this.logger.log(`Initialized default ${this.modules.length} D-Modules.`);
    } catch (err: any) {
      this.logger.error(`Error loading D-Modules: ${err.message}`, err.stack);
      this.modules = JSON.parse(JSON.stringify(DEFAULT_D_MODULES));
      this.roleLayouts = {};
    }
  }

  private saveModules() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      const dataToSave = {
        modules: this.modules,
        roleLayouts: this.roleLayouts,
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.configPath, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (err: any) {
      this.logger.error(`Failed to save D-Modules to ${this.configPath}: ${err.message}`);
    }
  }

  getAllModules(): DModule[] {
    return this.modules;
  }

  getAllRoleLayouts(): Record<string, RoleLayoutConfig> {
    return this.roleLayouts;
  }

  getAllRoleLayoutsSimple(): Record<string, any> {
    return this.roleLayouts;
  }

  getRoleLayout(roleCode: string): RoleLayoutConfig {
    const cleanCode = (roleCode || 'SUPER_ADMIN').trim().toUpperCase();
    if (this.roleLayouts[cleanCode]) {
      return this.roleLayouts[cleanCode];
    }
    // Return default order of active modules
    return {
      roleCode: cleanCode,
      moduleOrder: this.modules.filter((m) => m.isActive !== false).map((m) => m.id),
      disabledModuleIds: [],
    };
  }

  saveRoleLayout(roleCode: string, dto: SaveRoleLayoutDto | any): RoleLayoutConfig {
    const cleanCode = (roleCode || 'SUPER_ADMIN').trim().toUpperCase();
    let moduleOrder: string[] = [];
    let disabledModuleIds: string[] = [];
    let moduleSpans: Record<string, number> = {};

    if (Array.isArray(dto)) {
      moduleOrder = dto;
    } else if (dto && typeof dto === 'object') {
      if (Array.isArray(dto.moduleOrder)) moduleOrder = dto.moduleOrder;
      else if (Array.isArray(dto.moduleIds)) moduleOrder = dto.moduleIds;
      if (Array.isArray(dto.disabledModuleIds)) disabledModuleIds = dto.disabledModuleIds;
      if (dto.moduleSpans && typeof dto.moduleSpans === 'object') moduleSpans = dto.moduleSpans;
    }

    // Deduplicate module IDs strictly to avoid any duplicate cards in role layout
    const seen = new Set<string>();
    const deduplicatedOrder: string[] = [];
    for (const id of moduleOrder) {
      if (typeof id === 'string' && id.trim() && !seen.has(id.trim())) {
        seen.add(id.trim());
        deduplicatedOrder.push(id.trim());
      }
    }

    const config: RoleLayoutConfig = {
      roleCode: cleanCode,
      moduleOrder: deduplicatedOrder,
      moduleSpans,
      disabledModuleIds,
      updatedAt: new Date().toISOString(),
    };

    this.roleLayouts[cleanCode] = config;
    this.saveModules();
    this.logger.log(`Saved customized role layout for [${cleanCode}]: ${deduplicatedOrder.length} modules, spans=${Object.keys(moduleSpans).length}`);
    return config;
  }

  resetRoleLayout(roleCode: string): RoleLayoutConfig {
    const cleanCode = (roleCode || 'SUPER_ADMIN').trim().toUpperCase();
    delete this.roleLayouts[cleanCode];
    this.saveModules();
    this.logger.log(`Reset role layout for [${cleanCode}] to standard default.`);
    return this.getRoleLayout(cleanCode);
  }

  getAccessibleModules(user: User): DModule[] {
    const isSuperAdmin =
      user.userType === UserType.ADMIN ||
      String(user.userType).toUpperCase() === 'ADMIN' ||
      user.username === 'admin' ||
      user.roles?.some((r) => r.code === 'SUPER_ADMIN');

    let baseAccessible: DModule[] = [];

    if (isSuperAdmin) {
      baseAccessible = this.modules.filter((m) => m.isActive !== false);
    } else {
      const userRoleCodes = new Set<string>((user.roles || []).map((r) => (r.code || r.name || '').toUpperCase()));
      const userPermissions = new Set<string>();
      user.roles?.forEach((role) => {
        role.permissions?.forEach((p) => userPermissions.add(p.name));
      });

      baseAccessible = this.modules.filter((feature) => {
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

    // Determine matched layout for user role
    let matchedLayout: RoleLayoutConfig | undefined;
    if (isSuperAdmin && this.roleLayouts['SUPER_ADMIN']) {
      matchedLayout = this.roleLayouts['SUPER_ADMIN'];
    } else if (user.roles && user.roles.length > 0) {
      for (const r of user.roles) {
        const code = (r.code || r.name || '').toUpperCase();
        if (this.roleLayouts[code]) {
          matchedLayout = this.roleLayouts[code];
          break;
        }
      }
    }
    if (!matchedLayout && this.roleLayouts['SUPER_ADMIN']) {
      matchedLayout = this.roleLayouts['SUPER_ADMIN'];
    }

    if (!matchedLayout) {
      return baseAccessible.map((m) => ({
        ...m,
        span: (m as any).span || 1,
      }));
    }

    const moduleMap = new Map<string, DModule>();
    baseAccessible.forEach((m) => moduleMap.set(m.id, m));

    const disabledSet = new Set(matchedLayout.disabledModuleIds || []);
    const orderedList: DModule[] = [];

    if (Array.isArray(matchedLayout.moduleOrder)) {
      for (const modId of matchedLayout.moduleOrder) {
        if (!disabledSet.has(modId) && moduleMap.has(modId)) {
          const mod = moduleMap.get(modId)!;
          orderedList.push({
            ...mod,
            span: (matchedLayout.moduleSpans && matchedLayout.moduleSpans[modId]) || mod.span || 1,
          });
        }
      }
      return orderedList;
    }

    return baseAccessible.map((m) => ({
      ...m,
      span: (m as any).span || 1,
    }));
  }

  createModule(dto: CreateDModuleDto): DModule {
    const cleanId = dto.id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (this.modules.some((m) => m.id === cleanId)) {
      throw new Error(`Module with ID '${cleanId}' already exists.`);
    }

    const newModule: DModule = {
      id: cleanId,
      code: dto.code ? dto.code.trim().toUpperCase() : `D_MOD_${cleanId.toUpperCase().replace(/-/g, '_')}`,
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
    this.logger.log(`Created new Module: ${newModule.id} (${newModule.title})`);
    return newModule;
  }

  updateModule(id: string, dto: UpdateDModuleDto): DModule {
    const index = this.modules.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Module with ID '${id}' not found.`);
    }

    const current = this.modules[index];
    const updated: DModule = {
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
    this.logger.log(`Updated Module: ${id}`);
    return updated;
  }

  deleteModule(id: string): { success: boolean; message: string } {
    const index = this.modules.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error(`Module with ID '${id}' not found.`);
    }

    const removed = this.modules.splice(index, 1);
    // Also remove from any roleLayouts
    for (const rCode of Object.keys(this.roleLayouts)) {
      this.roleLayouts[rCode].moduleOrder = (this.roleLayouts[rCode].moduleOrder || []).filter((mid) => mid !== id);
      this.roleLayouts[rCode].disabledModuleIds = (this.roleLayouts[rCode].disabledModuleIds || []).filter((mid) => mid !== id);
      if (this.roleLayouts[rCode].moduleSpans) {
        delete this.roleLayouts[rCode].moduleSpans[id];
      }
    }

    this.saveModules();
    this.logger.log(`Deleted Module: ${id}`);
    return { success: true, message: `Module '${removed[0]?.title || id}' deleted successfully.` };
  }

  resetToDefaults(): DModule[] {
    this.modules = JSON.parse(JSON.stringify(DEFAULT_D_MODULES));
    this.roleLayouts = {};
    this.saveModules();
    this.logger.log(`Reset all Modules & Role Layouts to standard default registry.`);
    return this.modules;
  }
}
