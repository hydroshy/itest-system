import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('downlink_logs')
export class DownlinkLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @Index('idx_downlink_logs_deveui')
  devEUI: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceName?: string;

  @Column({ type: 'uuid', nullable: true })
  networkServerId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  networkServerName?: string;

  @Column({ type: 'varchar', length: 50, default: 'CHIRPSTACK' })
  @Index('idx_downlink_logs_server_type')
  serverType: string;

  @Column({ type: 'int', default: 1 })
  fPort: number;

  @Column({ type: 'text' })
  payloadHex: string;

  @Column({ type: 'boolean', default: false })
  confirmed: boolean;

  @Column({ type: 'boolean', default: false })
  flushQueue: boolean;

  @Column({ type: 'varchar', length: 50, default: 'QUEUED' })
  status: string; // 'QUEUED' | 'SENT' | 'SUCCESS' | 'ERROR' | 'REJECTED' | 'QUEUED_LOCAL_BUFFER'

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'jsonb', nullable: true })
  responseDetails?: any;

  @Column({ type: 'varchar', length: 255, default: 'anonymous' })
  sentBy: string; // Username of operator who triggered downlink

  @CreateDateColumn({ type: 'timestamptz' })
  @Index('idx_downlink_logs_created_at')
  createdAt: Date;
}
