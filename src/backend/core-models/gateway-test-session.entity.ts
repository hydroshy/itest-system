import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ schema: 'devices', name: 'gateway_test_sessions' })
export class GatewayTestSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_gateway_test_sessions_gateway_id')
  @Column({ name: 'gateway_id', type: 'varchar', length: 64 })
  gateway_id: string;

  @Column({ name: 'gateway_name', type: 'varchar', length: 255, nullable: true })
  gateway_name?: string | null;

  @Column({ name: 'session_name', type: 'varchar', length: 255, nullable: true })
  session_name?: string | null;

  @Index('idx_gateway_test_sessions_status')
  @Column({ name: 'status', type: 'varchar', length: 50, default: 'IN_PROGRESS' })
  status: string;

  @Column({ name: 'started_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  ended_at?: Date | null;

  @Column({ name: 'summary', type: 'jsonb', default: () => `'{}'::jsonb` })
  summary: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
