import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { TraceabilityDeviceEntity } from './traceability-device.entity';

@Entity({ name: 'traceability_order', schema: 'traceability_manager' })
@Unique(['so_number', 'wa_number', 'item_code'])
export class TraceabilityOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'so_number', type: 'varchar', length: 50 })
  so_number: string;

  @Index()
  @Column({ name: 'wa_number', type: 'varchar', length: 50 })
  wa_number: string;

  @Index()
  @Column({ name: 'item_code', type: 'varchar', length: 100 })
  item_code: string;

  @Column({ name: 'connectivity', type: 'varchar', length: 20, default: 'LoRaWAN' })
  connectivity: string; // 'LoRaWAN' | 'Sigfox' | 'NB-IoT' | 'Others'

  @Column({ name: 'total_quantity', type: 'int', default: 0 })
  total_quantity: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by', type: 'varchar', length: 100, default: 'system' })
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => TraceabilityDeviceEntity, (device) => device.order)
  devices?: TraceabilityDeviceEntity[];
}
