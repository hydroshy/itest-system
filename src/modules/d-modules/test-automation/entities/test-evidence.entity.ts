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
import { TestSessionEntity } from './test-session.entity';
import { TestDeviceRunEntity } from './test-device-run.entity';

@Entity('test_evidence')
@Index('idx_test_evidence_deveui', ['devEUI'])
@Index('idx_test_evidence_so_code', ['soCode'])
@Index('idx_test_evidence_item_code', ['itemCode'])
@Index('idx_test_evidence_serial_number', ['serialNumber'])
@Index('idx_test_evidence_verdict', ['verdict'])
@Index('idx_test_evidence_tested_at', ['testedAt'])
export class TestEvidenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  sessionId?: string;

  @ManyToOne(() => TestSessionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session?: TestSessionEntity;

  @Column({ type: 'uuid', nullable: true })
  deviceRunId?: string;

  @ManyToOne(() => TestDeviceRunEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deviceRunId' })
  deviceRun?: TestDeviceRunEntity;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sessionCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  soCode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  itemCode?: string;

  @Column({ type: 'varchar', length: 50 })
  devEUI: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber?: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  firmwareVersion?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hardwareVersion?: string;

  @Column({ type: 'text' })
  payloadHex: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  decodedFields: Record<string, any>;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  assertionResults: Array<{
    fieldName: string;
    operator: string;
    expectedValue?: any;
    actualValue?: any;
    pass: boolean;
    severity?: string;
    message?: string;
  }>;

  @Column({ type: 'varchar', length: 50, default: 'PASSED' })
  verdict: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'int', default: 1 })
  fPort: number;

  @Column({ type: 'int', default: 0 })
  fCnt: number;

  @Column({ type: 'double precision', nullable: true })
  rssi?: number;

  @Column({ type: 'double precision', nullable: true })
  snr?: number;

  @Column({ type: 'double precision', nullable: true })
  batteryVoltage?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  operatorUsername?: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  testedAt: Date;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
