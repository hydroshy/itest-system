import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // e.g. "lorawan:device:create", "user:subadmin:create"

  @Column({ nullable: true })
  description: string;

  @Column()
  module: string; // e.g. "lorawan", "users", "gateways"

  @Column()
  action: string; // e.g. "read", "write", "delete", "manage"

  @CreateDateColumn()
  createdAt: Date;
}
