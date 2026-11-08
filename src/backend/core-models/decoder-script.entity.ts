import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ schema: 'decoder', name: 'decoder_scripts' })
export class DecoderScriptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Index('idx_decoder_scripts_sku')
  @Column({ name: 'sku', type: 'varchar', length: 100, nullable: true })
  sku?: string | null;

  @Index('idx_decoder_scripts_long_fw')
  @Column({ name: 'long_fw', type: 'varchar', length: 100, nullable: true })
  long_fw?: string | null;

  @Index('idx_decoder_scripts_item_code')
  @Column({ name: 'item_code', type: 'varchar', length: 100, nullable: true })
  item_code?: string | null;

  @Index('idx_decoder_scripts_fw_code')
  @Column({ name: 'fw_code', type: 'varchar', length: 50, nullable: true })
  fw_code?: string | null;

  @Index('idx_decoder_scripts_fw_version')
  @Column({ name: 'fw_version', type: 'varchar', length: 50, nullable: true })
  fw_version?: string | null;

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
