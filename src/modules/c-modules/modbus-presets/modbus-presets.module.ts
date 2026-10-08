import { Module } from '@nestjs/common';
import { ModbusPresetsController } from './modbus-presets.controller';
import { ModbusPresetsService } from './modbus-presets.service';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';
import { CreateFinalConfigModule } from '../create-final-config/create-final-config.module';

@Module({
  imports: [DynamicDatabaseModule, CreateFinalConfigModule],
  controllers: [ModbusPresetsController],
  providers: [ModbusPresetsService],
  exports: [ModbusPresetsService],
})
export class ModbusPresetsModule {}
