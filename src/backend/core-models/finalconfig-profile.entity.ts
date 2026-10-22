import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FinalConfigRegisterEntity } from './finalconfig-register.entity';

@Entity({ schema: 'finalconfig_manager', name: 'finalconfig_profile' })
@Index('idx_finalconfig_profile_sku_fw', ['sku', 'longFw'])
@Index('idx_finalconfig_profile_so', ['soNumber'])
@Index('idx_finalconfig_profile_created_at', ['createdAt'])
export class FinalConfigProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'so_number', type: 'varchar', length: 50 })
  soNumber: string;

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

  @OneToMany(() => FinalConfigRegisterEntity, (reg) => reg.profile, {
    cascade: true,
  })
  registers: FinalConfigRegisterEntity[];
}
