import type { Course } from '../entities/course.entity.js';

/** Token de inyección del contrato (las interfaces no existen en runtime). */
export const COURSE_REPOSITORY = Symbol('COURSE_REPOSITORY');

/** Contrato pequeño: solo lo que el caso de uso necesita. */
export interface CourseRepository {
  findById(id: number): Promise<Course | null>;
  save(course: Course): Promise<Course>;
}
