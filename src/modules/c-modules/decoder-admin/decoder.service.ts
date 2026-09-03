import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as vm from 'vm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { DecoderEntity } from './entities/decoder.entity';
import { CreateDecoderDto, UpdateDecoderDto, TestDecoderDto } from './dto/decoder.dto';

@Injectable()
export class DecoderService {
  private readonly logger = new Logger(DecoderService.name);

  constructor(private readonly dynamicDatabaseService: DynamicDatabaseService) {}

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

  async create(dto: CreateDecoderDto, author?: string): Promise<DecoderEntity> {
    const repo = this.getRepository();
    const sku = dto.sku.trim();
    if (!sku) {
      throw new BadRequestException('SKU must not be empty');
    }
    if (dto.firmwareVersion < 1 || dto.firmwareVersion > 32) {
      throw new BadRequestException('Firmware version must be an integer between 1 and 32');
    }

    // Standardized composite ID: `${sku}_${firmwareVersion}`
    const id = `${sku}_${dto.firmwareVersion}`;

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
    try {
      const cleanHex = dto.hex.trim().replace(/\s+/g, '');
      if (!cleanHex) {
        throw new BadRequestException('Hex string must not be empty');
      }
      if (cleanHex.length % 2 !== 0) {
        throw new BadRequestException('Hex string must have an even number of characters');
      }

      const bytes = Buffer.from(cleanHex, 'hex');
      const fPort = dto.fPort !== undefined && dto.fPort !== null ? Number(dto.fPort) : 1;

      const input = {
        bytes: Array.from(bytes),
        fPort,
      };

      const sandbox = {
        input,
        bytes: Array.from(bytes),
        fPort,
        console: {
          log: () => {},
          error: () => {},
          warn: () => {},
        },
        result: null as any,
      };

      const context = vm.createContext(sandbox);
      const fullScript = `
        ${dto.code}
        if (typeof decodeUplink === 'function') {
          result = decodeUplink(input);
        } else if (typeof Decoder === 'function') {
          result = Decoder(input.bytes, input.fPort);
        } else {
          throw new Error('No valid decode function found. Define decodeUplink(input) or Decoder(bytes, fPort)');
        }
      `;

      const vmScript = new vm.Script(fullScript);
      vmScript.runInContext(context, { timeout: 2000 });

      return {
        success: true,
        input: {
          hex: cleanHex,
          bytes: Array.from(bytes),
          fPort,
        },
        output: sandbox.result,
      };
    } catch (err: any) {
      return {
        success: false,
        input: {
          hex: dto.hex,
          fPort: dto.fPort || 1,
        },
        error: err.message,
      };
    }
  }
}
