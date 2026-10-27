import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DevicePacketEntity } from './device-packet.entity';
import { TraceabilitySoEntity } from './traceability-so.entity';
import { TraceabilityWaEntity } from './traceability-wa.entity';

@Entity({ schema: 'devices', name: 'devices' })
export class TestingDeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_devices_serial_number', { unique: true })
  @Column({ name: 'serial_number', type: 'varchar', length: 100, unique: true })
  serial_number: string;

  @Index('idx_devices_network_id')
  @Column({ name: 'network_id', type: 'varchar', length: 100, nullable: true })
  network_id?: string | null;

  @Column({ name: 'device_name', type: 'varchar', length: 255 })
  device_name: string;

  @Index('idx_devices_device_type')
  @Column({ name: 'device_type', type: 'varchar', length: 100, default: 'end_device' })
  device_type: string;

  @Index('idx_devices_plugin_id')
  @Column({ name: 'plugin_id', type: 'varchar', length: 128, default: 'testing' })
  plugin_id: string;

  @Index('idx_devices_so_id')
  @Column({ name: 'so_id', type: 'uuid', nullable: true })
  so_id?: string | null;

  @Index('idx_devices_so_number')
  @Column({ name: 'so_number', type: 'varchar', length: 100, nullable: true })
  so_number?: string | null;

  @Index('idx_devices_wa_id')
  @Column({ name: 'wa_id', type: 'uuid', nullable: true })
  wa_id?: string | null;

  @Index('idx_devices_wa_number')
  @Column({ name: 'wa_number', type: 'varchar', length: 100, nullable: true })
  wa_number?: string | null;

  @Index('idx_devices_item_code')
  @Column({ name: 'item_code', type: 'varchar', length: 100, nullable: true })
  item_code?: string | null;

  @Index('idx_devices_status')
  @Column({ name: 'status', type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'::jsonb` })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => DevicePacketEntity, (packet) => packet.device)
  packets?: DevicePacketEntity[];

  @ManyToOne(() => TraceabilitySoEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'so_id' })
  so?: TraceabilitySoEntity | null;

  @ManyToOne(() => TraceabilityWaEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'wa_id' })
  wa?: TraceabilityWaEntity | null;
}
