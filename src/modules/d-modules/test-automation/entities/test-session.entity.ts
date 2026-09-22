import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TestTemplateEntity } from '../../../c-modules/test-builder/entities/test-template.entity';
import { TestDeviceRunEntity } from './test-device-run.entity';

export type TestSessionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ABORTED';

@Entity('test_sessions')
@Index('idx_test_sessions_so_code', ['soCode'])
@Index('idx_test_sessions_item_code', ['itemCode'])
@Index('idx_test_sessions_status', ['status'])
export class TestSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sessionCode: string;

  @Column({ type: 'varchar', length: 100 })
  soCode: string;

  @Column({ type: 'varchar', length: 100 })
  itemCode: string;

  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  @ManyToOne(() => TestTemplateEntity, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'templateId' })
  template?: TestTemplateEntity;

  @Column({ type: 'int', default: 0 })
  totalDevices: number;

  @Column({ type: 'int', default: 0 })
  passedDevices: number;

  @Column({ type: 'int', default: 0 })
  failedDevices: number;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status: TestSessionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  operatorId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: Record<string, any>;

  @OneToMany(() => TestDeviceRunEntity, (run) => run.session, {
    cascade: true,
  })
  deviceRuns: TestDeviceRunEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
