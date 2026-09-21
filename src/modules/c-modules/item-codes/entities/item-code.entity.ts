import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TestTemplateEntity } from '../../test-builder/entities/test-template.entity';

@Entity('item_codes')
export class ItemCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_item_codes_item_code')
  @Column({ type: 'varchar', length: 100, unique: true })
  itemCode: string;

  @Index('idx_item_codes_sku')
  @Column({ type: 'varchar', length: 255 })
  sku: string;

  @Column({ type: 'varchar', length: 100, default: '1.0' })
  firmwareVersion: string;

  @Index('idx_item_codes_sku_fw')
  @Column({ type: 'varchar', length: 255 })
  skuFw: string;

  @Index('idx_item_codes_default_template_id')
  @Column({ type: 'uuid', nullable: true })
  defaultTemplateId?: string;

  @ManyToOne(() => TestTemplateEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'defaultTemplateId' })
  defaultTemplate?: TestTemplateEntity;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index('idx_item_codes_is_active')
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: Record<string, any>;

  @Index('idx_item_codes_created_at')
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
