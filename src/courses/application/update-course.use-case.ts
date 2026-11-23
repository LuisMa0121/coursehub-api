import { Inject, Injectable } from '@nestjs/common';
import type { Actor } from '../../auth/decorators/current-user.decorator.js';
import { Role } from '../../users/enums/role.enum.js';
import {
  CourseNotFoundError,
  CourseOwnershipError,
} from '../domain/course-errors.js';
import {
  COURSE_REPOSITORY,
  type CourseRepository,
} from '../domain/course-repository.port.js';
import type { Course } from '../entities/course.entity.js';

export type UpdateCourseChanges = Partial<Pick<Course, 'title' | 'level'>>;

/**
 * Caso de uso: actualizar un curso.
 * Contiene la regla de negocio y la autorización de propiedad.
 * No conoce rutas, decoradores HTTP ni TypeORM.
 */
@Injectable()
export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courses: CourseRepository,
  ) {}

  async execute(
    courseId: number,
    changes: UpdateCourseChanges,
    actor?: Actor | null,
  ): Promise<Course> {
    const course = await this.courses.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }

    // Regla de propiedad: un docente no modifica el curso de otro docente
    if (
      actor?.role === Role.TEACHER &&
      course.teacherId != null &&
      course.teacherId !== actor.id
    ) {
      throw new CourseOwnershipError();
    }

    Object.assign(course, changes);
    return this.courses.save(course);
  }
}
