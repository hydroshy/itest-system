import { OnModuleInit, OnApplicationBootstrap } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { User, UserType } from '../users/entities/user.entity';
import { RolesService } from '../roles-permissions/roles.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService implements OnModuleInit, OnApplicationBootstrap {
    private readonly dbService;
    private readonly jwtService;
    private readonly rolesService;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService, jwtService: JwtService, rolesService: RolesService);
    private getUserRepository;
    onModuleInit(): Promise<void>;
    onApplicationBootstrap(): Promise<void>;
    seedAdminUser(): Promise<void>;
    validateUser(usernameOrEmail: string, pass: string): Promise<User>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
            fullName: string;
            userType: UserType;
            roles: string[];
        };
    }>;
    registerInitialAdmin(username?: string, email?: string, pass?: string): Promise<{
        success: boolean;
        message: string;
        user: {
            id: string;
            username: string;
            email: string;
            userType: UserType;
            roles: string[];
        };
    }>;
}
