import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';
import { ItemCodesController } from './item-codes.controller';
import { ItemCodesService } from './item-codes.service';
import { ItemCodesRepository } from './item-codes.repository';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [ItemCodesController],
  providers: [ItemCodesRepository, ItemCodesService],
  exports: [ItemCodesService, ItemCodesRepository],
})
export class ItemCodesModule {}
