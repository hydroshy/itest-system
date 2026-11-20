import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PreconfigRegisterEntity } from './preconfig-register.entity';

@Entity({ schema: 'preconfig_manager', name: 'preconfig_profile' })
@Index('idx_preconfig_profile_sku_fw', ['sku', 'longFw'])
@Index('idx_preconfig_profile_so', ['soNumber'])
@Index('idx_preconfig_profile_created_at', ['createdAt'])
export class PreconfigProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'so_number', type: 'varchar', length: 50 })
  soNumber: string;

  @Index('idx_preconfig_profile_wa')
  @Column({ name: 'wa_number', type: 'varchar', length: 50, nullable: true })
  waNumber?: string | null;

  @Column({ name: 'item_code', type: 'varchar', length: 100 })
  itemCode: string;

  @Column({ type: 'varchar', length: 20 })
  connectivity: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ name: 'long_fw', type: 'varchar', length: 50 })
  longFw: string;

  @Column({ name: 'short_fw', type: 'varchar', length: 20 })
  shortFw: string;

  @Column({ name: 'registers_count', type: 'integer', default: 0 })
  registersCount: number;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  createdBy?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => PreconfigRegisterEntity, (reg) => reg.profile, {
    cascade: true,
  })
  registers: PreconfigRegisterEntity[];
}
