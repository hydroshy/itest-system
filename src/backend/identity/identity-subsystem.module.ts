import { Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { UsersModule } from '../../modules/users/users.module';
import { RolesModule } from '../../modules/roles-permissions/roles.module';
import { AdminPanelModule } from '../../modules/admin-panel/admin-panel.module';
import { UserPanelModule } from '../../modules/user-panel/user-panel.module';
import { IdentityDiagnosticService } from './identity-diagnostic.service';

/**
 * Identity & Access Control Subsystem
 * Unifies Authentication, Users, RBAC Permissions, and Administrative management.
 */
@Module({
  imports: [
    AuthModule,
    UsersModule,
    RolesModule,
    AdminPanelModule,
    UserPanelModule,
  ],
  providers: [IdentityDiagnosticService],
  exports: [
    AuthModule,
    UsersModule,
    RolesModule,
    AdminPanelModule,
    UserPanelModule,
    IdentityDiagnosticService,
  ],
})
export class IdentitySubsystemModule {}
