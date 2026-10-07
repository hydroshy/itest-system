import { Role } from '../../roles-permissions/entities/role.entity';
export declare enum UserType {
    ADMIN = "ADMIN",
    SUB_ADMIN = "SUB_ADMIN",
    USER = "USER"
}
export declare class User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    fullName: string;
    userType: UserType;
    isActive: boolean;
    createdById: string;
    roles: Role[];
    createdAt: Date;
    updatedAt: Date;
}
