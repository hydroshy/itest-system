import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FinalConfigPresetEntity } from './final-config-preset.entity';

@Entity('final_config_regs', { synchronize: false })
@Index('idx_final_config_regs_preset_id', ['preset_id'])
@Index('idx_final_config_regs_address', ['address'])
@Index('idx_final_config_regs_parameter_name', ['parameter_name'])
export class FinalConfigRegEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  preset_id: string;

  @ManyToOne(() => FinalConfigPresetEntity, (preset) => preset.registers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'preset_id' })
  preset?: FinalConfigPresetEntity;

  @Column({ type: 'int' })
  address: number;

  @Column({ type: 'varchar', length: 20 })
  modbus_reg_hex: string;

  @Column({ type: 'int', default: 1 })
  slave: number;

  @Column({ type: 'int', default: 1 })
  reg_num: number;

  @Column({ type: 'varchar', length: 50 })
  format: string;

  @Column({ type: 'varchar', length: 255 })
  parameter_name: string;

  @Column({ type: 'text', nullable: true, default: '' })
  value_to_write?: string;

  @Column({ type: 'text', nullable: true })
  value_on_memmap?: string;

  @Column({ type: 'varchar', length: 50, default: 'big-endian' })
  endianness: string;

  @Column({ type: 'varchar', length: 20, default: '3', nullable: true })
  fn_read?: string;

  @Column({ type: 'varchar', length: 20, default: '16', nullable: true })
  fn_write?: string;

  @Column({ type: 'int', default: 0 })
  order_no: number;

  @Column({ type: 'boolean', default: true })
  checked: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
