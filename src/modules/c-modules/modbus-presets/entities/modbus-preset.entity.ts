import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface ModbusRegisterItem {
  id: string;
  order?: number;
  checked?: boolean;
  slave?: number;
  fc?: number;
  reg?: number;
  numreg?: number;
  format?: string;
  endianness?: string;
  parameter?: string;
  valuetowrite?: string;
  comment?: string;
  range?: string;
  modbus_reg_hex?: string;
  value_on_memmap?: string;
}

@Entity('modbus_presets')
export class ModbusPresetEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 100, default: 'Custom' })
  profileType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({
    type: 'jsonb',
    default: () => `'[]'`,
  })
  registers: ModbusRegisterItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
