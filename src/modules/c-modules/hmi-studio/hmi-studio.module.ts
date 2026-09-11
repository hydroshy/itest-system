import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';
import { NetworkServersModule } from '../../network-servers/network-servers.module';
import { HmiStudioService } from './hmi-studio.service';
import { HmiStudioController } from './hmi-studio.controller';

@Module({
  imports: [DynamicDatabaseModule, NetworkServersModule],
  controllers: [HmiStudioController],
  providers: [HmiStudioService],
  exports: [HmiStudioService],
})
export class HmiStudioModule {}
