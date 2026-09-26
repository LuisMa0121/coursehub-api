import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller.js';
import { AppService } from '../src/app.service.js';
import { Book } from '../src/books/book.entity.js';
import { BooksModule } from '../src/books/books.module.js';
import { CoursesModule } from '../src/courses/courses.module.js';
import { EnrollmentsModule } from '../src/enrollments/enrollments.module.js';
import { StudentsModule } from '../src/students/students.module.js';
import { WelcomeController } from '../src/welcome.controller.js';
import { WelcomeService } from '../src/welcome.service.js';

/**
 * Módulo de prueba que usa SQLite en memoria en lugar de PostgreSQL.
 * Permite correr los tests E2E sin necesidad de una base de datos real.
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqljs',
      database: new Uint8Array(),
      entities: [Book],
      synchronize: true,
      dropSchema: true,
      autoSave: false,
    }),
    CoursesModule,
    StudentsModule,
    EnrollmentsModule,
    BooksModule,
  ],
  controllers: [AppController, WelcomeController],
  providers: [AppService, WelcomeService],
})
export class TestAppModule {}
