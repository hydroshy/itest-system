import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { User, UserType } from '../users/entities/user.entity';
import { DModule, DEFAULT_D_MODULES, RoleLayoutConfig } from './d-module-registry';
import { DynamicDatabaseService } from '../database/dynamic-database.service';

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
  private readonly configPath = process.env.DASHBOARD_MODULES_CONFIG_PATH || path.join(process.cwd(), 'config', 'dashboard-modules.json');
  private modules: DModule[] = [];
  private roleLayouts: Record<string, RoleLayoutConfig> = {};

  constructor(@Optional() private readonly dbService?: DynamicDatabaseService) {}

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
        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch (parseErr: any) {
          // JSON parse failed — keep existing in-memory state, do NOT reset to defaults
          this.logger.error(`Config JSON parse error (keeping in-memory state): ${parseErr.message}`);
          return;
        }

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

        // Auto-merge any built-in DEFAULT_D_MODULES missing from disk config
        let hasNewDefault = false;
        for (const def of DEFAULT_D_MODULES) {
          if (!this.modules.some((m) => m.id === def.id || m.code === def.code)) {
            this.modules.push(JSON.parse(JSON.stringify(def)));
            hasNewDefault = true;
          }
        }
        if (hasNewDefault) {
          for (const layout of Object.values(this.roleLayouts)) {
            for (const def of DEFAULT_D_MODULES) {
              if (
                !layout.moduleOrder.includes(def.id) &&
                !layout.disabledModuleIds.includes(def.id)
              ) {
                layout.moduleOrder.push(def.id);
              }
            }
          }
          this.saveModules();
        }

        this.logger.log(`Loaded ${this.modules.length} D-Modules and ${Object.keys(this.roleLayouts).length} Role Layouts from config.`);
        return;
      }

      // Config file does not exist yet — initialize defaults and save
      this.modules = JSON.parse(JSON.stringify(DEFAULT_D_MODULES));
      this.roleLayouts = {};
      this.saveModules();
      this.logger.log(`Initialized default ${this.modules.length} D-Modules.`);
    } catch (err: any) {
      // Only log the error — do NOT overwrite existing in-memory state or reset to defaults
      this.logger.error(`Error loading D-Modules config: ${err.message}`, err.stack);
      // Only set defaults if modules is genuinely empty (first load)
      if (this.modules.length === 0) {
        this.modules = JSON.parse(JSON.stringify(DEFAULT_D_MODULES));
        this.roleLayouts = {};
      }
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

  async getModbusProfiles(): Promise<any[]> {
    if (this.dbService) {
      try {
        const ds = this.dbService.getDataSourceForTable('modbus_memmap_profiles');
        const rows = await ds.query(
          `SELECT DISTINCT sku, firmware_version, profile_name, description FROM public.modbus_memmap_profiles ORDER BY sku ASC, firmware_version ASC;`,
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return rows;
        }
      } catch (e) {}
    }
    return [
      {
        sku: 'WSL-AMBIENT',
        firmware_version: 1,
        profile_name: 'Daviteq WSL Ambient T&H Sensor',
        description: 'Ambient Temperature, Humidity, Barometer, Light, Battery',
      },
      {
        sku: 'WSL-LEVEL',
        firmware_version: 1,
        profile_name: 'Daviteq WSL Hydrostatic Level Sensor',
        description: 'Liquid Level, Water Temperature, Sensor Status, Battery',
      },
      {
        sku: 'ENERGY-METER-3P',
        firmware_version: 1,
        profile_name: '3-Phase Industrial Energy Meter',
        description: 'Voltage L1-L3, Current L1-L3, Active Power, Power Factor, Frequency',
      },
      {
        sku: 'MODBUS-IO-MODULE',
        firmware_version: 1,
        profile_name: 'Daviteq Modbus IO Module',
        description: 'Digital Inputs, Relay Outputs, 4-20mA / 0-10V Analog Inputs',
      },
    ];
  }

  async getModbusRegisters(sku: string, firmwareVersion: number = 1): Promise<any[]> {
    if (this.dbService && sku) {
      try {
        const ds = this.dbService.getDataSourceForTable('modbus_memmap_registers');
        const cleanSku = sku.replace(/'/g, "''");
        const fw = Number(firmwareVersion) || 1;
        const rows = await ds.query(`
          SELECT 
            r.id,
            r.row_order,
            r.reg_no,
            r.is_enabled AS check,
            COALESCE(p.slave_id, 1) AS slave,
            r.fc_read AS fc,
            r.register_address AS reg,
            r.num_registers AS numreg,
            r.format,
            r.description AS parameter,
            COALESCE(r.comment, '') AS description,
            r.val_range AS range,
            r.default_value AS valuetowrite,
            r.is_writable AS iswritable,
            r.endianness,
            r.comment
          FROM public.modbus_memmap_registers r
          LEFT JOIN public.modbus_memmap_profiles p
            ON r.sku = p.sku AND r.firmware_version = p.firmware_version
          WHERE r.sku = '${cleanSku}' AND r.firmware_version = ${fw}
          ORDER BY r.row_order ASC, r.register_address ASC;
        `);
        if (Array.isArray(rows) && rows.length > 0) {
          return rows;
        }
      } catch (e) {}
    }

    return this.getBuiltinRegisters(sku);
  }

  private getBuiltinRegisters(sku: string): any[] {
    const s = (sku || '').toUpperCase();
    if (s.includes('LEVEL')) {
      return [
        { id: 1, row_order: 1, reg_no: 1, check: true, slave: 1, fc: 4, reg: 0, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Liquid Level / Depth', range: '0 ~ 10.0 m', valuetowrite: '', iswritable: false },
        { id: 2, row_order: 2, reg_no: 2, check: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Water Temperature', range: '-10 ~ 60 °C', valuetowrite: '', iswritable: false },
        { id: 3, row_order: 3, reg_no: 3, check: true, slave: 1, fc: 4, reg: 4, numreg: 1, format: 'UInt16', endianness: 'Big-Endian', parameter: 'Sensor Status Code', range: '0: OK', valuetowrite: '', iswritable: false },
        { id: 4, row_order: 4, reg_no: 4, check: true, slave: 1, fc: 4, reg: 5, numreg: 1, format: 'UInt16', endianness: 'Big-Endian', parameter: 'Battery Voltage', range: '2500 ~ 3600 mV', valuetowrite: '', iswritable: false },
        { id: 5, row_order: 5, reg_no: 5, check: true, slave: 1, fc: 3, reg: 50, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Zero Level Calibration', range: '-5.0 ~ 5.0 m', valuetowrite: '0.0', iswritable: true },
        { id: 6, row_order: 6, reg_no: 6, check: true, slave: 1, fc: 3, reg: 52, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'High Alarm Threshold', range: '0 ~ 10.0 m', valuetowrite: '8.5', iswritable: true },
      ];
    }
    if (s.includes('ENERGY') || s.includes('METER')) {
      return [
        { id: 1, row_order: 1, reg_no: 1, check: true, slave: 1, fc: 3, reg: 0, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Phase A Voltage', range: 'V', valuetowrite: '', iswritable: false },
        { id: 2, row_order: 2, reg_no: 2, check: true, slave: 1, fc: 3, reg: 2, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Phase B Voltage', range: 'V', valuetowrite: '', iswritable: false },
        { id: 3, row_order: 3, reg_no: 3, check: true, slave: 1, fc: 3, reg: 4, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Phase C Voltage', range: 'V', valuetowrite: '', iswritable: false },
        { id: 4, row_order: 4, reg_no: 4, check: true, slave: 1, fc: 3, reg: 6, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Phase A Current', range: 'A', valuetowrite: '', iswritable: false },
        { id: 5, row_order: 5, reg_no: 5, check: true, slave: 1, fc: 3, reg: 8, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Phase B Current', range: 'A', valuetowrite: '', iswritable: false },
        { id: 6, row_order: 6, reg_no: 6, check: true, slave: 1, fc: 3, reg: 10, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Phase C Current', range: 'A', valuetowrite: '', iswritable: false },
        { id: 7, row_order: 7, reg_no: 7, check: true, slave: 1, fc: 3, reg: 12, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Total Active Power', range: 'kW', valuetowrite: '', iswritable: false },
        { id: 8, row_order: 8, reg_no: 8, check: true, slave: 1, fc: 3, reg: 14, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Power Factor', range: '0.0 ~ 1.0', valuetowrite: '', iswritable: false },
        { id: 9, row_order: 9, reg_no: 9, check: true, slave: 1, fc: 3, reg: 16, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Grid Frequency', range: 'Hz', valuetowrite: '', iswritable: false },
      ];
    }
    if (s.includes('IO') || s.includes('TRANSCEIVER')) {
      return [
        { id: 1, row_order: 1, reg_no: 1, check: true, slave: 1, fc: 1, reg: 0, numreg: 1, format: 'Boolean', endianness: 'Big-Endian', parameter: 'DO 1 (Relay Output 1)', range: '0 / 1', valuetowrite: '1', iswritable: true },
        { id: 2, row_order: 2, reg_no: 2, check: true, slave: 1, fc: 1, reg: 1, numreg: 1, format: 'Boolean', endianness: 'Big-Endian', parameter: 'DO 2 (Relay Output 2)', range: '0 / 1', valuetowrite: '0', iswritable: true },
        { id: 3, row_order: 3, reg_no: 3, check: true, slave: 1, fc: 2, reg: 0, numreg: 1, format: 'Boolean', endianness: 'Big-Endian', parameter: 'DI 1 (Digital Input 1)', range: '0 / 1', valuetowrite: '', iswritable: false },
        { id: 4, row_order: 4, reg_no: 4, check: true, slave: 1, fc: 2, reg: 1, numreg: 1, format: 'Boolean', endianness: 'Big-Endian', parameter: 'DI 2 (Digital Input 2)', range: '0 / 1', valuetowrite: '', iswritable: false },
        { id: 5, row_order: 5, reg_no: 5, check: true, slave: 1, fc: 4, reg: 0, numreg: 1, format: 'UInt16', endianness: 'Big-Endian', parameter: 'AI 1 (4-20mA Raw ADC)', range: '0 ~ 4095', valuetowrite: '', iswritable: false },
        { id: 6, row_order: 6, reg_no: 6, check: true, slave: 1, fc: 4, reg: 1, numreg: 1, format: 'UInt16', endianness: 'Big-Endian', parameter: 'AI 2 (0-10V Raw ADC)', range: '0 ~ 4095', valuetowrite: '', iswritable: false },
        { id: 7, row_order: 7, reg_no: 7, check: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'UInt32', endianness: 'Big-Endian', parameter: 'Pulse Counter 1', range: '0 ~ 4294967295', valuetowrite: '', iswritable: false },
      ];
    }
    // Default: WSL-AMBIENT
    return [
      { id: 1, row_order: 1, reg_no: 1, check: true, slave: 1, fc: 4, reg: 0, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Ambient Temperature', range: '-40 ~ 85 °C', valuetowrite: '', iswritable: false },
      { id: 2, row_order: 2, reg_no: 2, check: true, slave: 1, fc: 4, reg: 2, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Relative Humidity', range: '0 ~ 100 %RH', valuetowrite: '', iswritable: false },
      { id: 3, row_order: 3, reg_no: 3, check: true, slave: 1, fc: 4, reg: 4, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Barometric Pressure', range: '300 ~ 1100 hPa', valuetowrite: '', iswritable: false },
      { id: 4, row_order: 4, reg_no: 4, check: true, slave: 1, fc: 4, reg: 6, numreg: 2, format: 'Float32', endianness: 'Big-Endian', parameter: 'Illuminance / Light', range: '0 ~ 65535 Lux', valuetowrite: '', iswritable: false },
      { id: 5, row_order: 5, reg_no: 5, check: true, slave: 1, fc: 4, reg: 8, numreg: 1, format: 'UInt16', endianness: 'Big-Endian', parameter: 'Battery Voltage', range: '2500 ~ 3600 mV', valuetowrite: '', iswritable: false },
      { id: 6, row_order: 6, reg_no: 6, check: true, slave: 1, fc: 3, reg: 100, numreg: 1, format: 'UInt16', endianness: 'Big-Endian', parameter: 'Transmission Interval', range: '10 ~ 86400 s', valuetowrite: '60', iswritable: true },
      { id: 7, row_order: 7, reg_no: 7, check: true, slave: 1, fc: 3, reg: 101, numreg: 1, format: 'UInt16', endianness: 'Big-Endian', parameter: 'Modbus Slave Address', range: '1 ~ 247', valuetowrite: '1', iswritable: true },
    ];
  }
}
