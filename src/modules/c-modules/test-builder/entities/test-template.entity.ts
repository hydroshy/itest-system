import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TestAssertionEntity } from './test-assertion.entity';

@Entity('test_templates')
export class TestTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255 })
  sku: string;

  @Column({ type: 'varchar', length: 100 })
  firmwareVersion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  decoderId?: string;

  @Column({ type: 'varchar', length: 50, default: 'FLOW' })
  executionMode: 'FLOW' | 'SCRIPT' | 'HYBRID';

  @Column({ type: 'jsonb', default: () => `'{}'` })
  flowConfig: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  customScript?: string;

  @Column({ type: 'int', default: 60 })
  timeoutSeconds: number;

  @Column({ type: 'int', default: 1 })
  minPacketsRequired: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @OneToMany(() => TestAssertionEntity, (assertion) => assertion.template, {
    cascade: true,
  })
  assertions: TestAssertionEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
