import 'reflect-metadata';
import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
import { DataSource } from 'typeorm';
import { Book } from './books/book.entity.js';
import { Category } from './categories/entities/category.entity.js';
import { Course } from './courses/entities/course.entity.js';
import { Enrollment } from './enrollments/entities/enrollment.entity.js';
import { Loan } from './loans/entities/loan.entity.js';
import { Student } from './students/entities/student.entity.js';
import { User } from './users/entities/user.entity.js';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'coursehub',
  entities: [Book, Course, Student, Enrollment, User, Category, Loan],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});

export default AppDataSource;
