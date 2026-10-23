import { Module } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../../database/dynamic-database.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
