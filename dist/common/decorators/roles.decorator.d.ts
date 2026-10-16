import { UserType } from '../../backend/identity/modules/users/entities/user.entity';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: (UserType | string)[]) => import("@nestjs/common").CustomDecorator<string>;
