import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/setup-app.js';

describe('Integración de Cursos, Estudiantes y Matrículas', () => {
  let app: INestApplication;
  let active: number;
  let inactive: number;
  let course1Id: number;
  let course2Id: number;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();

    // Crear los cursos necesarios para los tests de matrículas
    course1Id = (
      await request(app.getHttpServer())
        .post('/courses')
        .send({ title: 'NestJS Fundamentals', level: 'beginner' })
        .expect(201)
    ).body.id;
    course2Id = (
      await request(app.getHttpServer())
        .post('/courses')
        .send({ title: 'REST APIs with NestJS', level: 'beginner' })
        .expect(201)
    ).body.id;

    // Crear los estudiantes necesarios para los tests
    const body = {
      name: 'Estudiante de prueba',
      email: 'activo@example.com',
      age: 20,
      career: 'Software',
      semester: 5,
      isActive: true,
    };
    active = (
      await request(app.getHttpServer())
        .post('/students')
        .send(body)
        .expect(201)
    ).body.id;
    inactive = (
      await request(app.getHttpServer())
        .post('/students')
        .send({ ...body, email: 'inactivo@example.com', isActive: false })
        .expect(201)
    ).body.id;
  });

  afterEach(async () => {
    await app?.close();
  });

  const enroll = (studentId: number, courseId?: number) =>
    request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId, courseId: courseId ?? course1Id });

  it('registra, evita duplicados, filtra por ambas claves y cancela', async () => {
    const res1 = await enroll(active).expect(201);
    expect(res1.body.id).toBe(1);
    expect(res1.body.student.id).toBe(active);
    expect(res1.body.course.id).toBe(course1Id);

    await enroll(active).expect(409);

    const res2 = await enroll(active, course2Id).expect(201);
    expect(res2.body.id).toBe(2);
    expect(res2.body.student.id).toBe(active);
    expect(res2.body.course.id).toBe(course2Id);

    await request(app.getHttpServer())
      .patch(`/students/${inactive}/status`)
      .send({ isActive: true })
      .expect(200);

    const res3 = await enroll(inactive).expect(201);
    expect(res3.body.id).toBe(3);
    expect(res3.body.student.id).toBe(inactive);
    expect(res3.body.course.id).toBe(course1Id);

    for (const [query, ids] of [
      ['', [1, 2, 3]],
      [`?studentId=${active}`, [1, 2]],
      [`?courseId=${course1Id}`, [1, 3]],
      [`?studentId=${active}&courseId=${course1Id}`, [1]],
      [`?studentId=${inactive}&courseId=${course2Id}`, []],
    ] as const) {
      const response = await request(app.getHttpServer())
        .get('/enrollments' + query)
        .expect(200);
      expect(response.body.map((item: { id: number }) => item.id)).toEqual(ids);
    }

    const byStudent = await request(app.getHttpServer())
      .get(`/students/${active}/enrollments`)
      .expect(200);
    expect(byStudent.body.map((e: { id: number }) => e.id)).toEqual([1, 2]);
    expect(byStudent.body[0].student.id).toBe(active);

    const byCourse = await request(app.getHttpServer())
      .get(`/courses/${course2Id}/enrollments`)
      .expect(200);
    expect(byCourse.body.map((e: { id: number }) => e.id)).toEqual([2]);
    expect(byCourse.body[0].course.id).toBe(course2Id);

    const deleted = await request(app.getHttpServer())
      .delete('/enrollments/1')
      .expect(200);
    expect(deleted.body.id).toBe(1);

    await request(app.getHttpServer()).delete('/enrollments/1').expect(404);

    const re = await enroll(active).expect(201);
    expect(re.body.id).toBe(4);
    expect(re.body.student.id).toBe(active);
    expect(re.body.course.id).toBe(course1Id);
  });

  it('rechaza inactivo y recursos inexistentes sin consumir identificadores', async () => {
    await enroll(inactive).expect(400); // estudiante inactivo → 400
    await enroll(999).expect(404);
    await enroll(active, 999).expect(404);
    await request(app.getHttpServer())
      .get('/enrollments')
      .expect(200)
      .expect([]);
    const res = await enroll(active).expect(201);
    expect(res.body.id).toBe(1);
    expect(res.body.student.id).toBe(active);
    expect(res.body.course.id).toBe(course1Id);
  });

  it('consulta el estado actual compartido del estudiante y los cursos creados', async () => {
    await request(app.getHttpServer())
      .patch(`/students/${active}/status`)
      .send({ isActive: false })
      .expect(200);
    await enroll(active).expect(400); // inactivo → 400
    await request(app.getHttpServer())
      .patch(`/students/${active}/status`)
      .send({ isActive: true })
      .expect(200);
    const course = await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Curso nuevo', level: 'beginner' })
      .expect(201);
    const res = await enroll(active, course.body.id).expect(201);
    expect(res.body.student.id).toBe(active);
    expect(res.body.course.id).toBe(course.body.id);
  });

  it.each([
    {},
    { studentId: 1 },
    { courseId: 1 },
    { studentId: '1', courseId: 1 },
    { studentId: 1, courseId: '1' },
    { studentId: 0, courseId: 1 },
    { studentId: 1, courseId: -1 },
    { studentId: 1.5, courseId: 1 },
    { studentId: null, courseId: 1 },
    { studentId: true, courseId: 1 },
    { studentId: 1, courseId: 1, id: 99 },
    { studentId: 1, courseId: 1, extra: true },
    { studentId: 9007199254740992, courseId: 1 },
  ])('rechaza body inválido %j', async (body) => {
    await request(app.getHttpServer())
      .post('/enrollments')
      .send(body)
      .expect(400);
    await request(app.getHttpServer())
      .get('/enrollments')
      .expect(200)
      .expect([]);
  });

  it.each([
    'studentId=abc',
    'courseId=0',
    'studentId=-1',
    'courseId=1.5',
    'studentId=',
    'courseId=true',
    'studentId=1&studentId=2',
    'extra=1',
    'courseId=9007199254740992',
  ])('rechaza filtros inválidos %s', async (query) => {
    await request(app.getHttpServer())
      .get('/enrollments?' + query)
      .expect(400);
  });

  it.each(['/students/999/enrollments', '/courses/999/enrollments'])(
    'devuelve 404 para padre inexistente %s',
    async (url) => {
      await request(app.getHttpServer()).get(url).expect(404);
    },
  );

  it.each(['/students/abc/enrollments', '/courses/abc/enrollments'])(
    'valida identificadores de rutas %s',
    async (url) => {
      await request(app.getHttpServer()).get(url).expect(400);
    },
  );

  it.each(['abc', '0', '-1', '1.5', '1e0'])(
    'rechaza id de cancelación inválido %s',
    async (id) => {
      await request(app.getHttpServer())
        .delete('/enrollments/' + id)
        .expect(400);
    },
  );

  it('devuelve listas vacías para padres existentes sin matrículas', async () => {
    await request(app.getHttpServer())
      .get(`/students/${active}/enrollments`)
      .expect(200)
      .expect([]);
    await request(app.getHttpServer())
      .get(`/courses/${course1Id}/enrollments`)
      .expect(200)
      .expect([]);
  });
});
