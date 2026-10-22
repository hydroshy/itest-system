import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TraceabilityOrderEntity } from './traceability-order.entity';

@Entity({ name: 'traceability_device', schema: 'traceability_manager' })
export class TraceabilityDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'order_id', type: 'uuid' })
  order_id: string;

  @Index({ unique: true })
  @Column({ name: 'serial_number', type: 'varchar', length: 100, unique: true })
  serial_number: string;

  @Column({ name: 'sku', type: 'varchar', length: 100 })
  sku: string;

  @Column({ name: 'fw_version', type: 'varchar', length: 50 })
  fw_version: string;

  @Column({ name: 'hw_version', type: 'varchar', length: 50, nullable: true })
  hw_version: string;

  @Column({ name: 'me_version', type: 'varchar', length: 50, nullable: true })
  me_version: string;

  // Telecom attributes
  @Index()
  @Column({ name: 'dev_eui', type: 'varchar', length: 32, nullable: true })
  dev_eui: string;

  @Column({ name: 'app_eui', type: 'varchar', length: 32, nullable: true })
  app_eui: string;

  @Column({ name: 'app_key', type: 'varchar', length: 64, nullable: true })
  app_key: string;

  @Index()
  @Column({ name: 'sigfox_id', type: 'varchar', length: 16, nullable: true })
  sigfox_id: string;

  @Column({ name: 'sigfox_pac', type: 'varchar', length: 32, nullable: true })
  sigfox_pac: string;

  @Column({ name: 'telecom_credentials', type: 'jsonb', default: {} })
  telecom_credentials: Record<string, any>;

  // Cross-system linkage
  @Index()
  @Column({ name: 'final_config_session_id', type: 'uuid', nullable: true })
  final_config_session_id: string | null;

  @Column({ name: 'config_status', type: 'varchar', length: 20, default: 'PENDING' })
  config_status: string; // 'PENDING' | 'CONFIGURED_PASS' | 'CONFIGURED_FAIL'

  @Column({ name: 'chirpstack_synced', type: 'boolean', default: false })
  chirpstack_synced: boolean;

  @Index()
  @Column({ name: 'status', type: 'varchar', length: 30, default: 'INITIAL' })
  status: string; // 'INITIAL' | 'CONFIGURED' | 'QA_PASSED' | 'PACKED' | 'SHIPPED'

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => TraceabilityOrderEntity, (order) => order.devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: TraceabilityOrderEntity;
}
