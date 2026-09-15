import { NotFoundException } from '@nestjs/common';
import { CoursesService } from './courses.service.js';

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(() => {
    service = new CoursesService();
  });

  it('empieza con tres cursos y filtra sin modificar la colección', () => {
    const original = structuredClone(service.findAll());
    expect(original).toHaveLength(3);
    expect(service.findAll('beginner')).toEqual(
      original.filter((course) => course.level === 'beginner'),
    );
    expect(service.findAll('expert')).toEqual([]);
    expect(service.findAll()).toEqual(original);
  });

  it('asigna ids nuevos aunque se elimine el último curso creado', () => {
    const first = service.create({ title: 'Curso nuevo', level: 'beginner' });
    const removed = service.remove(String(first.id));
    const second = service.create({ title: 'Otro curso', level: 'advanced' });

    expect(removed).toEqual(first);
    expect(second.id).toBeGreaterThan(first.id);
    expect(new Set(service.findAll().map((course) => course.id)).size).toBe(
      service.findAll().length,
    );
    expect(() => service.findOne(String(first.id))).toThrow(NotFoundException);
  });

  it('conserva los campos omitidos al actualizar y persiste el cambio', () => {
    const original = structuredClone(service.findOne('1'));
    const updated = service.update('1', { level: 'advanced' });

    expect(updated).toEqual({ ...original, level: 'advanced' });
    expect(service.findOne('1')).toEqual(updated);
    expect(service.update('1', {})).toEqual(updated);
  });

  it.each(['999', 'no-es-un-id', '1abc'])(
    'rechaza el id ausente %s sin modificar los cursos',
    (id) => {
      const original = structuredClone(service.findAll());
      const message = `Course with id ${id} not found`;

      expect(() => service.findOne(id)).toThrow(new NotFoundException(message));
      expect(() => service.update(id, { level: 'advanced' })).toThrow(
        new NotFoundException(message),
      );
      expect(() => service.remove(id)).toThrow(new NotFoundException(message));
      expect(service.findAll()).toEqual(original);
    },
  );

  it('elimina el curso solicitado y rechaza una segunda eliminación', () => {
    const removed = structuredClone(service.findOne('2'));

    expect(service.remove('2')).toEqual(removed);
    expect(service.findAll().map((course) => course.id)).toEqual([1, 3]);
    expect(() => service.remove('2')).toThrow(NotFoundException);
    expect(service.findAll()).toHaveLength(2);
  });

  it('una nueva instancia recupera los datos iniciales en memoria', () => {
    const original = structuredClone(service.findAll());
    service.update('1', { title: 'Cambio temporal' });
    service.remove('2');
    service.create({ title: 'Temporal', level: 'advanced' });

    const restarted = new CoursesService();
    expect(restarted.findAll()).toEqual(original);
  });
});
