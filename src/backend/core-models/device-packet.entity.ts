import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestingDeviceEntity } from './testing-device.entity';

@Entity({ schema: 'system_schema', name: 'device_packets' })
export class DevicePacketEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Index('idx_packets_device_id')
  @Column({ name: 'device_id', type: 'uuid' })
  device_id: string;

  @Index('idx_packets_type')
  @Column({ name: 'packet_type', type: 'varchar', length: 50, default: 'uplink' })
  packet_type: string;

  @Column({ name: 'f_port', type: 'int', nullable: true })
  f_port?: number | null;

  @Column({ name: 'f_cnt', type: 'bigint', nullable: true })
  f_cnt?: string | number | null;

  @Column({ name: 'raw_payload', type: 'text', nullable: true })
  raw_payload?: string | null;

  @Column({ name: 'decoded_payload', type: 'jsonb', default: () => `'{}'::jsonb` })
  decoded_payload: Record<string, any>;

  @Column({ name: 'rf_info', type: 'jsonb', default: () => `'{}'::jsonb` })
  rf_info: Record<string, any>;

  @Index('idx_packets_created_at')
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @ManyToOne(() => TestingDeviceEntity, (device) => device.packets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device?: TestingDeviceEntity;
}
