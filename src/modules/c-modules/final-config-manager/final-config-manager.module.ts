import { Module } from '@nestjs/common';
import { CreateFinalConfigModule } from '../create-final-config/create-final-config.module';
import { FinalConfigManagerRepository } from './final-config-manager.repository';
import { FinalConfigManagerService } from './final-config-manager.service';
import { FinalConfigManagerController } from './final-config-manager.controller';

@Module({
  imports: [CreateFinalConfigModule],
  controllers: [FinalConfigManagerController],
  providers: [FinalConfigManagerRepository, FinalConfigManagerService],
  exports: [FinalConfigManagerRepository, FinalConfigManagerService],
})
export class FinalConfigManagerModule {}
