import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 200 })
  author: string;

  @Column({ length: 13, unique: true })
  isbn: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ length: 100 })
  genre: string;

  @Column({ type: 'int', default: 1 })
  availableCopies: number;
}
