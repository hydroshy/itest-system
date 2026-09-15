import { Module, Global } from '@nestjs/common';
import { LorawanService } from './lorawan.service';
import { LorawanController } from './lorawan.controller';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';
import { DeviceProvisioningService } from './services/device-provisioning.service';
import { LorawanResilienceService } from './services/lorawan-resilience.service';

@Global()
@Module({
  providers: [
    LorawanResilienceService,
    PayloadFormatterService,
    DeviceProvisioningService,
    LorawanService,
  ],
  controllers: [LorawanController],
  exports: [
    LorawanResilienceService,
    PayloadFormatterService,
    DeviceProvisioningService,
    LorawanService,
  ],
})
export class LorawanModule {}
