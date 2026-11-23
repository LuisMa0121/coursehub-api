import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { Role } from '../users/enums/role.enum.js';
import { UpdateCourseUseCase } from './application/update-course.use-case.js';
import { CoursesController } from './courses.controller.js';
import { CoursesService } from './courses.service.js';
import { CourseOwnershipError } from './domain/course-errors.js';

/**
 * Pruebas del controlador (Semana 12 · Sesión 24).
 * Solo verifican que el puente HTTP delega al caso de uso correcto
 * con el id, el DTO y la identidad autenticada. La regla de propiedad
 * se prueba en update-course.use-case.spec.ts, no aquí.
 */
describe('CoursesController', () => {
  const updateCourse = { execute: vi.fn() };
  let controller: CoursesController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [
        { provide: UpdateCourseUseCase, useValue: updateCourse },
        { provide: CoursesService, useValue: {} },
      ],
    }).compile();
    controller = module.get(CoursesController);
    vi.clearAllMocks();
  });

  it('delega la actualización con el id, el body y el usuario autenticado', async () => {
    const actor = { id: 4, role: Role.TEACHER };
    const dto = { title: 'NestJS avanzado' };
    updateCourse.execute.mockResolvedValue({ id: 7, ...dto });

    await expect(controller.update(7, dto, actor)).resolves.toEqual({ id: 7, ...dto });
    expect(updateCourse.execute).toHaveBeenCalledWith(7, dto, actor);
  });

  it('delega con actor null cuando la solicitud es anónima', async () => {
    const dto = { level: 'advanced' };
    updateCourse.execute.mockResolvedValue({ id: 7, title: 'NestJS', ...dto });

    await controller.update(7, dto, null);

    expect(updateCourse.execute).toHaveBeenCalledWith(7, dto, null);
  });

  it('propaga el error del caso de uso en lugar de convertirlo en una respuesta exitosa', async () => {
    updateCourse.execute.mockRejectedValue(new CourseOwnershipError());

    await expect(
      controller.update(7, { title: 'Cambio' }, { id: 9, role: Role.TEACHER }),
    ).rejects.toThrow(CourseOwnershipError);
  });
});
