import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseSubsystemModule } from './database/dynamic-database.module';
import { IdentitySubsystemModule } from './identity/identity-subsystem.module';
import { RealtimeSubsystemModule } from './realtime/realtime-subsystem.module';
import { PluginManagementModule } from './plugins/plugin-management.module';
import { BackendDiagnosticsController } from './backend-diagnostics.controller';
import { SubsystemDebugInterceptor } from './common/subsystem-debug.interceptor';

/**
 * Root Backend Domain Aggregator Module
 * Encapsulates core backend backbone subsystems and provides global domain-level debugging & diagnostics.
 */
@Module({
  imports: [
    DatabaseSubsystemModule,
    IdentitySubsystemModule,
    RealtimeSubsystemModule,
    PluginManagementModule,
  ],
  controllers: [BackendDiagnosticsController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: SubsystemDebugInterceptor,
    },
  ],
  exports: [
    DatabaseSubsystemModule,
    IdentitySubsystemModule,
    RealtimeSubsystemModule,
    PluginManagementModule,
  ],
})
export class BackendModule {}
