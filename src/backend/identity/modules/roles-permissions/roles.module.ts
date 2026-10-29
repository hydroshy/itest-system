import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../../database/dynamic-database.module';
import { MenuModule } from '../menu/menu.module';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [DynamicDatabaseModule, MenuModule],
  providers: [RolesService],
  controllers: [RolesController, PermissionsController],
  exports: [RolesService],
})
export class RolesModule {}

