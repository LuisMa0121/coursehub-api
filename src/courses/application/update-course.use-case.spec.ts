import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { Role } from '../../users/enums/role.enum.js';
import {
  CourseNotFoundError,
  CourseOwnershipError,
} from '../domain/course-errors.js';
import { COURSE_REPOSITORY } from '../domain/course-repository.port.js';
import type { Course } from '../entities/course.entity.js';
import { UpdateCourseUseCase } from './update-course.use-case.js';

/**
 * Pruebas unitarias de la regla de negocio (Semana 12 · Sesión 23).
 * El repositorio se simula: no hay HTTP, PostgreSQL ni TypeORM.
 * Cada caso sigue Arrange-Act-Assert y protege una sola decisión.
 */
describe('UpdateCourseUseCase', () => {
  // Doble controlado que reemplaza al adaptador TypeORM
  const courses = {
    findById: vi.fn(),
    save: vi.fn(),
  };
  let useCase: UpdateCourseUseCase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UpdateCourseUseCase,
        { provide: COURSE_REPOSITORY, useValue: courses },
      ],
    }).compile();
    useCase = module.get(UpdateCourseUseCase);
    vi.clearAllMocks();
  });

  it('permite al docente propietario actualizar su curso', async () => {
    // Arrange
    const course = { id: 7, title: 'NestJS', level: 'beginner', teacherId: 4 } as Course;
    courses.findById.mockResolvedValue(course);
    courses.save.mockImplementation(async (value: Course) => value);

    // Act
    const result = await useCase.execute(
      7,
      { title: 'NestJS avanzado' },
      { id: 4, role: Role.TEACHER },
    );

    // Assert
    expect(result.title).toBe('NestJS avanzado');
    expect(courses.findById).toHaveBeenCalledWith(7);
    expect(courses.save).toHaveBeenCalledWith(course);
  });

  it('rechaza la actualización de un docente distinto al propietario y no guarda nada', async () => {
    courses.findById.mockResolvedValue({ id: 7, title: 'NestJS', level: 'beginner', teacherId: 4 });

    await expect(
      useCase.execute(7, { title: 'Cambio' }, { id: 9, role: Role.TEACHER }),
    ).rejects.toThrow(CourseOwnershipError);
    expect(courses.save).not.toHaveBeenCalled();
  });

  it('lanza CourseNotFoundError cuando el curso no existe y no guarda nada', async () => {
    courses.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(999, { title: 'Cambio' }, { id: 4, role: Role.TEACHER }),
    ).rejects.toThrow(CourseNotFoundError);
    expect(courses.save).not.toHaveBeenCalled();
  });

  it('permite al administrador actualizar el curso de cualquier docente', async () => {
    const course = { id: 7, title: 'NestJS', level: 'beginner', teacherId: 4 } as Course;
    courses.findById.mockResolvedValue(course);
    courses.save.mockImplementation(async (value: Course) => value);

    const result = await useCase.execute(7, { level: 'advanced' }, { id: 1, role: Role.ADMIN });

    expect(result.level).toBe('advanced');
    expect(courses.save).toHaveBeenCalledTimes(1);
  });

  it('permite a un docente editar un curso sin propietario asignado', async () => {
    const course = { id: 8, title: 'Legado', level: 'beginner' } as Course;
    courses.findById.mockResolvedValue(course);
    courses.save.mockImplementation(async (value: Course) => value);

    const result = await useCase.execute(8, { title: 'Legado v2' }, { id: 9, role: Role.TEACHER });

    expect(result.title).toBe('Legado v2');
  });

  it('sin actor autenticado no aplica la regla de propiedad (comportamiento actual de la API)', async () => {
    const course = { id: 7, title: 'NestJS', level: 'beginner', teacherId: 4 } as Course;
    courses.findById.mockResolvedValue(course);
    courses.save.mockImplementation(async (value: Course) => value);

    const result = await useCase.execute(7, { title: 'Anónimo' }, null);

    expect(result.title).toBe('Anónimo');
    expect(courses.save).toHaveBeenCalledTimes(1);
  });

  it('conserva los campos que no vienen en los cambios', async () => {
    const course = { id: 7, title: 'NestJS', level: 'beginner', teacherId: 4 } as Course;
    courses.findById.mockResolvedValue(course);
    courses.save.mockImplementation(async (value: Course) => value);

    const result = await useCase.execute(7, { level: 'advanced' }, { id: 4, role: Role.TEACHER });

    expect(result).toEqual({ id: 7, title: 'NestJS', level: 'advanced', teacherId: 4 });
  });
});
