import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sensor_types')
export class SensorTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_sensor_types_sensor_type_code', { unique: true })
  @Column({ type: 'int', unique: true })
  sensorTypeCode: number; // e.g. 71

  @Index('idx_sensor_types_sku')
  @Column({ type: 'varchar', length: 100 })
  sku: string; // e.g. 'WSLRW-LKS'

  @Column({ type: 'varchar', length: 255 })
  name: string; // e.g. 'Wireless LoRaWAN Leak Sensor'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'EU868' })
  defaultRegion: string; // e.g. 'EU868', 'AS923', 'US915'

  @Column({ type: 'varchar', length: 10, default: 'A' })
  defaultClass: string; // e.g. 'A', 'C'

  @Index('idx_sensor_types_is_active')
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: Record<string, any>;

  @Index('idx_sensor_types_created_at')
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
