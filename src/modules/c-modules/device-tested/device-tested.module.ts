import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DeviceTestedRepository } from './device-tested.repository';
import { DeviceTestedService } from './device-tested.service';
import { DeviceTestedController } from './device-tested.controller';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        fieldSize: 50 * 1024 * 1024, // 50MB cho form fields lớn
      },
    }),
  ],
  controllers: [DeviceTestedController],
  providers: [DeviceTestedRepository, DeviceTestedService],
  exports: [DeviceTestedRepository, DeviceTestedService],
})
export class DeviceTestedModule {}
