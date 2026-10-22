import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum FinalConfigExecutionAction {
  READ = 'READ',
  WRITE = 'WRITE',
  VERIFY = 'VERIFY',
}

export enum FinalConfigExecutionStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  SKIPPED = 'SKIPPED',
}

@Entity({ schema: 'finalconfig_manager', name: 'finalconfig_execution_log' })
export class FinalConfigExecutionLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_finalconfig_exec_log_session')
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'modbus_register_dec', type: 'int' })
  modbusRegisterDec: number;

  @Column({ name: 'modbus_register_hex', type: 'varchar', length: 20, nullable: true })
  modbusRegisterHex: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: FinalConfigExecutionAction.WRITE,
  })
  action: FinalConfigExecutionAction;

  @Column({ name: 'expected_value', type: 'text', nullable: true })
  expectedValue: string | null;

  @Column({ name: 'written_value', type: 'text', nullable: true })
  writtenValue: string | null;

  @Column({ name: 'read_value', type: 'text', nullable: true })
  readValue: string | null;

  @Column({ name: 'raw_hex', type: 'varchar', length: 255, nullable: true })
  rawHex: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: FinalConfigExecutionStatus.PASS,
  })
  status: FinalConfigExecutionStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'duration_ms', type: 'int', default: 0 })
  durationMs: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
