import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { UpdateCourseUseCase } from './application/update-course.use-case.js';
import { COURSE_REPOSITORY } from './domain/course-repository.port.js';
import { TypeOrmCourseRepository } from './infrastructure/typeorm-course.repository.js';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { Course } from './entities/course.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Course]), AuthModule],
  controllers: [CoursesController],
  exports: [CoursesService],
  providers: [
    CoursesService,
    UpdateCourseUseCase,
    // El contrato se resuelve con el adaptador TypeORM
    { provide: COURSE_REPOSITORY, useClass: TypeOrmCourseRepository },
  ],
})
export class CoursesModule {}
