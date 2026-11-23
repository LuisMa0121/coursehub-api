import { Role } from '../../users/enums/role.enum.js';
import {
  CourseNotFoundError,
  CourseOwnershipError,
} from '../domain/course-errors.js';
import type { CourseRepository } from '../domain/course-repository.port.js';
import type { Course } from '../entities/course.entity.js';
import { UpdateCourseUseCase } from './update-course.use-case.js';

/** Repositorio en memoria: la regla se prueba sin HTTP ni TypeORM. */
class InMemoryCourseRepository implements CourseRepository {
  constructor(public items: Course[]) {}
  async findById(id: number) {
    const found = this.items.find((c) => c.id === id);
    return found ? { ...found } : null;
  }
  async save(course: Course) {
    this.items = this.items.map((c) => (c.id === course.id ? { ...course } : c));
    return { ...course };
  }
}

describe('UpdateCourseUseCase', () => {
  let repo: InMemoryCourseRepository;
  let useCase: UpdateCourseUseCase;

  beforeEach(() => {
    repo = new InMemoryCourseRepository([
      { id: 1, title: 'NestJS', level: 'beginner', teacherId: 10 },
    ]);
    useCase = new UpdateCourseUseCase(repo);
  });

  it('el docente propietario actualiza su curso', async () => {
    const result = await useCase.execute({
      courseId: 1,
      changes: { level: 'advanced' },
      actor: { id: 10, role: Role.TEACHER },
    });
    expect(result.level).toBe('advanced');
    expect(repo.items[0].level).toBe('advanced');
  });

  it('un docente ajeno es rechazado y no se persiste nada', async () => {
    await expect(
      useCase.execute({
        courseId: 1,
        changes: { level: 'advanced' },
        actor: { id: 99, role: Role.TEACHER },
      }),
    ).rejects.toBeInstanceOf(CourseOwnershipError);
    expect(repo.items[0].level).toBe('beginner');
  });

  it('un admin puede actualizar cursos de cualquier docente', async () => {
    const result = await useCase.execute({
      courseId: 1,
      changes: { title: 'Nuevo' },
      actor: { id: 1, role: Role.ADMIN },
    });
    expect(result.title).toBe('Nuevo');
  });

  it('un curso inexistente produce CourseNotFoundError', async () => {
    await expect(
      useCase.execute({ courseId: 999, changes: {} }),
    ).rejects.toBeInstanceOf(CourseNotFoundError);
  });
});
