import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Loan } from '../../loans/entities/loan.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: 'user' })
  role: string;

  @Column({ type: 'varchar', nullable: true })
  createdAt: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @OneToMany('Loan', 'user')
  loans: any[];
}
