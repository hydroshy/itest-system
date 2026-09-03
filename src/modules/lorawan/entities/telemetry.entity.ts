import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('uplink_telemetry')
export class TelemetryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Index()
  @Column({ name: 'devEui', type: 'varchar', length: 50 })
  devEui: string;

  @Column({ type: 'int', default: 1 })
  fPort: number;

  @Column({ type: 'int', default: 0 })
  fCnt: number;

  @Column({ type: 'int', nullable: true })
  dr?: number;

  @Column({ type: 'boolean', nullable: true })
  adr?: boolean;

  @Column({ type: 'text', nullable: true })
  data?: string;

  @Column({ type: 'text', default: '' })
  payloadHex: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  gatewayId?: string;

  @Column({ type: 'double precision', nullable: true })
  rssi?: number;

  @Column({ type: 'double precision', nullable: true })
  snr?: number;

  @Column({ type: 'int', nullable: true })
  channel?: number;

  @Column({ type: 'bigint', nullable: true })
  frequency?: number;

  @Column({ type: 'int', nullable: true })
  bandwidth?: number;

  @Column({ type: 'int', nullable: true })
  spreadingFactor?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tenantId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  applicationId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceProfileName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  devAddr?: string;

  @Column({ type: 'jsonb', nullable: true })
  object?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  decodedData?: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: 'CHIRPSTACK' })
  serverType: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  receivedAt: Date;

  get devEUI(): string {
    return this.devEui;
  }
  set devEUI(value: string) {
    this.devEui = value;
  }
}
