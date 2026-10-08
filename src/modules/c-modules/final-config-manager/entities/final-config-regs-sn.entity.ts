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
import { FinalConfigSnEntity } from './final-config-sn.entity';

@Entity('final_config_regs_sn', { synchronize: false })
@Unique('UQ_final_config_regs_sn_serial_item_addr', ['serial_number', 'item_code', 'address'])
@Index('idx_final_config_regs_sn_config_id', ['config_sn_id'])
@Index('idx_final_config_regs_sn_sn_item', ['serial_number', 'item_code'])
@Index('idx_final_config_regs_sn_serial_number', ['serial_number'])
@Index('idx_final_config_regs_sn_item_code', ['item_code'])
@Index('idx_final_config_regs_sn_address', ['address'])
@Index('idx_final_config_regs_sn_status', ['status'])
export class FinalConfigRegsSnEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'config_sn_id', type: 'uuid' })
  config_sn_id: string;

  get configSnId(): string {
    return this.config_sn_id;
  }
  set configSnId(val: string) {
    this.config_sn_id = val;
  }

  @ManyToOne(() => FinalConfigSnEntity, (sn) => sn.registers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'config_sn_id' })
  configSn: FinalConfigSnEntity;

  @Column({ name: 'serial_number', type: 'varchar', length: 100 })
  serial_number: string;

  get serialNumber(): string {
    return this.serial_number;
  }
  set serialNumber(val: string) {
    this.serial_number = val;
  }

  @Column({ name: 'item_code', type: 'varchar', length: 100 })
  item_code: string;

  get itemCode(): string {
    return this.item_code;
  }
  set itemCode(val: string) {
    this.item_code = val;
  }

  // Modbus register address (>= 0 for device snapshot)
  @Column({ name: 'address', type: 'int' })
  address: number;

  @Column({ name: 'modbus_reg_hex', type: 'varchar', length: 20 })
  modbus_reg_hex: string;

  get modbusRegHex(): string {
    return this.modbus_reg_hex;
  }
  set modbusRegHex(val: string) {
    this.modbus_reg_hex = val;
  }

  @Column({ name: 'slave', type: 'int', default: 1 })
  slave: number;

  @Column({ name: 'reg_num', type: 'int', default: 1 })
  reg_num: number;

  get regNum(): number {
    return this.reg_num;
  }
  set regNum(val: number) {
    this.reg_num = val;
  }

  @Column({ name: 'format', type: 'varchar', length: 50, default: 'uint' })
  format: string;

  @Column({ name: 'parameter_name', type: 'varchar', length: 255 })
  parameter_name: string;

  get parameterName(): string {
    return this.parameter_name;
  }
  set parameterName(val: string) {
    this.parameter_name = val;
  }

  @Column({ name: 'value_to_write', type: 'text', nullable: true, default: '' })
  value_to_write: string;

  get valueToWrite(): string {
    return this.value_to_write;
  }
  set valueToWrite(val: string) {
    this.value_to_write = val;
  }

  @Column({ name: 'value_read_back', type: 'text', nullable: true, default: '' })
  value_read_back: string;

  get valueReadBack(): string {
    return this.value_read_back;
  }
  set valueReadBack(val: string) {
    this.value_read_back = val;
  }

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'NONE' })
  status: 'PASS' | 'FAIL' | 'NONE';

  @Column({ name: 'endianness', type: 'varchar', length: 50, default: 'big-endian' })
  endianness: string;

  @Column({ name: 'fn_read', type: 'varchar', length: 20, default: '3' })
  fn_read: string;

  get fnRead(): string {
    return this.fn_read;
  }
  set fnRead(val: string) {
    this.fn_read = val;
  }

  @Column({ name: 'fn_write', type: 'varchar', length: 20, default: '16' })
  fn_write: string;

  get fnWrite(): string {
    return this.fn_write;
  }
  set fnWrite(val: string) {
    this.fn_write = val;
  }

  @Column({ name: 'order_no', type: 'int', default: 0 })
  order_no: number;

  get orderNo(): number {
    return this.order_no;
  }
  set orderNo(val: number) {
    this.order_no = val;
  }

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
