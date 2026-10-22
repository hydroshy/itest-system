import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MemmapRegisterEntity } from './memmap-register.entity';

@Entity({ schema: 'memmap_manager', name: 'memmap_profiles' })
@Index('idx_memmap_profiles_name', ['name'])
@Index('idx_memmap_profiles_created_at', ['createdAt'])
export class MemmapProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'source_format', type: 'varchar', length: 20, default: 'json' })
  sourceFormat: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => MemmapRegisterEntity, (reg) => reg.profile, {
    cascade: true,
  })
  registers: MemmapRegisterEntity[];

  registersCount?: number;
}
