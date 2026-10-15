import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import type { Repository } from 'typeorm';
import { CoursesService } from './courses.service.js';
import { Course } from './entities/course.entity.js';

describe('CoursesService', () => {
  let service: CoursesService;
  let items: Course[];
  let nextId: number;

  beforeEach(() => {
    items = [
      { id: 1, title: 'NestJS Fundamentals', level: 'beginner' },
      { id: 2, title: 'REST APIs with NestJS', level: 'beginner' },
      { id: 3, title: 'NestJS Architecture', level: 'intermediate' },
    ];
    nextId = 4;

    const mockRepo = {
      findAndCount: vi.fn().mockImplementation((options?: { where?: { level?: string }; order?: Record<string, 'ASC' | 'DESC'>; skip?: number; take?: number }) => {
        const level = options?.where?.level;
        let filtered = level ? items.filter((item) => item.level === level) : [...items];
        const total = filtered.length;
        const skip = options?.skip ?? 0;
        const take = options?.take ?? 10;
        filtered = filtered.slice(skip, skip + take);
        return Promise.resolve([filtered, total]);
      }),
      findOneBy: vi.fn().mockImplementation(({ id }: { id: number }) => {
        return Promise.resolve(items.find((item) => item.id === id) ?? null);
      }),
      create: vi.fn().mockImplementation((dto: Partial<Course>) => ({ ...dto })),
      save: vi.fn().mockImplementation((course: Course) => {
        if (!course.id) {
          course.id = nextId++;
          items.push(course);
        } else {
          const index = items.findIndex((i) => i.id === course.id);
          if (index !== -1) items[index] = course;
        }
        return Promise.resolve({ ...course });
      }),
      remove: vi.fn().mockImplementation((course: Course) => {
        items = items.filter((item) => item.id !== course.id);
        return Promise.resolve(course);
      }),
    } as unknown as Repository<Course>;

    service = new CoursesService(mockRepo);
  });

  it('empieza con tres cursos y filtra sin modificar la colección', async () => {
    const original = await service.findAll();
    expect(original.items).toHaveLength(3);
    const beginnerRes = await service.findAll('beginner');
    expect(beginnerRes.items).toEqual(
      items.filter((course) => course.level === 'beginner'),
    );
    const expertRes = await service.findAll('expert');
    expect(expertRes.items).toEqual([]);
    expect(await service.findAll()).toEqual(original);
  });

  it('asigna ids nuevos aunque se elimine el último curso creado', async () => {
    const first = await service.create({ title: 'Curso nuevo', level: 'beginner' });
    const removed = await service.remove(String(first.id));
    const second = await service.create({ title: 'Otro curso', level: 'advanced' });

    expect(removed).toEqual(first);
    expect(second.id).toBeGreaterThan(first.id);
    const all = await service.findAll();
    expect(new Set(all.items.map((course) => course.id)).size).toBe(all.items.length);
    await expect(service.findOne(String(first.id))).rejects.toThrow(NotFoundException);
  });

  it('conserva los campos omitidos al actualizar y persiste el cambio', async () => {
    const original = await service.findOne('1');
    const updated = await service.update('1', { level: 'advanced' });

    expect(updated).toEqual({ ...original, level: 'advanced' });
    expect(await service.findOne('1')).toEqual(updated);
    expect(await service.update('1', {})).toEqual(updated);
  });

  it.each(['999', 'no-es-un-id', '1abc'])(
    'rechaza el id ausente %s sin modificar los cursos',
    async (id) => {
      const original = await service.findAll();
      const message = `Course with id ${id} not found`;

      await expect(service.findOne(id)).rejects.toThrow(new NotFoundException(message));
      await expect(service.update(id, { level: 'advanced' })).rejects.toThrow(
        new NotFoundException(message),
      );
      await expect(service.remove(id)).rejects.toThrow(new NotFoundException(message));
      expect(await service.findAll()).toEqual(original);
    },
  );

  it('elimina el curso solicitado y rechaza una segunda eliminación', async () => {
    const removed = await service.findOne('2');

    expect(await service.remove('2')).toEqual(removed);
    const remaining = await service.findAll();
    expect(remaining.items.map((course) => course.id)).toEqual([1, 3]);
    await expect(service.remove('2')).rejects.toThrow(NotFoundException);
    expect((await service.findAll()).items).toHaveLength(2);
  });
});
