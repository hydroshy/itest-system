import { LorawanResilienceService } from '../services/lorawan-resilience.service';
export declare class PayloadFormatterService {
    private readonly resilienceService;
    private readonly logger;
    constructor(resilienceService: LorawanResilienceService);
    decodePayload(script: string, bytesHex: string, fPort?: number): Record<string, any>;
}
