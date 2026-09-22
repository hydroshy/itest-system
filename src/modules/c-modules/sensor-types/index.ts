export * from './entities/sensor-type.entity';
export * from './dto/sensor-type.dto';
export * from './sensor-types.repository';
export * from './sensor-types.service';
export * from './sensor-types.controller';
export * from './sensor-types.module';

export const C_SENSOR_TYPES = {
  id: 'c-sensor-types',
  code: 'C_MOD_SENSOR_TYPES',
  title: 'LoRaWAN Sensor Types',
  description: 'Manage LoRaWAN Sensor Type codes (e.g. 71 -> WSLRW-LKS) mapped to hardware SKUs, regions, and classes.',
};
