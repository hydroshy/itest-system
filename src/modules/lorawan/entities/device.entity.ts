import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ default: 'OTAA' })
  activationMode: string;

  @Column({ nullable: true })
  appKey: string;

  @Column({ nullable: true })
  nwkSKey: string;

  @Column({ nullable: true })
  appSKey: string;

  @Column({ type: 'text', nullable: true })
  payloadFormatterScript: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
