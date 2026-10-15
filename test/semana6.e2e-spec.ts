import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/setup-app.js';

describe('Semana 6 - Consultas, Paginación, Filtros y Búsqueda (E2E)', () => {
  let app: INestApplication;
  const courseIds: number[] = [];
  let student1Id: number;
  let student2Id: number;
  let inactiveStudentId: number;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();

    // 1. Crear 8 cursos variados para demostrar paginación real (Paso 1 de la demostración)
    const coursesToCreate = [
      { title: 'TypeScript Básico', level: 'beginner' },
      { title: 'NestJS Fundamentals', level: 'beginner' },
      { title: 'REST APIs con NestJS', level: 'beginner' },
      { title: 'Microservicios con NestJS', level: 'intermediate' },
      { title: 'Arquitectura Hexagonal', level: 'intermediate' },
      { title: 'GraphQL y Apollo', level: 'intermediate' },
      { title: 'DevOps para Backend', level: 'advanced' },
      { title: 'Seguridad y Pentesting', level: 'advanced' },
    ];

    for (const c of coursesToCreate) {
      const res = await request(app.getHttpServer())
        .post('/courses')
        .send(c)
        .expect(201);
      courseIds.push(res.body.id);
    }

    // 2. Crear estudiantes (2 activos y 1 inactivo)
    const st1 = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Carlos Mendoza',
        email: 'carlos@example.com',
        age: 21,
        career: 'Software',
        semester: 4,
        isActive: true,
      })
      .expect(201);
    student1Id = st1.body.id;

    const st2 = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Ana María Gómez',
        email: 'ana@example.com',
        age: 22,
        career: 'Computación',
        semester: 6,
        isActive: true,
      })
      .expect(201);
    student2Id = st2.body.id;

    const st3 = await request(app.getHttpServer())
      .post('/students')
      .send({
        name: 'Pedro Inactivo',
        email: 'pedro@example.com',
        age: 23,
        career: 'TI',
        semester: 5,
        isActive: false,
      })
      .expect(201);
    inactiveStudentId = st3.body.id;

    // 3. Crear matrículas
    await request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId: student1Id, courseId: courseIds[0] }) // Carlos en TypeScript Básico
      .expect(201);

    await request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId: student1Id, courseId: courseIds[1] }) // Carlos en NestJS Fundamentals
      .expect(201);

    await request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId: student2Id, courseId: courseIds[1] }) // Ana en NestJS Fundamentals
      .expect(201);

    await request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId: student2Id, courseId: courseIds[6] }) // Ana en DevOps para Backend
      .expect(201);
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('1. Listado paginado de cursos (GET /courses)', () => {
    it('devuelve estructura con items y meta ({ total, page, limit, totalPages })', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses?page=1&limit=3')
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.items.length).toBe(3);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(3);
      expect(res.body.meta.total).toBe(8);
      expect(res.body.meta.totalPages).toBe(3);
    });

    it('solicita dos páginas consecutivas y demuestra que no se repiten elementos', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/courses?page=1&limit=3&sortBy=id&order=ASC')
        .expect(200);

      const page2 = await request(app.getHttpServer())
        .get('/courses?page=2&limit=3&sortBy=id&order=ASC')
        .expect(200);

      const idsPage1 = page1.body.items.map((c: { id: number }) => c.id);
      const idsPage2 = page2.body.items.map((c: { id: number }) => c.id);

      expect(idsPage1.length).toBe(3);
      expect(idsPage2.length).toBe(3);

      // Ningún ID de la página 1 debe estar en la página 2
      for (const id of idsPage1) {
        expect(idsPage2).not.toContain(id);
      }
    });

    it('filtra cursos por nivel y comprueba los metadatos correctos', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses?level=intermediate&page=1&limit=10')
        .expect(200);

      expect(res.body.items.length).toBe(3);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(1);
      expect(
        res.body.items.every((c: { level: string }) => c.level === 'intermediate'),
      ).toBe(true);
    });

    it('ordena por título de forma descendente (sortBy=title&order=DESC)', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses?sortBy=title&order=DESC&page=1&limit=8')
        .expect(200);

      const titles = res.body.items.map((c: { title: string }) => c.title);
      for (let i = 0; i < titles.length - 1; i++) {
        expect(titles[i].localeCompare(titles[i + 1])).toBeGreaterThanOrEqual(0);
      }
    });

    it.each([
      ['page=0', 'página menor a 1'],
      ['page=-1', 'página negativa'],
      ['page=abc', 'página no numérica'],
      ['limit=0', 'límite menor a 1'],
      ['limit=100', 'límite mayor a 50'],
      ['sortBy=createdAt', 'columna no permitida'],
      ['order=sideways', 'dirección no permitida'],
    ])('rechaza parámetro inválido %s con 400 Bad Request', async (param) => {
      await request(app.getHttpServer())
        .get(`/courses?${param}`)
        .expect(400);
    });
  });

  describe('2. Consulta de matrículas relacionadas con QueryBuilder (GET /enrollments)', () => {
    it('busca matrículas por texto en el nombre del estudiante (search=carlos)', async () => {
      const res = await request(app.getHttpServer())
        .get('/enrollments?search=carlos')
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.items.length).toBe(2);
      expect(
        res.body.items.every((e: { student: { name: string } }) =>
          e.student.name.toLowerCase().includes('carlos'),
        ),
      ).toBe(true);
      // Los datos relacionados vienen cargados
      expect(res.body.items[0].student.name).toBe('Carlos Mendoza');
      expect(res.body.items[0].course.title).toBeDefined();
    });

    it('busca matrículas por texto en el título del curso (search=fundamentals)', async () => {
      const res = await request(app.getHttpServer())
        .get('/enrollments?search=fundamentals')
        .expect(200);

      expect(res.body.items.length).toBe(2);
      expect(
        res.body.items.every((e: { course: { title: string } }) =>
          e.course.title.toLowerCase().includes('fundamentals'),
        ),
      ).toBe(true);
    });

    it('combina búsqueda, estudiante activo y paginación (search=nest&activeOnly=true&page=1&limit=5)', async () => {
      const res = await request(app.getHttpServer())
        .get('/enrollments?search=nest&activeOnly=true&page=1&limit=5')
        .expect(200);

      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(5);
      expect(
        res.body.items.every((e: { student: { isActive: boolean } }) => e.student.isActive === true),
      ).toBe(true);
    });

    it('filtra por studentId específico', async () => {
      const res = await request(app.getHttpServer())
        .get(`/enrollments?studentId=${student2Id}`)
        .expect(200);

      expect(res.body.items.length).toBe(2);
      expect(
        res.body.items.every((e: { student: { id: number } }) => e.student.id === student2Id),
      ).toBe(true);
    });

    it('responde 200 con items vacíos para búsqueda que no encuentra resultados (no 404)', async () => {
      const res = await request(app.getHttpServer())
        .get('/enrollments?search=inexistente_xyz_123')
        .expect(200);

      expect(res.body.items).toEqual([]);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.meta.totalPages).toBe(0);
    });

    it.each([
      ['studentId=abc', 'id no numérico'],
      ['studentId=0', 'id menor a 1'],
      ['courseId=-5', 'curso negativo'],
      ['activeOnly=notboolean', 'booleano inválido'],
      ['page=0', 'página menor a 1'],
      ['limit=99', 'límite mayor a 50'],
    ])('rechaza filtro inválido %s con 400 Bad Request', async (param) => {
      await request(app.getHttpServer())
        .get(`/enrollments?${param}`)
        .expect(400);
    });
  });
});
