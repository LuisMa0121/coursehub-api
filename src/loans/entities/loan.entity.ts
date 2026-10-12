import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Book } from '../../books/book.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne('Book', (book: Book) => book.loans, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @ManyToOne('User', (user: User) => user.loans, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', nullable: true })
  loanDate: string;

  @Column({ type: 'varchar', nullable: true })
  returnDate: string | null;

  @Column({ default: 'active' })
  status: string; // 'active' | 'returned'
}
