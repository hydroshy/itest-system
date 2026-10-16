import { SubsystemHealthStatus } from '../common/subsystem.types';
import { UsersService } from './modules/users/users.service';
import { RolesService } from './modules/roles-permissions/roles.service';
export declare class IdentityDiagnosticService {
    private readonly usersService;
    private readonly rolesService;
    private readonly logger;
    constructor(usersService: UsersService, rolesService: RolesService);
    checkHealth(): Promise<SubsystemHealthStatus>;
}
