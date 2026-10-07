import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { DecoderEntity } from './entities/decoder.entity';
import { CreateDecoderDto, UpdateDecoderDto, TestDecoderDto } from './dto/decoder.dto';
import { LorawanResilienceService } from '../../lorawan/services/lorawan-resilience.service';
export declare class DecoderService {
    private readonly dynamicDatabaseService;
    private readonly resilienceService;
    private readonly logger;
    constructor(dynamicDatabaseService: DynamicDatabaseService, resilienceService: LorawanResilienceService);
    private getRepository;
    findAll(): Promise<DecoderEntity[]>;
    findOne(id: string): Promise<DecoderEntity>;
    private validateJavaScriptCode;
    create(dto: CreateDecoderDto, author?: string): Promise<DecoderEntity>;
    update(id: string, dto: UpdateDecoderDto, author?: string): Promise<DecoderEntity>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    testDecode(dto: TestDecoderDto): {
        success: boolean;
        input: any;
        output?: any;
        error?: string;
    };
}
