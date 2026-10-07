import { Injectable, Logger, Optional } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { MemmapPayloadEntity } from './entities/memmap-payload.entity';
import { MemmapRegEntity } from './entities/memmap-reg.entity';

@Injectable()
export class MemmapUploadRepository {
  private readonly logger = new Logger(MemmapUploadRepository.name);

  // In-memory fallback cache when PostgreSQL is offline or running tests
  private memoryPayloads = new Map<string, MemmapPayloadEntity>();
  private memoryRegs = new Map<string, MemmapRegEntity[]>();

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

  private getCompositeKey(sku: string, shortFw: number): string {
    return `${sku.trim().toUpperCase()}_${Number(shortFw)}`;
  }

  public async saveOrUpdate(
    payloadData: Partial<MemmapPayloadEntity>,
    registersData: Partial<MemmapRegEntity>[],
  ): Promise<{ payload: MemmapPayloadEntity; registers: MemmapRegEntity[] }> {
    const sku = (payloadData.sku || '').trim().toUpperCase();
    const shortFw = Number(payloadData.short_fw);
    const payloadRepo = this.getPayloadRepo();
    const regRepo = this.getRegRepo();

    if (payloadRepo && regRepo) {
      try {
        const dataSource = payloadRepo.manager.connection;
        return await dataSource.transaction(async (manager) => {
          let existing = await manager.findOne(MemmapPayloadEntity, {
            where: { sku, short_fw: shortFw },
          });

          let payloadId: string;
          if (existing) {
            payloadId = existing.id;
            await manager.update(MemmapPayloadEntity, payloadId, {
              file_name: payloadData.file_name,
              total_regs: payloadData.total_regs,
              dec_valid: payloadData.dec_valid,
              hex_valid: payloadData.hex_valid,
              created_by: payloadData.created_by || existing.created_by,
              updated_at: new Date(),
            });
            // Delete old registers
            await manager.delete(MemmapRegEntity, { payload_id: payloadId });
          } else {
            const newPayload = manager.create(MemmapPayloadEntity, {
              ...payloadData,
              sku,
              short_fw: shortFw,
              created_at: new Date(),
              updated_at: new Date(),
            });
            const saved = await manager.save(MemmapPayloadEntity, newPayload);
            payloadId = saved.id;
            existing = saved;
          }

          const regsToInsert = registersData.map((r, idx) =>
            manager.create(MemmapRegEntity, {
              ...r,
              payload_id: payloadId,
              sku,
              short_fw: shortFw,
              no: r.no !== undefined ? r.no : idx + 1,
              created_at: new Date(),
            }),
          );

          const savedRegs = await manager.save(MemmapRegEntity, regsToInsert);
          const reloaded = await manager.findOne(MemmapPayloadEntity, {
            where: { id: payloadId },
          });

          return { payload: reloaded || existing, registers: savedRegs };
        });
      } catch (err: any) {
        this.logger.warn(`Database transaction failed, falling back to memory: ${err.message}`);
      }
    }

    // In-memory fallback
    const key = this.getCompositeKey(sku, shortFw);
    let payload = this.memoryPayloads.get(key);
    const payloadId = payload?.id || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    payload = {
      id: payloadId,
      sku,
      short_fw: shortFw,
      file_name: payloadData.file_name,
      total_regs: payloadData.total_regs || registersData.length,
      dec_valid: payloadData.dec_valid ?? true,
      hex_valid: payloadData.hex_valid ?? true,
      created_by: payloadData.created_by || 'admin',
      created_at: payload?.created_at || new Date(),
      updated_at: new Date(),
    } as MemmapPayloadEntity;

    const savedRegs: MemmapRegEntity[] = registersData.map((r, idx) => ({
      id: `reg-${Date.now()}-${idx}`,
      payload_id: payloadId,
      sku,
      short_fw: shortFw,
      no: r.no !== undefined ? r.no : idx + 1,
      modbus_reg_dec: Number(r.modbus_reg_dec) || 0,
      modbus_reg_hex: String(r.modbus_reg_hex || '0'),
      fn_read: r.fn_read || '3',
      fn_write: r.fn_write || 'None',
      num_regs: Number(r.num_regs) || 1,
      description: r.description,
      range_val: r.range_val,
      end_user_default: r.end_user_default,
      format: r.format,
      downlink_type_5: r.downlink_type_5,
      in_rd1_template: Boolean(r.in_rd1_template),
      comment: r.comment,
      in_engineering_template: Boolean(r.in_engineering_template),
      in_end_user_template: Boolean(r.in_end_user_template),
      in_full_template: Boolean(r.in_full_template),
      created_at: new Date(),
    } as MemmapRegEntity));

    this.memoryPayloads.set(key, payload);
    this.memoryRegs.set(key, savedRegs);

    return { payload, registers: savedRegs };
  }

  public async findBySkuAndShortFw(
    sku: string,
    shortFw: number,
  ): Promise<{ payload: MemmapPayloadEntity; registers: MemmapRegEntity[] } | null> {
    const cleanSku = (sku || '').trim().toUpperCase();
    const cleanFw = Number(shortFw);
    const payloadRepo = this.getPayloadRepo();
    const regRepo = this.getRegRepo();

    if (payloadRepo && regRepo) {
      try {
        const payload = await payloadRepo.findOne({
          where: { sku: cleanSku, short_fw: cleanFw },
        });
        if (payload) {
          const registers = await regRepo.find({
            where: { payload_id: payload.id },
            order: { no: 'ASC' },
          });
          return { payload, registers };
        }
      } catch (err: any) {
        this.logger.debug(`Database find failed, checking memory fallback: ${err.message}`);
      }
    }

    // Memory fallback
    const key = this.getCompositeKey(cleanSku, cleanFw);
    const payload = this.memoryPayloads.get(key);
    if (payload) {
      const registers = this.memoryRegs.get(key) || [];
      return { payload, registers: [...registers].sort((a, b) => a.no - b.no) };
    }

    return null;
  }

  public async findAllPayloads(): Promise<MemmapPayloadEntity[]> {
    const payloadRepo = this.getPayloadRepo();
    if (payloadRepo) {
      try {
        return await payloadRepo.find({ order: { created_at: 'DESC' } });
      } catch (err: any) {
        this.logger.debug(`Database findAll failed: ${err.message}`);
      }
    }
    return Array.from(this.memoryPayloads.values());
  }
}
