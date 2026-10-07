import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { InitSuperAdminDto } from './dto/init-superadmin.dto';
import { User } from '../users/entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, res: Response): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            userType: import("../users/entities/user.entity").UserType;
            roles: string[];
        };
    }>;
    logout(req: Request, res: Response): Promise<any>;
    getProfile(user: User): Promise<{
        id: string;
        username: string;
        email: string;
        fullName: string;
        userType: import("../users/entities/user.entity").UserType;
        roles: import("../../backend").Role[];
    }>;
    initSuperAdmin(body?: InitSuperAdminDto): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            username: string;
            email: string;
            userType: import("../users/entities/user.entity").UserType;
            roles: string[];
        };
    }>;
}
