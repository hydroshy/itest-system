import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { TraceabilityWaEntity } from './traceability-wa.entity';
import { TraceabilityDeviceEntity } from './traceability-device.entity';

@Entity({ schema: 'traceability_manager', name: 'traceability_so' })
export class TraceabilitySoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_traceability_so_number', { unique: true })
  @Column({ name: 'so_number', type: 'varchar', length: 50, unique: true })
  so_number: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 255, nullable: true })
  customer_name: string | null;

  @Column({ name: 'partner_email', type: 'varchar', length: 255, nullable: true })
  partner_email?: string | null;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => TraceabilityWaEntity, (wa) => wa.so, { cascade: true })
  workAuthorizations?: TraceabilityWaEntity[];

  @OneToMany(() => TraceabilityDeviceEntity, (device) => device.so)
  devices?: TraceabilityDeviceEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
