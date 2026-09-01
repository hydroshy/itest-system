import { Module } from '@nestjs/common';
import { LorawanService } from './lorawan.service';
import { LorawanController } from './lorawan.controller';
import { PayloadFormatterService } from './payload-formatters/payload-formatter.service';

@Module({
  providers: [LorawanService, PayloadFormatterService],
  controllers: [LorawanController],
  exports: [LorawanService, PayloadFormatterService],
})
export class LorawanModule {}
