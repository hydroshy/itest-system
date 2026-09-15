import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { LorawanResilienceService } from '../services/lorawan-resilience.service';

@Injectable()
export class PayloadFormatterService {
  private readonly logger = new Logger(PayloadFormatterService.name);

  constructor(private readonly resilienceService: LorawanResilienceService) {}

  decodePayload(script: string, bytesHex: string, fPort: number = 1): Record<string, any> {
    const result = this.resilienceService.safeDecodePayload(script, bytesHex, fPort);
    if (!result.success) {
      this.logger.error(`Payload decode error: ${result.error}`);
      throw new BadRequestException(`Payload decoder execution failed: ${result.error}`);
    }
    return result.data || {};
  }
}
