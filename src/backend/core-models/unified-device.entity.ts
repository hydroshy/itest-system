import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type UnifiedDeviceProtocol = 'MODBUS_RTU' | 'MODBUS_TCP' | 'MQTT' | 'LORAWAN' | 'SERIAL_UART' | 'CUSTOM';
export type UnifiedDeviceStatus = 'ONLINE' | 'OFFLINE' | 'UNPROVISIONED' | 'FAULT';

@Entity({ name: 'unified_devices', schema: 'public' })
@Index('idx_unified_devices_tenant_id', ['tenantId'])
@Index('idx_unified_devices_protocol', ['protocolType'])
@Index('idx_unified_devices_status', ['status'])
export class UnifiedDeviceEntity {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  deviceId: string;

  @Column({ type: 'varchar', length: 128, default: 'default' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 64,
    default: 'CUSTOM',
  })
  protocolType: UnifiedDeviceProtocol;

  @Column({ type: 'varchar', length: 128, nullable: true })
  pluginId?: string;

  @Column({
    type: 'jsonb',
    default: () => `'{}'`,
  })
  connectionConfig: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 32,
    default: 'UNPROVISIONED',
  })
  status: UnifiedDeviceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeen?: Date;

  @Column({
    type: 'jsonb',
    default: () => `'{}'`,
  })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
