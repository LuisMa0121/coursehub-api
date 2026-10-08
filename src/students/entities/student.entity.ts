import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  age: number;

  @Column()
  career: string;

  @Column()
  semester: number;

  @Column({ default: true })
  isActive: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @OneToMany('Enrollment', 'student')
  enrollments: any[];
}
