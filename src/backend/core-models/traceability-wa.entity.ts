import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TraceabilitySoEntity } from './traceability-so.entity';
import { TraceabilityDeviceEntity } from './traceability-device.entity';

@Entity({ schema: 'traceability_manager', name: 'traceability_wa' })
@Index('idx_traceability_wa_so_id', ['so_id'])
@Index('idx_traceability_wa_number', ['wa_number'])
@Unique('uq_traceability_wa_so_wa_item', ['so_id', 'wa_number', 'item_code'])
export class TraceabilityWaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_traceability_wa_so_id')
  @Column({ name: 'so_id', type: 'uuid' })
  so_id: string;

  @ManyToOne(() => TraceabilitySoEntity, (so) => so.workAuthorizations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'so_id' })
  so?: TraceabilitySoEntity;

  @Index('idx_traceability_wa_number')
  @Column({ name: 'wa_number', type: 'varchar', length: 50 })
  wa_number: string;

  @Column({ name: 'item_code', type: 'varchar', length: 100, nullable: true })
  item_code: string | null;

  @Column({ name: 'planned_quantity', type: 'int', default: 0 })
  planned_quantity: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => TraceabilityDeviceEntity, (device) => device.wa)
  devices?: TraceabilityDeviceEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
