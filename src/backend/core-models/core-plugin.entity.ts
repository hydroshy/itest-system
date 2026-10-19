import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { PluginType, PluginStatus } from '../plugins/plugin-manifest.interface';

@Entity({ name: 'core_plugins' })
@Index('idx_core_plugins_type', ['type'])
@Index('idx_core_plugins_status', ['status'])
export class CorePluginEntity {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 64 })
  version: string;

  @Column({
    type: 'varchar',
    length: 64,
  })
  type: PluginType;

  @Column({ type: 'varchar', length: 128, default: 'public' })
  schemaName: string;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'ACTIVE',
  })
  status: PluginStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  author?: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  license?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  repositoryUrl?: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  bundleUrl?: string;

  @Column({ type: 'varchar', length: 32, default: 'ESM' })
  bundleType?: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  manifest?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  uiEntry?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  backendEntry?: Record<string, any>;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  permissions?: string[];

  @Column({ type: 'boolean', default: false })
  isBuiltIn?: boolean;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @Column({
    type: 'jsonb',
    default: () => `'{}'`,
  })
  config: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
