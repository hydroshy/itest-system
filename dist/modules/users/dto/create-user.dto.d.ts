import { UserType } from '../entities/user.entity';
export declare class CreateUserDto {
    username: string;
    email?: string;
    password: string;
    fullName?: string;
    userType?: UserType;
    roleIds?: string[];
    permissionIds?: string[];
}
