import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

@Entity({ schema: 'decoder', name: 'decoder_scripts' })
@Unique('UQ_decoder_scripts_sku_long_fw', ['sku', 'long_fw'])
export class DecoderScriptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Index('idx_decoder_scripts_sku')
  @Column({ name: 'sku', type: 'varchar', length: 100 })
  sku: string;

  @Index('idx_decoder_scripts_long_fw')
  @Column({ name: 'long_fw', type: 'varchar', length: 100 })
  long_fw: string;

  @Column({ name: 'script', type: 'text' })
  script: string;

  @Column({ name: 'protocol', type: 'varchar', length: 50, default: 'lorawan' })
  protocol: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'input_format', type: 'varchar', length: 50, default: 'hex' })
  input_format: string;

  @Column({ name: 'sample_payload', type: 'text', nullable: true })
  sample_payload?: string | null;

  @Column({ name: 'sample_fport', type: 'integer', default: 1 })
  sample_fport: number;

  @Column({ name: 'sample_decoded', type: 'jsonb', nullable: true })
  sample_decoded?: Record<string, any> | null;

  @Index('idx_decoder_scripts_is_active')
  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, any>;

  @Column({ name: 'created_by', type: 'varchar', length: 100, nullable: true })
  created_by?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at: Date;
}
