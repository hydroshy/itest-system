import { Module } from '@nestjs/common';
import { AdminPanelService } from './admin-panel.service';
import { AdminPanelController } from './admin-panel.controller';

@Module({
  providers: [AdminPanelService],
  controllers: [AdminPanelController],
  exports: [AdminPanelService],
})
export class AdminPanelModule {}
