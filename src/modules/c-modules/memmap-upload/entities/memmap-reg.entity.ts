import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MemmapPayloadEntity } from './memmap-payload.entity';

@Entity('memmap_regs', { synchronize: false })
@Index('idx_memmap_regs_payload_id', ['payload_id'])
@Index('idx_memmap_regs_sku_fw', ['sku', 'short_fw'])
@Index('idx_memmap_regs_dec', ['modbus_reg_dec'])
@Index('idx_memmap_regs_hex', ['modbus_reg_hex'])
@Index('idx_memmap_regs_description', ['description'])
export class MemmapRegEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  payload_id: string;

  @ManyToOne(() => MemmapPayloadEntity, (payload) => payload.registers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payload_id' })
  payload?: MemmapPayloadEntity;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'int' })
  short_fw: number;

  @Column({ type: 'int' })
  no: number;

  @Column({ type: 'int' })
  modbus_reg_dec: number;

  @Column({ type: 'varchar', length: 20 })
  modbus_reg_hex: string;

  @Column({ type: 'varchar', length: 20, default: '3', nullable: true })
  fn_read?: string;

  @Column({ type: 'varchar', length: 20, default: 'None', nullable: true })
  fn_write?: string;

  @Column({ type: 'int', default: 1 })
  num_regs: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  range_val?: string;

  @Column({ type: 'text', nullable: true })
  end_user_default?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  format?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  downlink_type_5?: string;

  @Column({ type: 'boolean', default: false })
  in_rd1_template: boolean;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'boolean', default: false })
  in_engineering_template: boolean;

  @Column({ type: 'boolean', default: false })
  in_end_user_template: boolean;

  @Column({ type: 'boolean', default: false })
  in_full_template: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
