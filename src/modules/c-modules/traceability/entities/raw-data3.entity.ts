import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
} from 'typeorm';

@Entity('raw_data3')
@Index('idx_sn_epochtime', ['sn', 'epochtime'])
@Index('idx_raw_data3_sn', ['sn'])
@Index('idx_raw_data3_device_key', ['deviceKey'])
@Index('idx_raw_data3_epochtime', ['epochtime'])
@Index('idx_raw_data3_test_id', ['testId'])
export class RawData3Entity {
  @PrimaryColumn({ name: 'sn', type: 'text' })
  sn: string;

  @PrimaryColumn({ name: 'epochtime', type: 'bigint' })
  epochtime: number;

  @Column({ name: 'device_key', type: 'text', nullable: true })
  deviceKey?: string;

  @Column({ name: 'test_id', type: 'text', nullable: true })
  testId?: string;

  @Column({ name: 'raw_data_id', type: 'text', nullable: true })
  rawDataId?: string;

  @Column({ name: 'timestamp', type: 'text', nullable: true })
  timestamp?: string;

  @Column({ name: 'com1', type: 'text', nullable: true })
  com1?: string;

  @Column({ name: 'com2', type: 'text', nullable: true })
  com2?: string;

  @Column({ name: 'uplink_payload', type: 'text', nullable: true })
  uplinkPayload?: string;

  @Column({ name: 'combine_name', type: 'text', nullable: true })
  combineName?: string;

  @Column({ name: 'p1', type: 'text', nullable: true })
  p1?: string;

  @Column({ name: 'p2', type: 'text', nullable: true })
  p2?: string;

  @Column({ name: 'p3', type: 'text', nullable: true })
  p3?: string;

  @Column({ name: 'p4', type: 'text', nullable: true })
  p4?: string;

  @Column({ name: 'p5', type: 'text', nullable: true })
  p5?: string;

  @Column({ name: 'p6', type: 'text', nullable: true })
  p6?: string;

  @Column({ name: 'p7', type: 'text', nullable: true })
  p7?: string;

  @Column({ name: 'p8', type: 'text', nullable: true })
  p8?: string;

  @Column({ name: 'p9', type: 'text', nullable: true })
  p9?: string;

  @Column({ name: 'p10', type: 'text', nullable: true })
  p10?: string;

  @Column({ name: 'p11', type: 'text', nullable: true })
  p11?: string;

  @Column({ name: 'p12', type: 'text', nullable: true })
  p12?: string;

  @Column({ name: 'p13', type: 'text', nullable: true })
  p13?: string;

  @Column({ name: 'p14', type: 'text', nullable: true })
  p14?: string;

  @Column({ name: 'p15', type: 'text', nullable: true })
  p15?: string;

  @Column({ name: 'p16', type: 'text', nullable: true })
  p16?: string;

  @Column({ name: 'p17', type: 'text', nullable: true })
  p17?: string;

  @Column({ name: 'p18', type: 'text', nullable: true })
  p18?: string;

  @Column({ name: 'p19', type: 'text', nullable: true })
  p19?: string;

  @Column({ name: 'p20', type: 'text', nullable: true })
  p20?: string;

  @Column({ name: 'p21', type: 'text', nullable: true })
  p21?: string;

  @Column({ name: 'p22', type: 'text', nullable: true })
  p22?: string;

  @Column({ name: 'p23', type: 'text', nullable: true })
  p23?: string;

  @Column({ name: 'p24', type: 'text', nullable: true })
  p24?: string;

  @Column({ name: 'p25', type: 'text', nullable: true })
  p25?: string;

  @Column({ name: 'p26', type: 'text', nullable: true })
  p26?: string;

  @Column({ name: 'p27', type: 'text', nullable: true })
  p27?: string;

  @Column({ name: 'p28', type: 'text', nullable: true })
  p28?: string;

  @Column({ name: 'p29', type: 'text', nullable: true })
  p29?: string;

  @Column({ name: 'p30', type: 'text', nullable: true })
  p30?: string;

  @Column({ name: 'p31', type: 'text', nullable: true })
  p31?: string;

  @Column({ name: 'p32', type: 'text', nullable: true })
  p32?: string;

  @Column({ name: 'p33', type: 'text', nullable: true })
  p33?: string;

  @Column({ name: 'p34', type: 'text', nullable: true })
  p34?: string;

  @Column({ name: 'p35', type: 'text', nullable: true })
  p35?: string;

  @Column({ name: 'received_epochtime', type: 'bigint', nullable: true })
  receivedEpochtime?: number;

  @Column({ name: 'received_time', type: 'text', nullable: true })
  receivedTime?: string;

  @Column({ name: 'spreading_factor', type: 'numeric', nullable: true })
  spreadingFactor?: number;

  @Column({ name: 'test_category', type: 'text', nullable: true })
  testCategory?: string;

  @Column({ name: 'seq_number', type: 'text', nullable: true })
  seqNumber?: string;
}
