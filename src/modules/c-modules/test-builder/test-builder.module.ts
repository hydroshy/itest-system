import { Module } from '@nestjs/common';
import { TestBuilderController } from './test-builder.controller';
import { TestBuilderService } from './test-builder.service';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [TestBuilderController],
  providers: [TestBuilderService],
  exports: [TestBuilderService],
})
export class TestBuilderModule {}
