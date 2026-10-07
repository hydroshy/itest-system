import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    findAllRoles(): Promise<import("./entities/role.entity").Role[]>;
    findAllPermissions(): Promise<import("./entities/permission.entity").Permission[]>;
    findOneRole(id: string): Promise<import("./entities/role.entity").Role>;
    createRole(body: CreateRoleDto): Promise<import("./entities/role.entity").Role>;
    updateRole(id: string, body: UpdateRoleDto): Promise<import("./entities/role.entity").Role>;
    deleteRole(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
