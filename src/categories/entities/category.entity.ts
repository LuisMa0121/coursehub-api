import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @OneToMany('Book', 'category')
  books: any[];
}
