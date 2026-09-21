import { Module } from '@nestjs/common';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';
import { SalesOrdersRepository } from './sales-orders.repository';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService, SalesOrdersRepository],
  exports: [SalesOrdersService, SalesOrdersRepository],
})
export class SalesOrdersModule {}
