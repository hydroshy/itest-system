import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type PluginAuditAction =
  | 'INSTALL'
  | 'UPDATE'
  | 'ENABLE'
  | 'DISABLE'
  | 'UNINSTALL'
  | 'CONFIG_CHANGE'
  | 'ERROR';

@Entity({ name: 'plugin_audit_logs', schema: 'public' })
@Index('idx_plugin_audit_plugin_id', ['pluginId'])
@Index('idx_plugin_audit_action', ['action'])
export class PluginAuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 128 })
  pluginId: string;

  @Column({ type: 'varchar', length: 64 })
  version: string;

  @Column({ type: 'varchar', length: 32 })
  action: PluginAuditAction;

  @Column({ type: 'varchar', length: 128, default: 'system' })
  operator: string;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  details: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
