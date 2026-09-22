import { Injectable, Logger } from '@nestjs/common';
import { SubsystemHealthStatus, BackendSubsystem } from '../common/subsystem.types';
import { UsersService } from '../../modules/users/users.service';
import { RolesService } from '../../modules/roles-permissions/roles.service';

@Injectable()
export class IdentityDiagnosticService {
  private readonly logger = new Logger('IdentitySubsystem');

  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
  ) {}

  async checkHealth(): Promise<SubsystemHealthStatus> {
    try {
      const users = await this.usersService.findAllUsers();
      const roles = await this.rolesService.findAllRoles();
      const permissions = await this.rolesService.findAllPermissions();

      return {
        subsystem: BackendSubsystem.IDENTITY,
        status: 'UP',
        timestamp: new Date().toISOString(),
        details: {
          totalUsers: users.length,
          totalRoles: roles.length,
          totalPermissions: permissions.length,
          subsystemScope: [
            'JWT authentication & session validation',
            'RBAC permission evaluation',
            'User profile & credentials',
          ],
        },
        error: null,
      };
    } catch (err: any) {
      this.logger.error(`Identity diagnostic failed: ${err.message}`, err.stack);
      return {
        subsystem: BackendSubsystem.IDENTITY,
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }
}
