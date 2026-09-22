import { Module } from '@nestjs/common';
import { SensorTypesController } from './sensor-types.controller';
import { SensorTypesService } from './sensor-types.service';
import { SensorTypesRepository } from './sensor-types.repository';

@Module({
  controllers: [SensorTypesController],
  providers: [SensorTypesRepository, SensorTypesService],
  exports: [SensorTypesService, SensorTypesRepository],
})
export class SensorTypesModule {}
