import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FinalConfigSessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED',
}

@Entity({ schema: 'finalconfig_manager', name: 'finalconfig_execution_session' })
export class FinalConfigExecutionSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_finalconfig_exec_session_profile')
  @Column({ name: 'profile_id', type: 'uuid' })
  profileId: string;

  @Column({ name: 'device_id', type: 'varchar', length: 100, nullable: true })
  deviceId: string | null;

  @Column({ name: 'serial_number', type: 'varchar', length: 100, nullable: true })
  serialNumber: string | null;

  @Index('idx_finalconfig_exec_session_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: FinalConfigSessionStatus.IN_PROGRESS,
  })
  status: FinalConfigSessionStatus;

  @Column({ name: 'current_step', type: 'int', default: 0 })
  currentStep: number;

  @Column({ name: 'total_steps', type: 'int', default: 0 })
  totalSteps: number;

  @Column({ name: 'passed_steps', type: 'int', default: 0 })
  passedSteps: number;

  @Column({ name: 'failed_steps', type: 'int', default: 0 })
  failedSteps: number;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
