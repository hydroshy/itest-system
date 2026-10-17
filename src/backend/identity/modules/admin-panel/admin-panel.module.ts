import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../../database/dynamic-database.module';
import { AdminPanelService } from './admin-panel.service';
import { AdminPanelController } from './admin-panel.controller';

@Module({
  imports: [DynamicDatabaseModule],
  providers: [AdminPanelService],
  controllers: [AdminPanelController],
  exports: [AdminPanelService],
})
export class AdminPanelModule {}
