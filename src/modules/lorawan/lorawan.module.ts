import { Module } from '@nestjs/common';
import { LorawanService } from './lorawan.service';
import { LorawanController } from './lorawan.controller';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';
import { DeviceProvisioningService } from './services/device-provisioning.service';

@Module({
  providers: [LorawanService, PayloadFormatterService, DeviceProvisioningService],
  controllers: [LorawanController],
  exports: [LorawanService, PayloadFormatterService, DeviceProvisioningService],
})
export class LorawanModule {}
