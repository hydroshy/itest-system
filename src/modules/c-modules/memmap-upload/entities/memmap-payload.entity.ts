import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { MemmapRegEntity } from './memmap-reg.entity';

@Entity('memmap_payload', { synchronize: false })
@Unique('UQ_memmap_payload_sku_short_fw', ['sku', 'short_fw'])
@Index('idx_memmap_payload_sku_fw', ['sku', 'short_fw'])
@Index('idx_memmap_payload_created_at', ['created_at'])
export class MemmapPayloadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'int' })
  short_fw: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  file_name?: string;

  @Column({ type: 'int', default: 0 })
  total_regs: number;

  @Column({ type: 'boolean', default: true })
  dec_valid: boolean;

  @Column({ type: 'boolean', default: true })
  hex_valid: boolean;

  @Column({ type: 'varchar', length: 255, default: 'admin', nullable: true })
  created_by?: string;

  @OneToMany(() => MemmapRegEntity, (reg) => reg.payload, {
    cascade: true,
  })
  registers?: MemmapRegEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
