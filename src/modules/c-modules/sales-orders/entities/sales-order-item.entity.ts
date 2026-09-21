import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { SalesOrderEntity } from './sales-order.entity';
import { TestTemplateEntity } from '../../test-builder/entities/test-template.entity';
import { ItemCodeEntity } from '../../item-codes/entities/item-code.entity';

export enum SalesOrderItemStatus {
  PENDING = 'PENDING',
  TESTING = 'TESTING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

@Entity('sales_order_items')
@Unique('UQ_so_items_so_item_code', ['salesOrderId', 'itemCode'])
export class SalesOrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_sales_order_items_so_id')
  @Column({ type: 'uuid' })
  salesOrderId: string;

  @ManyToOne(() => SalesOrderEntity, (so) => so.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'salesOrderId' })
  salesOrder: SalesOrderEntity;

  @Index('idx_sales_order_items_item_code')
  @Column({ type: 'varchar', length: 100 })
  itemCode: string;

  @Index('idx_sales_order_items_item_code_id')
  @Column({ type: 'uuid', nullable: true })
  itemCodeId?: string;

  @ManyToOne(() => ItemCodeEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'itemCodeId' })
  itemCodeRef?: ItemCodeEntity;

  @Index('idx_sales_order_items_sku')
  @Column({ type: 'varchar', length: 255 })
  sku: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 100, default: '1.0' })
  firmwareVersion: string;

  @Index('idx_sales_order_items_template_id')
  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  @ManyToOne(() => TestTemplateEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'templateId' })
  template?: TestTemplateEntity;

  @Column({ type: 'int', default: 0 })
  testedQuantity: number;

  @Column({ type: 'int', default: 0 })
  passedQuantity: number;

  @Column({ type: 'int', default: 0 })
  failedQuantity: number;

  @Index('idx_sales_order_items_status')
  @Column({ type: 'varchar', length: 50, default: SalesOrderItemStatus.PENDING })
  status: SalesOrderItemStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
