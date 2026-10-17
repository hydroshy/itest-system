import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../database/dynamic-database.module';
import { RealtimeModule } from '../realtime/modules/realtime/realtime.module';
import { PluginStorageService } from './plugin-storage.service';
import { PluginManagerService } from './plugin-manager.service';
import { PluginManagerController } from './plugin-manager.controller';

@Module({
  imports: [DynamicDatabaseModule, RealtimeModule],
  controllers: [PluginManagerController],
  providers: [PluginStorageService, PluginManagerService],
  exports: [PluginStorageService, PluginManagerService],
})
export class PluginManagementModule {}

