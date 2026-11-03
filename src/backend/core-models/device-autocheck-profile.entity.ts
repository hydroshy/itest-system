import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'system_schema', name: 'device_autocheck_profiles' })
@Index('idx_autocheck_profiles_product', ['item_code', 'fw_version'])
export class DeviceAutoCheckProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'autocheck_id', type: 'varchar', length: 40, unique: true })
  autocheck_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'item_code', type: 'varchar', length: 100 })
  item_code: string;

  @Column({ name: 'fw_version', type: 'varchar', length: 100 })
  fw_version: string;

  @Column({ name: 'reference_item_code', type: 'varchar', length: 100, nullable: true })
  reference_item_code?: string | null;

  @Column({ name: 'reference_fw_version', type: 'varchar', length: 100, nullable: true })
  reference_fw_version?: string | null;

  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  criteria: Record<string, any>;

  @Column({ name: 'created_by', type: 'varchar', length: 100, default: 'tester' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
