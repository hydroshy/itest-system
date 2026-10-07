import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
export declare class UsersService {
    private readonly dbService;
    constructor(dbService: DynamicDatabaseService);
    private getUserRepo;
    private getRoleRepo;
    private getPermissionRepo;
    createUser(dto: CreateUserDto, creator: User): Promise<User>;
    findAllUsers(): Promise<User[]>;
    findOneUser(id: string): Promise<User>;
    updateUserPermissions(id: string, dto: UpdateUserPermissionsDto): Promise<User>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
