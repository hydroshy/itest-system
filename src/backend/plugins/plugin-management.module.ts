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
import { DisManagerAdapterController } from './dis-manager.adapter.controller';
import { TestingAdapterController } from './testing.adapter.controller';
import { DisClientService } from './dis-client/dis-client.service';

@Module({
  imports: [DynamicDatabaseModule, RealtimeModule],
  controllers: [
    PluginManagerController,
    LorawanChirpstackAdapterController,
    MemmapManagerAdapterController,
    FinalConfigAdapterController,
    TraceabilityAdapterController,
    DisManagerAdapterController,
    TestingAdapterController,
  ],
  providers: [PluginStorageService, PluginManagerService, DisClientService],
  exports: [PluginStorageService, PluginManagerService, DisClientService],
})
export class PluginManagementModule {}

