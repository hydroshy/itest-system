import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
} from 'typeorm';

export type TestResultStatus = 'PASS' | 'FAIL' | 'PASSED' | 'FAILED' | 'PENDING' | 'TIMEOUT';

@Entity('test_result')
@Index('idx_test_result_so_number', ['soNumber'])
@Index('idx_test_result_serial_number', ['serialNumber'])
@Index('idx_test_result_device_key', ['deviceKey'])
@Index('idx_test_result_item_code', ['itemCode'])
@Index('idx_test_result_sku', ['sku'])
@Index('idx_test_result_result', ['result'])
@Index('idx_test_result_time_finish', ['timeFinish'])
export class TestResultEntity {
  @PrimaryColumn({ name: 'test_result_id', type: 'text' })
  testResultId: string;

  @Column({ name: 'test_id', type: 'text', nullable: true })
  testId?: string;

  @Column({ name: 'so_number', type: 'text', nullable: true })
  soNumber?: string;

  @Column({ name: 'device_key', type: 'text', nullable: true })
  deviceKey?: string;

  @Column({ name: 'serial_number', type: 'text', nullable: true })
  serialNumber?: string;

  @Column({ name: 'item_code', type: 'text', nullable: true })
  itemCode?: string;

  @Column({ name: 'sku', type: 'text', nullable: true })
  sku?: string;

  @Column({ name: 'hw_ver', type: 'text', nullable: true })
  hwVer?: string;

  @Column({ name: 'fw_ver', type: 'text', nullable: true })
  fwVer?: string;

  @Column({ name: 'result', type: 'text', default: 'PASS' })
  result: string;

  @Column({ name: 'label_check_code', type: 'text', nullable: true })
  labelCheckCode?: string;

  @Column({ name: 'start_time', type: 'text', nullable: true })
  startTime?: string;

  @Column({ name: 'duration_time', type: 'text', nullable: true })
  durationTime?: string;

  @Column({ name: 'time_finish', type: 'bigint', nullable: true })
  timeFinish?: number;

  @Column({ name: 'test_note', type: 'text', nullable: true })
  testNote?: string;

  @Column({ name: 'data_count', type: 'text', nullable: true })
  dataCount?: string;

  @Column({ name: 'actual_cyclic_period', type: 'text', nullable: true })
  actualCyclicPeriod?: string;

  @Column({ name: 'test_station', type: 'text', nullable: true })
  testStation?: string;

  @Column({ name: 'test_person', type: 'text', nullable: true })
  testPerson?: string;

  @Column({ name: 'aux_sn', type: 'text', nullable: true })
  auxSn?: string;

  @Column({ name: 'test_category', type: 'text', nullable: true })
  testCategory?: string;

  @Column({ name: 'parameters_name_string', type: 'text', nullable: true })
  parametersNameString?: string;

  @Column({ name: 'configuration_string', type: 'text', nullable: true })
  configurationString?: string;

  @Column({ name: 'config_check', type: 'text', nullable: true })
  configCheck?: string;

  @Column({ name: 'date_config', type: 'text', nullable: true })
  dateConfig?: string;

  @Column({ name: 'config_note', type: 'text', nullable: true })
  configNote?: string;

  @Column({ name: 'write_counter', type: 'text', nullable: true })
  writeCounter?: string;

  @Column({ name: 'parameters_type', type: 'text', nullable: true })
  parametersType?: string;

  @Column({ name: 'parameters_length_string', type: 'text', nullable: true })
  parametersLengthString?: string;

  @Column({ name: 'final_config_id', type: 'text', nullable: true })
  finalConfigId?: string;

  @Column({ name: 'epochtime_config', type: 'bigint', nullable: true })
  epochtimeConfig?: number;

  @Column({ name: 'test_confirmation', type: 'boolean', nullable: true })
  testConfirmation?: boolean;

  @Column({ name: 'epochtime_confirm', type: 'bigint', nullable: true })
  epochtimeConfirm?: number;

  @Column({ name: 'date_confirm', type: 'text', nullable: true })
  dateConfirm?: string;

  @Column({ name: 'confirm_person', type: 'text', nullable: true })
  confirmPerson?: string;

  @Column({ name: 'confirm_id', type: 'text', nullable: true })
  confirmId?: string;

  @Column({ name: 'confirm_note', type: 'text', nullable: true })
  confirmNote?: string;

  @Column({ name: 'avg_com1', type: 'text', nullable: true })
  avgCom1?: string;

  @Column({ name: 'setup_time', type: 'text', nullable: true })
  setupTime?: string;

  @Column({ name: 'secondary_key', type: 'text', nullable: true })
  secondaryKey?: string;

  @Column({ name: 'tertiary_key', type: 'text', nullable: true })
  tertiaryKey?: string;

  @Column({ name: 'pac_id', type: 'text', nullable: true })
  pacId?: string;

  @Column({ name: 'dev_dup', type: 'text', nullable: true })
  devDup?: string;

  @Column({ name: 'auto_check', type: 'text', nullable: true })
  autoCheck?: string;

  @Column({ name: 'result_detail', type: 'text', nullable: true })
  resultDetail?: string;
}
