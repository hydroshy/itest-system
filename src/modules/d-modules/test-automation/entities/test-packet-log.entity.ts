import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TestDeviceRunEntity } from './test-device-run.entity';

@Entity('test_packet_logs')
@Index('idx_test_packet_logs_device_run_id', ['deviceRunId'])
@Index('idx_test_packet_logs_deveui', ['devEUI'])
@Index('idx_test_packet_logs_received_at', ['receivedAt'])
export class TestPacketLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  deviceRunId: string;

  @ManyToOne(() => TestDeviceRunEntity, (run) => run.packetLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'deviceRunId' })
  deviceRun: TestDeviceRunEntity;

  @Column({ type: 'varchar', length: 50 })
  devEUI: string;

  @Column({ type: 'int', default: 1 })
  fPort: number;

  @Column({ type: 'int', default: 0 })
  fCnt: number;

  @Column({ type: 'text' })
  payloadHex: string;

  @Column({ type: 'jsonb', nullable: true })
  decodedData?: Record<string, any>;

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

  @Column({ type: 'boolean', default: false })
  isPass: boolean;

  @Column({ type: 'double precision', nullable: true })
  rssi?: number;

  @Column({ type: 'double precision', nullable: true })
  snr?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  gatewayId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  receivedAt: Date;
}
