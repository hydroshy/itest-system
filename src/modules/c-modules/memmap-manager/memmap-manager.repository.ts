import { Injectable, Logger, Optional } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { MemmapPayloadEntity } from '../memmap-upload/entities/memmap-payload.entity';
import { MemmapRegEntity } from '../memmap-upload/entities/memmap-reg.entity';
import { MemmapUploadRepository } from '../memmap-upload/memmap-upload.repository';

@Injectable()
export class MemmapManagerRepository {
  private readonly logger = new Logger(MemmapManagerRepository.name);

  constructor(@Optional() private readonly dbService?: DynamicDatabaseService) {}

  public getPayloadRepo(): Repository<MemmapPayloadEntity> | null {
    if (!this.dbService) return null;
    try {
      return this.dbService.getRepositoryForTable('memmap_payload', MemmapPayloadEntity);
    } catch {
      return null;
    }
  }

  public getRegRepo(): Repository<MemmapRegEntity> | null {
    if (!this.dbService) return null;
    try {
      return this.dbService.getRepositoryForTable('memmap_regs', MemmapRegEntity);
    } catch {
      return null;
    }
  }

  private get memoryPayloads(): Map<string, MemmapPayloadEntity> {
    return MemmapUploadRepository.sharedMemoryPayloads;
  }

  private get memoryRegs(): Map<string, MemmapRegEntity[]> {
    return MemmapUploadRepository.sharedMemoryRegs;
  }

  public async findAllPayloads(): Promise<MemmapPayloadEntity[]> {
    const payloadRepo = this.getPayloadRepo();
    if (payloadRepo) {
      try {
        return await payloadRepo.find({ order: { created_at: 'DESC' } });
      } catch (err: any) {
        this.logger.debug(`Database findAllPayloads failed, using memory fallback: ${err.message}`);
      }
    }
    return Array.from(this.memoryPayloads.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  public async findPayloadWithRegs(
    id: string,
  ): Promise<{ payload: MemmapPayloadEntity; registers: MemmapRegEntity[] } | null> {
    const payloadRepo = this.getPayloadRepo();
    const regRepo = this.getRegRepo();

    if (payloadRepo) {
      try {
        const payload = await payloadRepo.findOne({ where: { id } });
        if (payload) {
          const registers = regRepo
            ? await regRepo.find({ where: { payload_id: id }, order: { no: 'ASC' } })
            : [];
          return { payload, registers };
        }
      } catch (err: any) {
        this.logger.debug(`Database findPayloadWithRegs failed: ${err.message}`);
      }
    }

    // Memory fallback
    for (const [key, p] of this.memoryPayloads.entries()) {
      if (p.id === id) {
        const registers = this.memoryRegs.get(key) || [];
        return { payload: p, registers: [...registers].sort((a, b) => a.no - b.no) };
      }
    }
    return null;
  }

  public async deletePayload(id: string): Promise<MemmapPayloadEntity | null> {
    const payloadRepo = this.getPayloadRepo();
    const regRepo = this.getRegRepo();

    if (payloadRepo) {
      try {
        const payload = await payloadRepo.findOne({ where: { id } });
        if (payload) {
          if (regRepo) {
            // Cascade delete registers
            await regRepo.delete({ payload_id: id });
          }
          await payloadRepo.delete({ id });

          // Also remove from in-memory cache if present
          for (const [key, p] of this.memoryPayloads.entries()) {
            if (p.id === id) {
              this.memoryPayloads.delete(key);
              this.memoryRegs.delete(key);
            }
          }

          return payload;
        }
      } catch (err: any) {
        this.logger.debug(`Database deletePayload failed, falling back to memory: ${err.message}`);
      }
    }

    // Memory fallback
    for (const [key, p] of this.memoryPayloads.entries()) {
      if (p.id === id) {
        this.memoryPayloads.delete(key);
        this.memoryRegs.delete(key);
        return p;
      }
    }
    return null;
  }
}
