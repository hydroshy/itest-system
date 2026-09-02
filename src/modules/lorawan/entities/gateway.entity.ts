import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NetworkServerEntity } from '../../network-servers/entities/network-server.entity';

@Entity('gateways')
export class GatewayEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  gatewayEUI: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  networkServerId: string;

  @Column({ nullable: true })
  regionProfileId: string;

  @ManyToOne(() => NetworkServerEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'networkServerId' })
  networkServer?: NetworkServerEntity;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ type: 'float', nullable: true })
  altitude: number;

  @Column({ default: 'ONLINE' })
  status: string;

  @Column({ nullable: true })
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
