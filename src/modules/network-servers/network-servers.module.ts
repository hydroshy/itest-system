import { Module } from '@nestjs/common';
import { NetworkServersService } from './network-servers.service';
import { NetworkServersController } from './network-servers.controller';
import { DynamicDatabaseModule } from '../database/dynamic-database.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DynamicDatabaseModule, RealtimeModule],
  controllers: [NetworkServersController],
  providers: [NetworkServersService],
  exports: [NetworkServersService],
})
export class NetworkServersModule {}
