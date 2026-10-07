import { OnModuleInit } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { DModule, RoleLayoutConfig } from './d-module-registry';
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
export interface UpdateDModuleDto extends Partial<CreateDModuleDto> {
}
export interface SaveRoleLayoutDto {
    moduleOrder?: string[];
    moduleIds?: string[];
    moduleSpans?: Record<string, number>;
    disabledModuleIds?: string[];
}
export declare class DModulesService implements OnModuleInit {
    private readonly dbService?;
    private readonly logger;
    private readonly configPath;
    private modules;
    private roleLayouts;
    constructor(dbService?: DynamicDatabaseService);
    onModuleInit(): void;
    private loadModules;
    private saveModules;
    getAllModules(): DModule[];
    getAllRoleLayouts(): Record<string, RoleLayoutConfig>;
    getAllRoleLayoutsSimple(): Record<string, any>;
    getRoleLayout(roleCode: string): RoleLayoutConfig;
    saveRoleLayout(roleCode: string, dto: SaveRoleLayoutDto | any): RoleLayoutConfig;
    resetRoleLayout(roleCode: string): RoleLayoutConfig;
    getAccessibleModules(user: User): DModule[];
    createModule(dto: CreateDModuleDto): DModule;
    updateModule(id: string, dto: UpdateDModuleDto): DModule;
    deleteModule(id: string): {
        success: boolean;
        message: string;
    };
    resetToDefaults(): DModule[];
    getModbusProfiles(): Promise<any[]>;
    getModbusRegisters(sku: string, firmwareVersion?: number): Promise<any[]>;
    private getBuiltinRegisters;
}
