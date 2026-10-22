import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MemmapProfileEntity } from './memmap-profile.entity';

@Entity({ schema: 'memmap_manager', name: 'memmap_registers' })
@Index('idx_memmap_registers_profile_id', ['profileId'])
@Index('idx_memmap_registers_address', ['address'])
export class MemmapRegisterEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'integer' })
  address: number;

  @Column({ name: 'data_type', type: 'varchar', length: 30 })
  dataType: string;

  @Column({ type: 'numeric', nullable: true, default: 1 })
  scale?: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  unit?: string | null;

  @Column({ name: 'access_mode', type: 'varchar', length: 20, default: 'RO' })
  accessMode: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'numeric', nullable: true, default: 0 })
  offset?: number | null;

  @Column({ name: 'default_value', type: 'varchar', length: 255, nullable: true })
  defaultValue?: string | null;

  @Column({ name: 'raw_register', type: 'jsonb', nullable: true, default: () => "'{}'" })
  rawRegister?: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => MemmapProfileEntity, (profile) => profile.registers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: MemmapProfileEntity;
}
