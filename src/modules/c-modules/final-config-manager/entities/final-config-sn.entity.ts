import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { FinalConfigRegsSnEntity } from './final-config-regs-sn.entity';
import { FinalConfigPresetEntity } from '../../create-final-config/entities/final-config-preset.entity';

@Entity('final_config_sn', { synchronize: false })
@Unique('UQ_final_config_sn_serial_item', ['serial_number', 'item_code'])
@Index('idx_final_config_sn_serial_number', ['serial_number'])
@Index('idx_final_config_sn_item_code', ['item_code'])
@Index('idx_final_config_sn_so', ['so'])
@Index('idx_final_config_sn_status', ['status'])
@Index('idx_final_config_sn_preset_id', ['preset_id'])
@Index('idx_final_config_sn_tested_at', ['tested_at'])
@Index('idx_final_config_sn_created_at', ['created_at'])
export class FinalConfigSnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'serial_number', type: 'varchar', length: 100 })
  serial_number: string;

  get serialNumber(): string {
    return this.serial_number;
  }
  set serialNumber(val: string) {
    this.serial_number = val;
  }

  @Column({ name: 'item_code', type: 'varchar', length: 100 })
  item_code: string;

  get itemCode(): string {
    return this.item_code;
  }
  set itemCode(val: string) {
    this.item_code = val;
  }

  @Column({ name: 'so', type: 'varchar', length: 100, nullable: true })
  so?: string;

  @Column({ name: 'preset_id', type: 'uuid', nullable: true })
  preset_id?: string;

  get presetId(): string | undefined {
    return this.preset_id;
  }
  set presetId(val: string | undefined) {
    this.preset_id = val;
  }

  @ManyToOne(() => FinalConfigPresetEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'preset_id' })
  preset?: FinalConfigPresetEntity;

  @Column({ name: 'sku', type: 'varchar', length: 100 })
  sku: string;

  @Column({ name: 'firmware_version', type: 'varchar', length: 50, nullable: true })
  firmware_version?: string;

  get firmwareVersion(): string | undefined {
    return this.firmware_version;
  }
  set firmwareVersion(val: string | undefined) {
    this.firmware_version = val;
  }

  @Column({ name: 'short_fw', type: 'int', nullable: true })
  short_fw?: number;

  get shortFw(): number | undefined {
    return this.short_fw;
  }
  set shortFw(val: number | undefined) {
    this.short_fw = val;
  }

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'NONE' })
  status: 'PASS' | 'FAIL' | 'NONE';

  @Column({ name: 'dev_eui', type: 'varchar', length: 50, nullable: true })
  dev_eui?: string;

  get devEui(): string | undefined {
    return this.dev_eui;
  }
  set devEui(val: string | undefined) {
    this.dev_eui = val;
  }

  @Column({ name: 'app_key', type: 'varchar', length: 64, nullable: true })
  app_key?: string;

  get appKey(): string | undefined {
    return this.app_key;
  }
  set appKey(val: string | undefined) {
    this.app_key = val;
  }

  @Column({ name: 'configured_regs_count', type: 'int', default: 0 })
  configured_regs_count: number;

  get configuredRegsCount(): number {
    return this.configured_regs_count;
  }
  set configuredRegsCount(val: number) {
    this.configured_regs_count = val;
  }

  @Column({ name: 'total_regs_count', type: 'int', default: 0 })
  total_regs_count: number;

  get totalRegsCount(): number {
    return this.total_regs_count;
  }
  set totalRegsCount(val: number) {
    this.total_regs_count = val;
  }

  @Column({ name: 'tested_at', type: 'timestamptz', nullable: true })
  tested_at?: Date;

  get testedAt(): Date | undefined {
    return this.tested_at;
  }
  set testedAt(val: Date | undefined) {
    this.tested_at = val;
  }

  @Column({ name: 'operator', type: 'varchar', length: 100, default: 'admin' })
  operator: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @OneToMany(() => FinalConfigRegsSnEntity, (reg) => reg.configSn, { cascade: true })
  registers?: FinalConfigRegsSnEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  get createdAt(): Date {
    return this.created_at;
  }
  set createdAt(val: Date) {
    this.created_at = val;
  }

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  get updatedAt(): Date {
    return this.updated_at;
  }
  set updatedAt(val: Date) {
    this.updated_at = val;
  }
}
