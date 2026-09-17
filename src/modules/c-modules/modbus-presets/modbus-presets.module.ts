import { Module } from '@nestjs/common';
import { ModbusPresetsController } from './modbus-presets.controller';
import { ModbusPresetsService } from './modbus-presets.service';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';

@Module({
  imports: [DynamicDatabaseModule],
  controllers: [ModbusPresetsController],
  providers: [ModbusPresetsService],
  exports: [ModbusPresetsService],
})
export class ModbusPresetsModule {}
