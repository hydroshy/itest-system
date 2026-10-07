import { OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
export declare class RolesService implements OnModuleInit, OnApplicationBootstrap {
    private readonly dbService;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService);
    private getRoleRepo;
    private getPermissionRepo;
    onModuleInit(): Promise<void>;
    onApplicationBootstrap(): Promise<void>;
    seedDefaults(): Promise<void>;
    findAllRoles(): Promise<Role[]>;
    findOneRole(id: string): Promise<Role>;
    findAllPermissions(): Promise<Permission[]>;
    createRole(code: string, name: string, description: string, permissionIds: string[]): Promise<Role>;
    updateRole(id: string, name: string, description: string, permissionIds?: string[]): Promise<Role>;
    deleteRole(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
