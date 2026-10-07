import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { User } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(dto: CreateUserDto, creator: User): Promise<User>;
    findAllUsers(): Promise<User[]>;
    findOneUser(id: string): Promise<User>;
    updateUserPermissions(id: string, dto: UpdateUserPermissionsDto): Promise<User>;
    deleteUser(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
