import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseSubsystemModule } from './database/dynamic-database.module';
import { LorawanSubsystemModule } from './lorawan/lorawan-subsystem.module';
import { OrderManagementSubsystemModule } from './order-management/order-management.module';
import { TestAutomationSubsystemModule } from './test-automation/test-automation-subsystem.module';
import { IdentitySubsystemModule } from './identity/identity-subsystem.module';
import { IndustrialIotSubsystemModule } from './industrial-iot/industrial-iot-subsystem.module';
import { RealtimeSubsystemModule } from './realtime/realtime-subsystem.module';
import { BackendDiagnosticsController } from './backend-diagnostics.controller';
import { SubsystemDebugInterceptor } from './common/subsystem-debug.interceptor';

/**
 * Root Backend Domain Aggregator Module
 * Encapsulates all backend subsystems and provides global domain-level debugging & diagnostics.
 */
@Module({
  imports: [
    DatabaseSubsystemModule,
    LorawanSubsystemModule,
    OrderManagementSubsystemModule,
    TestAutomationSubsystemModule,
    IdentitySubsystemModule,
    IndustrialIotSubsystemModule,
    RealtimeSubsystemModule,
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
    LorawanSubsystemModule,
    OrderManagementSubsystemModule,
    TestAutomationSubsystemModule,
    IdentitySubsystemModule,
    IndustrialIotSubsystemModule,
    RealtimeSubsystemModule,
  ],
})
export class BackendModule {}
