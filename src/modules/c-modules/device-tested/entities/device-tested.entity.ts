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

  // Legacy SO column
  @Column({ name: 'so', type: 'varchar', length: 100, nullable: true })
  so?: string;

  // Standardized SO column from CSV
  @Column({ name: 'so_number', type: 'varchar', length: 100, nullable: true })
  so_number?: string;

  get soNumber(): string {
    return this.so_number || this.so || '';
  }
  set soNumber(val: string) {
    this.so_number = val;
    this.so = val;
  }

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

  // Legacy DevEUI column
  @Column({ name: 'dev_eui', type: 'varchar', length: 50, nullable: true })
  dev_eui?: string;

  // Standardized DevEUI / Device Key from CSV
  @Column({ name: 'device_key', type: 'varchar', length: 50, nullable: true })
  device_key?: string;

  get devEui(): string {
    return this.device_key || this.dev_eui || '';
  }
  set devEui(val: string) {
    this.dev_eui = val;
    this.device_key = val;
  }

  get deviceKey(): string {
    return this.device_key || this.dev_eui || '';
  }
  set deviceKey(val: string) {
    this.device_key = val;
    this.dev_eui = val;
  }

  @Column({ name: 'sku', type: 'varchar', length: 100, nullable: true })
  sku: string;

  // Legacy Firmware Version column
  @Column({ name: 'firmware_version', type: 'varchar', length: 50, nullable: true })
  firmware_version?: string;

  // Standardized FW Version from CSV
  @Column({ name: 'fw_ver', type: 'varchar', length: 50, nullable: true })
  fw_ver?: string;

  get firmwareVersion(): string {
    return this.fw_ver || this.firmware_version || '';
  }
  set firmwareVersion(val: string) {
    this.firmware_version = val;
    this.fw_ver = val;
  }

  get fwVer(): string {
    return this.fw_ver || this.firmware_version || '';
  }
  set fwVer(val: string) {
    this.fw_ver = val;
    this.firmware_version = val;
  }

  @Column({ name: 'hw_ver', type: 'varchar', length: 50, nullable: true })
  hw_ver?: string;

  get hwVer(): string {
    return this.hw_ver || '';
  }
  set hwVer(val: string) {
    this.hw_ver = val;
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

  // Legacy Status column
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'PASS' })
  status: DeviceTestedStatus;

  // Standardized overall result from CSV ('PASS' | 'FAIL')
  @Column({ name: 'result', type: 'varchar', length: 20, default: 'PASS' })
  result?: string;

  // Automated check status from CSV ('PASS' | 'FAIL')
  @Column({ name: 'auto_check', type: 'varchar', length: 20, default: 'PASS' })
  auto_check?: string;

  @Column({ name: 'test_id', type: 'varchar', length: 150, nullable: true })
  test_id?: string;

  @Column({ name: 'label_check_code', type: 'varchar', length: 50, nullable: true })
  label_check_code?: string;

  @Column({ name: 'start_time', type: 'varchar', length: 50, nullable: true })
  start_time?: string;

  @Column({ name: 'duration_time', type: 'varchar', length: 50, nullable: true })
  duration_time?: string;

  @Column({ name: 'time_finish', type: 'bigint', nullable: true })
  time_finish?: number | string;

  @Column({ name: 'test_station', type: 'varchar', length: 100, nullable: true })
  test_station?: string;

  @Column({ name: 'test_person', type: 'varchar', length: 100, nullable: true })
  test_person?: string;

  @Column({ name: 'test_note', type: 'text', nullable: true })
  test_note?: string;

  @Column({ name: 'test_result_id', type: 'varchar', length: 150, nullable: true })
  test_result_id?: string;

  @Column({ name: 'station_id', type: 'varchar', length: 100, default: 'STATION-01', nullable: true })
  station_id?: string;

  get stationId(): string | undefined {
    return this.station_id || this.test_station;
  }
  set stationId(val: string | undefined) {
    this.station_id = val;
    this.test_station = val;
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

  @Column({ name: 'csv_raw_data', type: 'jsonb', default: {} })
  csv_raw_data: Record<string, any>;

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
