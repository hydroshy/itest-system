import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type TelemetryQuality = 'GOOD' | 'UNCERTAIN' | 'BAD';

@Entity({ name: 'unified_telemetry', schema: 'public' })
@Index('idx_unified_telemetry_lookup', ['deviceId', 'metricKey', 'timestamp'])
@Index('idx_unified_telemetry_device_time', ['deviceId', 'timestamp'])
@Index('idx_unified_telemetry_metric', ['metricKey'])
@Index('idx_unified_telemetry_time', ['timestamp'])
export class UnifiedTelemetryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128, default: 'default' })
  tenantId: string;

  @Column({ type: 'varchar', length: 128 })
  deviceId: string;

  @Column({ type: 'timestamptz' })
  timestamp: Date;

  @Column({ type: 'varchar', length: 128 })
  metricKey: string;

  @Column({ type: 'numeric', precision: 20, scale: 6, nullable: true })
  valueNumeric?: number;

  @Column({ type: 'text', nullable: true })
  valueString?: string;

  @Column({ type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'number',
  })
  dataType: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  unit?: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'GOOD',
  })
  quality: TelemetryQuality;

  @Column({ type: 'varchar', length: 64 })
  sourceProtocol: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  receivedAt: Date;
}
