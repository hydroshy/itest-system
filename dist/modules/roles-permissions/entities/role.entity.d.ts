import { Permission } from './permission.entity';
export declare class Role {
    id: string;
    code: string;
    name: string;
    description: string;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
}
