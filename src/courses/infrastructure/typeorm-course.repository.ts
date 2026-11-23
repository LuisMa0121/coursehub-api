import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CourseRepository } from '../domain/course-repository.port.js';
import { Course } from '../entities/course.entity.js';

/** Adaptador de persistencia: único punto del caso de uso que conoce TypeORM. */
@Injectable()
export class TypeOrmCourseRepository implements CourseRepository {
  constructor(
    @InjectRepository(Course)
    private readonly repository: Repository<Course>,
  ) {}

  findById(id: number): Promise<Course | null> {
    return this.repository.findOneBy({ id });
  }

  save(course: Course): Promise<Course> {
    return this.repository.save(course);
  }
}
