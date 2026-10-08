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
import { FinalConfigRegEntity } from './final-config-reg.entity';

@Entity('final_config_presets', { synchronize: false })
@Unique('UQ_final_config_presets_so_item_code', ['so', 'item_code'])
@Index('idx_final_config_presets_so', ['so'])
@Index('idx_final_config_presets_item_code', ['item_code'])
@Index('idx_final_config_presets_sku_fw', ['sku', 'short_fw'])
@Index('idx_final_config_presets_created_at', ['created_at'])
export class FinalConfigPresetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  so: string;

  @Column({ type: 'varchar', length: 100 })
  item_code: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 50 })
  firmware_version: string;

  @Column({ type: 'int' })
  short_fw: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  total_regs: number;

  @Column({ type: 'int', default: 3500 })
  write_timeout_ms?: number;

  @Column({ type: 'int', default: 600 })
  settling_delay_ms?: number;

  @Column({ type: 'varchar', length: 255, default: 'admin', nullable: true })
  created_by?: string;

  @OneToMany(() => FinalConfigRegEntity, (reg) => reg.preset, {
    cascade: true,
  })
  registers?: FinalConfigRegEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
