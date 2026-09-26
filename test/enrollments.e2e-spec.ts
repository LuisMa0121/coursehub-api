import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/setup-app.js';

describe('Integración de Cursos, Estudiantes y Matrículas', () => {
  let app: INestApplication;
  let active: number;
  let inactive: number;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
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
  const enroll = (studentId: number, courseId = 1) =>
    request(app.getHttpServer())
      .post('/enrollments')
      .send({ studentId, courseId });

  it('registra, evita duplicados, filtra por ambas claves y cancela', async () => {
    const first = { id: 1, studentId: active, courseId: 1 };
    await enroll(active).expect(201).expect(first);
    await enroll(active).expect(409);
    await enroll(active, 2)
      .expect(201)
      .expect({ id: 2, studentId: active, courseId: 2 });
    await request(app.getHttpServer())
      .patch(`/students/${inactive}/status`)
      .send({ isActive: true })
      .expect(200);
    await enroll(inactive)
      .expect(201)
      .expect({ id: 3, studentId: inactive, courseId: 1 });
    for (const [query, ids] of [
      ['', [1, 2, 3]],
      [`?studentId=${active}`, [1, 2]],
      ['?courseId=1', [1, 3]],
      [`?studentId=${active}&courseId=1`, [1]],
      [`?studentId=${inactive}&courseId=2`, []],
    ] as const) {
      const response = await request(app.getHttpServer())
        .get('/enrollments' + query)
        .expect(200);
      expect(response.body.map((item: { id: number }) => item.id)).toEqual(ids);
    }
    await request(app.getHttpServer())
      .get(`/students/${active}/enrollments`)
      .expect(200)
      .expect([first, { id: 2, studentId: active, courseId: 2 }]);
    await request(app.getHttpServer())
      .get('/courses/2/enrollments')
      .expect(200)
      .expect([{ id: 2, studentId: active, courseId: 2 }]);
    await request(app.getHttpServer())
      .delete('/enrollments/1')
      .expect(200)
      .expect(first);
    await request(app.getHttpServer()).delete('/enrollments/1').expect(404);
    await enroll(active)
      .expect(201)
      .expect({ ...first, id: 4 });
  });
  it('rechaza inactivo y recursos inexistentes sin consumir identificadores', async () => {
    await enroll(inactive).expect(409);
    await enroll(999).expect(404);
    await enroll(active, 999).expect(404);
    await request(app.getHttpServer())
      .get('/enrollments')
      .expect(200)
      .expect([]);
    await enroll(active)
      .expect(201)
      .expect({ id: 1, studentId: active, courseId: 1 });
  });
  it('consulta el estado actual compartido del estudiante y los cursos creados', async () => {
    await request(app.getHttpServer())
      .patch(`/students/${active}/status`)
      .send({ isActive: false })
      .expect(200);
    await enroll(active).expect(409);
    await request(app.getHttpServer())
      .patch(`/students/${active}/status`)
      .send({ isActive: true })
      .expect(200);
    const course = await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Curso nuevo', level: 'beginner' })
      .expect(201);
    await enroll(active, course.body.id).expect(201);
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
      .get('/courses/1/enrollments')
      .expect(200)
      .expect([]);
  });
});
