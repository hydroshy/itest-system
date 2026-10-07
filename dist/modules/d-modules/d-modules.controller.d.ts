import { User } from '../users/entities/user.entity';
import { DModulesService, CreateDModuleDto, UpdateDModuleDto, SaveRoleLayoutDto } from './d-modules.service';
export declare class DModulesController {
    private readonly dModulesService;
    constructor(dModulesService: DModulesService);
    getSerialProfiles(): Promise<any[]>;
    getSerialRegisters(sku: string, firmwareVersion?: number): Promise<any[]>;
    getAccessibleModules(user: User): import("./d-module-registry").DModule[];
    getAllModules(): import("./d-module-registry").DModule[];
    getAllRoleLayouts(): Record<string, import("./d-module-registry").RoleLayoutConfig>;
    getRoleLayout(roleCode: string): import("./d-module-registry").RoleLayoutConfig;
    saveRoleLayout(roleCode: string, dto: SaveRoleLayoutDto): import("./d-module-registry").RoleLayoutConfig;
    resetRoleLayout(roleCode: string): import("./d-module-registry").RoleLayoutConfig;
    createModule(dto: CreateDModuleDto): import("./d-module-registry").DModule;
    updateModule(id: string, dto: UpdateDModuleDto): import("./d-module-registry").DModule;
    deleteModule(id: string): {
        success: boolean;
        message: string;
    };
    resetDefaults(): import("./d-module-registry").DModule[];
}
