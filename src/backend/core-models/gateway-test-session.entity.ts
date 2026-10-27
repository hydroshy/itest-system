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

  // --- Traceability & Gateway Metadata (Migration 005) ---
  @Index('idx_gw_test_sessions_so_number')
  @Column({ name: 'so_number', type: 'varchar', length: 100, nullable: true })
  so_number?: string | null;

  @Index('idx_gw_test_sessions_wa_number')
  @Column({ name: 'wa_number', type: 'varchar', length: 100, nullable: true })
  wa_number?: string | null;

  @Index('idx_gw_test_sessions_serial_number')
  @Column({ name: 'serial_number', type: 'varchar', length: 100, nullable: true })
  serial_number?: string | null;

  @Index('idx_gw_test_sessions_eui')
  @Column({ name: 'eui', type: 'varchar', length: 64, nullable: true })
  eui?: string | null;

  @Index('idx_gw_test_sessions_item_code')
  @Column({ name: 'item_code', type: 'varchar', length: 100, nullable: true })
  item_code?: string | null;

  @Column({ name: 'sku', type: 'varchar', length: 100, nullable: true })
  sku?: string | null;

  @Column({ name: 'gateway_notes', type: 'text', nullable: true })
  gateway_notes?: string | null;

  // Hardware & Firmware
  @Column({ name: 'hardware_version', type: 'varchar', length: 50, nullable: true })
  hardware_version?: string | null;

  @Column({ name: 'firmware_version', type: 'varchar', length: 50, nullable: true })
  firmware_version?: string | null;

  @Column({ name: 'mechanical_version', type: 'varchar', length: 50, nullable: true })
  mechanical_version?: string | null;

  @Column({ name: 'lte_module_serial_number', type: 'varchar', length: 100, nullable: true })
  lte_module_serial_number?: string | null;

  @Column({ name: 'lte_module_imei', type: 'varchar', length: 100, nullable: true })
  lte_module_imei?: string | null;

  // Network & Config
  @Index('idx_gw_test_sessions_gateway_ip')
  @Column({ name: 'gateway_ip', type: 'varchar', length: 45, nullable: true })
  gateway_ip?: string | null;

  @Column({ name: 'internet_test_type', type: 'varchar', length: 20, default: 'ETHERNET' })
  internet_test_type: string;

  @Column({ name: 'region_test', type: 'varchar', length: 50, nullable: true })
  region_test?: string | null;

  @Index('idx_gw_test_sessions_net_srv')
  @Column({ name: 'network_server_id', type: 'uuid', nullable: true })
  network_server_id?: string | null;

  @Column({ name: 'lorawan_frequency_plan', type: 'varchar', length: 50, nullable: true })
  lorawan_frequency_plan?: string | null;

  @Column({ name: 'config_snapshot', type: 'jsonb', default: () => `'{}'::jsonb` })
  config_snapshot: Record<string, any>;

  @Column({ name: 'forwarder_config', type: 'jsonb', default: () => `'{}'::jsonb` })
  forwarder_config: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
