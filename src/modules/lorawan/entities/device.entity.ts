import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NetworkServerEntity } from '../../network-servers/entities/network-server.entity';
import { User } from '../../users/entities/user.entity';

@Entity('devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  devEUI: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  appId: string;

  @Column({ nullable: true })
  ownerId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId' })
  owner?: User;

  @Column({ nullable: true })
  networkServerId: string;

  @Column({ nullable: true })
  regionProfileId: string;

  @ManyToOne(() => NetworkServerEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'networkServerId' })
  networkServer?: NetworkServerEntity;

  @Column({ default: 'OTAA' })
  activationMode: string;

  @Column({ length: 255, default: '0102030405060708' })
  appEUI: string;

  @Column({ length: 255, default: '0102030405060708090A0B0C0D0E0F10' })
  appKey: string;

  @Column({ nullable: true })
  nwkSKey: string;

  @Column({ nullable: true })
  appSKey: string;

  @Column({ length: 50, default: 'SYNCED' })
  syncStatus: string;

  @Column({ type: 'jsonb', nullable: true })
  syncDetails: Record<string, any>;

  @Column({ nullable: true })
  decoderId?: string;

  @Column({ type: 'text', nullable: true })
  payloadFormatterScript: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
