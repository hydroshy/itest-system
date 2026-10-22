import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../database/dynamic-database.module';
import { RealtimeModule } from '../realtime/modules/realtime/realtime.module';
import { PluginStorageService } from './plugin-storage.service';
import { PluginManagerService } from './plugin-manager.service';
import { PluginManagerController } from './plugin-manager.controller';
import { LorawanChirpstackAdapterController } from './lorawan-chirpstack.adapter.controller';
import { MemmapManagerAdapterController } from './memmap-manager.adapter.controller';
import { FinalConfigAdapterController } from './final-config.adapter.controller';
import { TraceabilityAdapterController } from './traceability.adapter.controller';

@Module({
  imports: [DynamicDatabaseModule, RealtimeModule],
  controllers: [
    PluginManagerController,
    LorawanChirpstackAdapterController,
    MemmapManagerAdapterController,
    FinalConfigAdapterController,
    TraceabilityAdapterController,
  ],
  providers: [PluginStorageService, PluginManagerService],
  exports: [PluginStorageService, PluginManagerService],
})
export class PluginManagementModule {}

