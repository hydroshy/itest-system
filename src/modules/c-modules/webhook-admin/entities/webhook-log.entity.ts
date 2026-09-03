import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('webhook_logs')
export class WebhookLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ length: 50 })
  serverType: string; // 'CHIRPSTACK' | 'THINGPARK' | 'GENERIC'

  @Index()
  @Column({ length: 255 })
  devEUI: string;

  @Column({ type: 'int', default: 1 })
  fPort: number;

  @Column({ type: 'int', default: 0 })
  fCnt: number;

  @Column({ type: 'text', default: '' })
  payloadHex: string;

  @Column({ type: 'jsonb', nullable: true })
  decodedData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, any>;

  @Column({ length: 50, default: 'SUCCESS' })
  status: string; // 'SUCCESS' | 'ERROR'

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  receivedAt: Date;
}
