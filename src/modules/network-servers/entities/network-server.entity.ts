import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NetworkServerType {
  THINGPARK = 'THINGPARK',
  CHIRPSTACK = 'CHIRPSTACK',
}

export interface RegionProfile {
  id: string;
  name: string;
  region: string; // e.g., 'AS923-1', 'AS923-2', 'EU868', 'US915', 'VN920'
  routeRef?: string; // For ThingPark routing profile
  profileId?: string; // For ChirpStack Device/Service Profile ID
  frequencyBand?: string;
  description?: string;
  isActive?: boolean;
}

@Entity('network_servers')
export class NetworkServerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: NetworkServerType.THINGPARK,
  })
  type: NetworkServerType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500, nullable: true })
  apiUrl: string;

  @Column({ type: 'text', nullable: true })
  apiKey: string;

  @Column({ length: 255, nullable: true })
  routeRef: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  regionProfiles: RegionProfile[];

  @Column({ length: 50, default: 'ONLINE' })
  status: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
