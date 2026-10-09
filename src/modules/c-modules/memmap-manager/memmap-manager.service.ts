import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MemmapManagerRepository } from './memmap-manager.repository';
import { MemmapPayloadEntity } from '../memmap-upload/entities/memmap-payload.entity';
import { MemmapRegEntity } from '../memmap-upload/entities/memmap-reg.entity';

@Injectable()
export class MemmapManagerService {
  private readonly logger = new Logger(MemmapManagerService.name);

  constructor(private readonly repository: MemmapManagerRepository) {}

  /**
   * List all stored memory map payloads ordered by created_at DESC
   */
  public async findAll(): Promise<MemmapPayloadEntity[]> {
    return await this.repository.findAllPayloads();
  }

  /**
   * Retrieve memory map payload header and all 16-field Modbus register definitions
   */
  public async getRegistersByPayloadId(
    id: string,
  ): Promise<{ payload: MemmapPayloadEntity; registers: MemmapRegEntity[] }> {
    const cleanId = (id || '').trim();
    const result = await this.repository.findPayloadWithRegs(cleanId);
    if (!result) {
      throw new NotFoundException(`Memory map payload with ID '${cleanId}' not found`);
    }
    return result;
  }

  /**
   * Permanently delete a memory map payload and cascade all its register definitions
   */
  public async deletePayload(id: string): Promise<{
    success: boolean;
    message: string;
    data: {
      id: string;
      sku: string;
      longFw: string;
      shortFw: number;
    };
  }> {
    const cleanId = (id || '').trim();
    const deleted = await this.repository.deletePayload(cleanId);
    if (!deleted) {
      throw new NotFoundException(`Memory map payload with ID '${cleanId}' not found`);
    }

    this.logger.log(
      `Deleted Memory Map [${deleted.id}] SKU [${deleted.sku}] Short FW [${deleted.short_fw}] Long FW [${deleted.long_fw || ''}]`,
    );

    return {
      success: true,
      message: 'Memory map deleted successfully',
      data: {
        id: deleted.id,
        sku: deleted.sku,
        longFw: deleted.long_fw || String(deleted.short_fw),
        shortFw: deleted.short_fw,
      },
    };
  }
}
