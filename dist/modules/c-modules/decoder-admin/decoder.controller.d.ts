import { DecoderService } from './decoder.service';
import { CreateDecoderDto, UpdateDecoderDto, TestDecoderDto } from './dto/decoder.dto';
export declare class DecoderController {
    private readonly decoderService;
    constructor(decoderService: DecoderService);
    findAll(): Promise<import(".").DecoderEntity[]>;
    findOne(id: string): Promise<import(".").DecoderEntity>;
    create(dto: CreateDecoderDto, req: any): Promise<import(".").DecoderEntity>;
    update(id: string, dto: UpdateDecoderDto, req: any): Promise<import(".").DecoderEntity>;
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
