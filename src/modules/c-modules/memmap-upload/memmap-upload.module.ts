import { Module } from '@nestjs/common';
import { MemmapUploadController } from './memmap-upload.controller';
import { MemmapUploadService } from './memmap-upload.service';
import { MemmapUploadRepository } from './memmap-upload.repository';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [MemmapUploadController],
  providers: [MemmapUploadService, MemmapUploadRepository],
  exports: [MemmapUploadService, MemmapUploadRepository],
})
export class MemmapUploadModule {}
