export interface DModule {
    id: string;
    code: string;
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
    order?: number;
    span?: number;
}
export interface RoleLayoutConfig {
    roleCode: string;
    moduleOrder: string[];
    moduleSpans?: Record<string, number>;
    disabledModuleIds: string[];
    updatedAt?: string;
}
export declare const DEFAULT_D_MODULES: DModule[];
