import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../../database/dynamic-database.module';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';

@Module({
  imports: [DynamicDatabaseModule],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
