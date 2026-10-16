import { Module } from '@nestjs/common';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { RealtimeDiagnosticService } from './realtime-diagnostic.service';

/**
 * Realtime Streaming Subsystem
 * Unifies WebSocket gateways and streaming broadcast events.
 */
@Module({
  imports: [RealtimeModule],
  providers: [RealtimeDiagnosticService],
  exports: [RealtimeModule, RealtimeDiagnosticService],
})
export class RealtimeSubsystemModule {}
