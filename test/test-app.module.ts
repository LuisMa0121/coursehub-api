import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';
import { AuthModule } from '../src/auth/auth.module.js';
import { Book } from '../src/books/book.entity.js';
import { BooksModule } from '../src/books/books.module.js';
import { CategoriesModule } from '../src/categories/categories.module.js';
import { Category } from '../src/categories/entities/category.entity.js';
import { Course } from '../src/courses/entities/course.entity.js';
import { CoursesModule } from '../src/courses/courses.module.js';
import { Enrollment } from '../src/enrollments/entities/enrollment.entity.js';
import { EnrollmentsModule } from '../src/enrollments/enrollments.module.js';
import { Loan } from '../src/loans/entities/loan.entity.js';
import { LoansModule } from '../src/loans/loans.module.js';
import { Student } from '../src/students/entities/student.entity.js';
import { StudentsModule } from '../src/students/students.module.js';
import { User } from '../src/users/entities/user.entity.js';
import { UsersModule } from '../src/users/users.module.js';
import { WelcomeController } from '../src/welcome.controller.js';
import { WelcomeService } from '../src/welcome.service.js';

/**
 * Módulo de prueba que usa SQLite en memoria en lugar de PostgreSQL.
 * Permite correr los tests E2E sin necesidad de una base de datos real.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        () => ({
          JWT_SECRET: 'test_jwt_secret_key_for_testing_purposes',
          JWT_EXPIRES_IN: '1h',
        }),
      ],
    }),
    TypeOrmModule.forRoot({
      type: 'sqljs',
      database: new Uint8Array(),
      entities: [Book, Course, Student, Enrollment, User, Category, Loan],
      synchronize: true,
      dropSchema: true,
      autoSave: false,
    }),
    CoursesModule,
    StudentsModule,
    EnrollmentsModule,
    BooksModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    LoansModule,
  ],
  controllers: [AppController, WelcomeController],
  providers: [AppService, WelcomeService],
})
export class TestAppModule {}
