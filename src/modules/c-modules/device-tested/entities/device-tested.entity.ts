import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export type DeviceTestedStatus = 'PASS' | 'PASSED' | 'FAIL' | 'FAILED' | 'PENDING';

@Entity('device_tested', { synchronize: false })
@Unique('UQ_device_tested_sn_item', ['serial_number', 'item_code'])
@Index('idx_device_tested_serial_number', ['serial_number'])
@Index('idx_device_tested_item_code', ['item_code'])
@Index('idx_device_tested_so', ['so'])
@Index('idx_device_tested_dev_eui', ['dev_eui'])
@Index('idx_device_tested_status', ['status'])
@Index('idx_device_tested_tested_at', ['tested_at'])
@Index('idx_device_tested_created_at', ['created_at'])
export class DeviceTestedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'so', type: 'varchar', length: 100 })
  so: string;

  @Column({ name: 'item_code', type: 'varchar', length: 100 })
  item_code: string;

  get itemCode(): string {
    return this.item_code;
  }
  set itemCode(val: string) {
    this.item_code = val;
  }

  @Column({ name: 'serial_number', type: 'varchar', length: 100 })
  serial_number: string;

  get serialNumber(): string {
    return this.serial_number;
  }
  set serialNumber(val: string) {
    this.serial_number = val;
  }

  @Column({ name: 'dev_eui', type: 'varchar', length: 50 })
  dev_eui: string;

  get devEui(): string {
    return this.dev_eui;
  }
  set devEui(val: string) {
    this.dev_eui = val;
  }

  @Column({ name: 'sku', type: 'varchar', length: 100 })
  sku: string;

  @Column({ name: 'firmware_version', type: 'varchar', length: 50 })
  firmware_version: string;

  get firmwareVersion(): string {
    return this.firmware_version;
  }
  set firmwareVersion(val: string) {
    this.firmware_version = val;
  }

  @Column({ name: 'short_fw', type: 'int', default: 1 })
  short_fw: number;

  get shortFw(): number {
    return this.short_fw;
  }
  set shortFw(val: number) {
    this.short_fw = val;
  }

  @Column({ name: 'sensor_type', type: 'int', default: 0 })
  sensor_type: number;

  get sensorType(): number {
    return this.sensor_type;
  }
  set sensorType(val: number) {
    this.sensor_type = val;
  }

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'PASS' })
  status: DeviceTestedStatus;

  @Column({ name: 'station_id', type: 'varchar', length: 100, default: 'STATION-01', nullable: true })
  station_id?: string;

  get stationId(): string | undefined {
    return this.station_id;
  }
  set stationId(val: string | undefined) {
    this.station_id = val;
  }

  @Column({ name: 'operator', type: 'varchar', length: 100, default: 'admin', nullable: true })
  operator?: string;

  @Column({ name: 'app_key', type: 'varchar', length: 100, nullable: true })
  app_key?: string;

  get appKey(): string | undefined {
    return this.app_key;
  }
  set appKey(val: string | undefined) {
    this.app_key = val;
  }

  @Column({ name: 'tested_at', type: 'timestamptz', default: () => 'NOW()' })
  tested_at: Date;

  get testedAt(): Date {
    return this.tested_at;
  }
  set testedAt(val: Date) {
    this.tested_at = val;
  }

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'metadata', type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  get createdAt(): Date {
    return this.created_at;
  }
  set createdAt(val: Date) {
    this.created_at = val;
  }

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  get updatedAt(): Date {
    return this.updated_at;
  }
  set updatedAt(val: Date) {
    this.updated_at = val;
  }
}
