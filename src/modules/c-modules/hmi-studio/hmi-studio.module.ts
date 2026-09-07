import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';
import { HmiStudioService } from './hmi-studio.service';
import { HmiStudioController } from './hmi-studio.controller';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [HmiStudioController],
  providers: [HmiStudioService],
  exports: [HmiStudioService],
})
export class HmiStudioModule {}
