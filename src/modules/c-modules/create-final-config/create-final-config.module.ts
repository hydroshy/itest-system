import { Module } from '@nestjs/common';
import { CreateFinalConfigRepository } from './create-final-config.repository';
import { CreateFinalConfigService } from './create-final-config.service';
import { CreateFinalConfigController } from './create-final-config.controller';

@Module({
  controllers: [CreateFinalConfigController],
  providers: [CreateFinalConfigRepository, CreateFinalConfigService],
  exports: [CreateFinalConfigRepository, CreateFinalConfigService],
})
export class CreateFinalConfigModule {}
