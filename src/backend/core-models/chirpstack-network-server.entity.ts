import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'lorawan_chirpstack', name: 'network_servers' })
@Index('idx_lorawan_cs_network_servers_is_active', ['isActive'])
@Index('idx_lorawan_cs_network_servers_tenant_id', ['tenantId'])
@Index('idx_lorawan_cs_network_servers_app_id', ['applicationId'])
@Index('idx_lorawan_cs_network_servers_dev_profile_id', ['deviceProfileId'])
export class ChirpstackNetworkServerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ name: 'api_url', type: 'varchar', length: 255 })
  apiUrl: string;

  @Column({ name: 'api_token', type: 'text' })
  apiToken: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 100, nullable: true })
  tenantId?: string | null;

  @Column({ name: 'application_id', type: 'varchar', length: 100, nullable: true })
  applicationId?: string | null;

  @Column({ name: 'simulation_application_id', type: 'varchar', length: 100, nullable: true })
  simulationApplicationId?: string | null;

  @Column({ name: 'device_profile_id', type: 'varchar', length: 100, nullable: true })
  deviceProfileId?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
