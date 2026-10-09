import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';
import { MemmapManagerController } from './memmap-manager.controller';
import { MemmapManagerService } from './memmap-manager.service';
import { MemmapManagerRepository } from './memmap-manager.repository';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [MemmapManagerController],
  providers: [MemmapManagerService, MemmapManagerRepository],
  exports: [MemmapManagerService, MemmapManagerRepository],
})
export class MemmapManagerModule {}
