import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('uplink_telemetry')
export class TelemetryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  devEUI: string;

  @Column({ type: 'int', default: 1 })
  fPort: number;

  @Column({ type: 'int', default: 1 })
  fCnt: number;

  @Column()
  payloadHex: string;

  @Column({ type: 'jsonb', nullable: true })
  decodedData: Record<string, any>;

  @CreateDateColumn()
  receivedAt: Date;
}
