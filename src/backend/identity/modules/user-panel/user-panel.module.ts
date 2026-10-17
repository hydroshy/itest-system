import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../../database/dynamic-database.module';
import { UserPanelService } from './user-panel.service';
import { UserPanelController } from './user-panel.controller';

@Module({
  imports: [DynamicDatabaseModule],
  providers: [UserPanelService],
  controllers: [UserPanelController],
  exports: [UserPanelService],
})
export class UserPanelModule {}
