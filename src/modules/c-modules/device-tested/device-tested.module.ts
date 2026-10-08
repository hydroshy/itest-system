import { Module } from '@nestjs/common';
import { DeviceTestedRepository } from './device-tested.repository';
import { DeviceTestedService } from './device-tested.service';
import { DeviceTestedController } from './device-tested.controller';

@Module({
  controllers: [DeviceTestedController],
  providers: [DeviceTestedRepository, DeviceTestedService],
  exports: [DeviceTestedRepository, DeviceTestedService],
})
export class DeviceTestedModule {}
