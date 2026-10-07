export interface CModule {
    id: string;
    code: string;
    title: string;
    description: string;
    icon: string;
    category: 'Governance' | 'Infrastructure' | 'Security' | 'Developer';
    routeHash: string;
    requiredPermission?: string;
}
export declare const C_MODULES_REGISTRY: CModule[];
