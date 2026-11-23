import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../enums/role.enum.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({
    type: 'varchar',
    default: Role.USER,
  })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @OneToMany('Loan', 'user')
  loans?: any[];
}
