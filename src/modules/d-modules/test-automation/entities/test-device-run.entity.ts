import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TestSessionEntity } from './test-session.entity';
import { TestPacketLogEntity } from './test-packet-log.entity';

export type TestDeviceStatus =
  | 'WAITING'
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'TIMEOUT'
  | 'SKIPPED';

@Entity('test_device_runs')
@Index('idx_test_device_runs_session_id', ['sessionId'])
@Index('idx_test_device_runs_deveui', ['devEUI'])
@Index('idx_test_device_runs_status', ['status'])
export class TestDeviceRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => TestSessionEntity, (session) => session.deviceRuns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: TestSessionEntity;

  @Column({ type: 'varchar', length: 50 })
  devEUI: string;

  @Column({ type: 'uuid', nullable: true })
  deviceId?: string;

  @Column({ type: 'varchar', length: 255 })
  sku: string;

  @Column({ type: 'varchar', length: 100 })
  firmwareVersion: string;

  @Column({ type: 'varchar', length: 50, default: 'WAITING' })
  status: TestDeviceStatus;

  @Column({ type: 'int', default: 0 })
  totalPackets: number;

  @Column({ type: 'int', default: 0 })
  passedAssertions: number;

  @Column({ type: 'int', default: 0 })
  failedAssertions: number;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  summaryReport: Record<string, any>;

  @Column({ type: 'double precision', nullable: true })
  rssiAvg?: number;

  @Column({ type: 'double precision', nullable: true })
  snrAvg?: number;

  @Column({ type: 'double precision', nullable: true })
  batteryVoltage?: number;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @OneToMany(() => TestPacketLogEntity, (log) => log.deviceRun, {
    cascade: true,
  })
  packetLogs: TestPacketLogEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
