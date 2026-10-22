import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TraceabilitySoEntity } from './traceability-so.entity';
import { TraceabilityWaEntity } from './traceability-wa.entity';

export enum TraceabilityTestResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export enum TraceabilityConfigStatus {
  PENDING = 'PENDING',
  CONFIGURED_PASS = 'CONFIGURED_PASS',
  CONFIGURED_FAIL = 'CONFIGURED_FAIL',
}

export enum TraceabilityDeviceStatus {
  TESTED = 'TESTED',
  TESTED_PASS = 'TESTED_PASS',
  TESTED_FAIL = 'TESTED_FAIL',
  CONFIGURED = 'CONFIGURED',
  SHIPPED = 'SHIPPED',
}

@Entity({ schema: 'traceability_manager', name: 'traceability_device' })
export class TraceabilityDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_traceability_device_so_id')
  @Column({ name: 'so_id', type: 'uuid' })
  so_id: string;

  @ManyToOne(() => TraceabilitySoEntity, (so) => so.devices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'so_id' })
  so?: TraceabilitySoEntity;

  @Index('idx_traceability_device_wa_id')
  @Column({ name: 'wa_id', type: 'uuid', nullable: true })
  wa_id: string | null;

  @ManyToOne(() => TraceabilityWaEntity, (wa) => wa.devices, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'wa_id' })
  wa?: TraceabilityWaEntity | null;

  @Index('idx_traceability_device_serial', { unique: true })
  @Column({ name: 'serial_number', type: 'varchar', length: 100, unique: true })
  serial_number: string;

  @Index('idx_traceability_device_eui')
  @Column({ name: 'dev_eui', type: 'varchar', length: 64, nullable: true })
  dev_eui: string | null;

  @Column({ name: 'item_code', type: 'varchar', length: 100, nullable: true })
  item_code: string | null;

  @Column({ name: 'sku', type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ name: 'hw_version', type: 'varchar', length: 50, nullable: true })
  hw_version: string | null;

  @Column({ name: 'fw_version', type: 'varchar', length: 50, nullable: true })
  fw_version: string | null;

  // Test Results from CSV / Hardware Testing
  @Index('idx_traceability_device_test_result')
  @Column({
    name: 'test_result',
    type: 'varchar',
    length: 20,
    default: TraceabilityTestResult.PENDING,
  })
  test_result: TraceabilityTestResult;

  @Column({ name: 'test_id', type: 'varchar', length: 255, nullable: true })
  test_id: string | null;

  @Column({ name: 'test_station', type: 'varchar', length: 100, nullable: true })
  test_station: string | null;

  @Column({ name: 'test_person', type: 'varchar', length: 100, nullable: true })
  test_person: string | null;

  @Column({ name: 'tested_at', type: 'timestamptz', nullable: true })
  tested_at: Date | null;

  @Column({ name: 'test_raw_data', type: 'jsonb', default: {} })
  test_raw_data: Record<string, any>;

  // Cross-system link to Final Config
  @Index('idx_traceability_device_config_session')
  @Column({ name: 'final_config_session_id', type: 'uuid', nullable: true })
  final_config_session_id: string | null;

  @Column({
    name: 'config_status',
    type: 'varchar',
    length: 20,
    default: TraceabilityConfigStatus.PENDING,
  })
  config_status: TraceabilityConfigStatus;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: TraceabilityDeviceStatus.TESTED,
  })
  status: TraceabilityDeviceStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
