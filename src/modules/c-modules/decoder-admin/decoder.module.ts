import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';
import { DecoderController } from './decoder.controller';
import { DecoderService } from './decoder.service';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [DecoderController],
  providers: [DecoderService],
  exports: [DecoderService],
})
export class DecoderModule {}
