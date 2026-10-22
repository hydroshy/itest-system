import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FinalConfigProfileEntity } from './finalconfig-profile.entity';

@Entity({ schema: 'finalconfig_manager', name: 'finalconfig_regs' })
@Index('idx_finalconfig_regs_profile_id', ['profileId'])
@Index('idx_finalconfig_regs_profile_dec', ['profileId', 'modbusRegisterDec'])
export class FinalConfigRegisterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @Column({ name: 'row_number', type: 'integer', nullable: true })
  rowNumber?: number | null;

  @Column({ name: 'modbus_register_dec', type: 'integer' })
  modbusRegisterDec: number;

  @Column({ name: 'modbus_register_hex', type: 'varchar', length: 20 })
  modbusRegisterHex: string;

  @Column({ name: 'register_count', type: 'integer', default: 1 })
  registerCount: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  format?: string | null;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @Column({ name: 'end_user_default', type: 'text', nullable: true })
  endUserDefault?: string | null;

  @Column({ name: 'input_config', type: 'text', nullable: true })
  inputConfig?: string | null;

  @Column({ name: 'config_check', type: 'varchar', length: 20, default: 'PASS' })
  configCheck: string;

  @Column({ type: 'boolean', default: true })
  selected: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => FinalConfigProfileEntity, (profile) => profile.registers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: FinalConfigProfileEntity;
}
