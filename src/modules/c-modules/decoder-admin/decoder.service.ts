import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { DecoderEntity } from './entities/decoder.entity';
import { CreateDecoderDto, UpdateDecoderDto, TestDecoderDto } from './dto/decoder.dto';
import { LorawanResilienceService } from '../../lorawan/services/lorawan-resilience.service';
import { cleanSku, resolveDecoderId } from '../../lorawan/common/lorawan-utils';

@Injectable()
export class DecoderService {
  private readonly logger = new Logger(DecoderService.name);

  constructor(
    private readonly dynamicDatabaseService: DynamicDatabaseService,
    private readonly resilienceService: LorawanResilienceService,
  ) {}

  private getRepository(): Repository<DecoderEntity> {
    return this.dynamicDatabaseService.getRepositoryForTable('decoder', DecoderEntity);
  }

  async findAll(): Promise<DecoderEntity[]> {
    const repo = this.getRepository();
    return await repo.find({
      order: {
        sku: 'ASC',
        firmwareVersion: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<DecoderEntity> {
    const repo = this.getRepository();
    const decoder = await repo.findOne({ where: { id } });
    if (!decoder) {
      throw new NotFoundException(`Decoder with ID '${id}' not found`);
    }
    return decoder;
  }

  private validateJavaScriptCode(code: string): void {
    const validation = this.resilienceService.validateJavaScript(code);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }
  }

  async create(dto: CreateDecoderDto, author?: string): Promise<DecoderEntity> {
    const repo = this.getRepository();
    const sku = cleanSku(dto.sku);
    if (!sku) {
      throw new BadRequestException('SKU must not be empty');
    }
    if (dto.firmwareVersion < 1 || dto.firmwareVersion > 32) {
      throw new BadRequestException('Firmware version must be an integer between 1 and 32');
    }

    // Validate JS syntax before saving to database
    this.validateJavaScriptCode(dto.decoderCode);

    // Standardized composite ID: `${sku}_${firmwareVersion}`
    const id = resolveDecoderId(sku, dto.firmwareVersion);
    if (!id) {
      throw new BadRequestException('Cannot generate valid decoder ID from SKU and firmware version');
    }

    const existing = await repo.findOne({ where: { id } });
    if (existing) {
      throw new ConflictException(
        `Decoder with ID '${id}' (SKU: ${sku}, FW: ${dto.firmwareVersion}) already exists. Please edit the existing record or change version.`,
      );
    }

    const decoder = repo.create({
      id,
      sku,
      firmwareVersion: dto.firmwareVersion,
      decoderCode: dto.decoderCode,
      description: dto.description || undefined,
      author: author || 'admin',
    });

    const saved = await repo.save(decoder);
    this.logger.log(`Created new LoRaWAN decoder: ${id}`);
    return saved;
  }

  async update(id: string, dto: UpdateDecoderDto, author?: string): Promise<DecoderEntity> {
    const repo = this.getRepository();
    const decoder = await this.findOne(id);

    if (dto.decoderCode !== undefined) {
      this.validateJavaScriptCode(dto.decoderCode);
      decoder.decoderCode = dto.decoderCode;
    }
    if (dto.description !== undefined) {
      decoder.description = dto.description;
    }
    if (author) {
      decoder.author = author;
    }

    const updated = await repo.save(decoder);
    this.logger.log(`Updated LoRaWAN decoder: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const repo = this.getRepository();
    const decoder = await this.findOne(id);
    await repo.remove(decoder);
    this.logger.log(`Deleted LoRaWAN decoder: ${id}`);
    return { success: true, message: `Decoder '${id}' was deleted successfully` };
  }

  testDecode(dto: TestDecoderDto): { success: boolean; input: any; output?: any; error?: string } {
    const res = this.resilienceService.safeDecodePayload(dto.code, dto.hex, dto.fPort);
    if (!res.success) {
      return {
        success: false,
        input: {
          hex: dto.hex,
          fPort: dto.fPort || 1,
        },
        error: res.error,
      };
    }

    const cleanHex = dto.hex.trim().replace(/\s+/g, '');
    const bytes = Array.from(Buffer.from(cleanHex, 'hex'));
    return {
      success: true,
      input: {
        hex: cleanHex,
        bytes,
        fPort: dto.fPort || 1,
      },
      output: res.data,
    };
  }
}
