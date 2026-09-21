import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SalesOrderItemEntity } from './sales-order-item.entity';

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  TESTING = 'TESTING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SalesOrderSource {
  MANUAL = 'MANUAL',
  ODOO = 'ODOO',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  API = 'API',
}

@Entity('sales_orders')
export class SalesOrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_sales_orders_so_code')
  @Column({ type: 'varchar', length: 100, unique: true })
  soCode: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer?: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  orderDate: Date;

  @Index('idx_sales_orders_status')
  @Column({ type: 'varchar', length: 50, default: SalesOrderStatus.DRAFT })
  status: SalesOrderStatus;

  @Index('idx_sales_orders_source')
  @Column({ type: 'varchar', length: 50, default: SalesOrderSource.MANUAL })
  source: SalesOrderSource;

  @Index('idx_sales_orders_odoo_id')
  @Column({ type: 'int', nullable: true })
  odooId?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Index('idx_sales_orders_created_at')
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => SalesOrderItemEntity, (item) => item.salesOrder, {
    cascade: true,
  })
  items: SalesOrderItemEntity[];
}
