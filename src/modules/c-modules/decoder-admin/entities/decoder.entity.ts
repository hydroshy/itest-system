import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('decoder')
export class DecoderEntity {
  /**
   * Primary Key composite format: `${sku}_${firmwareVersion}`
   * e.g. WSLRW-V1A_9
   */
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  /**
   * Product SKU (e.g. WSLRW-V1A)
   */
  @Column({ type: 'varchar', length: 255 })
  sku: string;

  /**
   * Firmware Version (integer 1 - 32)
   */
  @Column({ type: 'int' })
  firmwareVersion: number;

  /**
   * LoRaWAN payload decoder JavaScript code.
   * Can contain main decode function (decodeUplink or Decoder) and modular subfunctions.
   */
  @Column({ type: 'text' })
  decoderCode: string;

  /**
   * Optional human-readable description or release notes
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Creator or last editor username
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  author?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
