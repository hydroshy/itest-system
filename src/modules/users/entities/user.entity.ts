import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../roles-permissions/entities/role.entity';
import { Permission } from '../../roles-permissions/entities/permission.entity';

export enum UserType {
  ADMIN = 'ADMIN',
  SUB_ADMIN = 'SUB_ADMIN',
  USER = 'USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.USER })
  userType: UserType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  createdById: string; // ID of the Admin / Sub-admin who created this user

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_role',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
