export declare class CreateRoleDto {
    code: string;
    name: string;
    description?: string;
    permissionIds?: string[];
}
export declare class UpdateRoleDto {
    name?: string;
    description?: string;
    permissionIds?: string[];
}
