import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestTemplateEntity } from './test-template.entity';

@Entity('test_assertions')
export class TestAssertionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  templateId: string;

  @ManyToOne(() => TestTemplateEntity, (template) => template.assertions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'templateId' })
  template: TestTemplateEntity;

  @Column({ type: 'varchar', length: 255 })
  fieldName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fieldLabel?: string;

  @Column({ type: 'varchar', length: 50 })
  operator:
    | 'EQUALS'
    | 'NOT_EQUALS'
    | 'GREATER_THAN'
    | 'LESS_THAN'
    | 'IN_RANGE'
    | 'BETWEEN'
    | 'REGEX'
    | 'IS_NOT_NULL'
    | 'CONTAINS';

  @Column({ type: 'jsonb', nullable: true })
  expectedValue: any;

  @Column({ type: 'double precision', default: 0 })
  tolerance: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string;

  @Column({ type: 'varchar', length: 50, default: 'ERROR' })
  severity: 'ERROR' | 'WARNING';

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
