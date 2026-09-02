import { Module } from '@nestjs/common';
import { DModulesController } from './d-modules.controller';
import { DModulesService } from './d-modules.service';

@Module({
  controllers: [DModulesController],
  providers: [DModulesService],
  exports: [DModulesService],
})
export class DModulesModule {}
