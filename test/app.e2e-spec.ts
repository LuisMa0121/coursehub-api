import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'node:http';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/setup-app.js';

const initialCourses = [
  { id: 1, title: 'NestJS Fundamentals', level: 'beginner' },
  { id: 2, title: 'REST APIs with NestJS', level: 'beginner' },
  { id: 3, title: 'NestJS Architecture', level: 'intermediate' },
];

async function createApplication(): Promise<INestApplication<Server>> {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = module.createNestApplication<INestApplication<Server>>();
  configureApp(app);
  await app.init();
  return app;
}

describe('CourseHub API (HTTP)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    app = await createApplication();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('GET / y /welcome conservan las rutas de la semana 1', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Bienvenido a CourseHub API');
    await request(app.getHttpServer())
      .get('/welcome')
      .expect(200)
      .expect({ message: 'Bienvenido a CourseHub API' });
  });

  it('GET /courses devuelve los tres cursos iniciales', async () => {
    await request(app.getHttpServer())
      .get('/courses')
      .expect(200)
      .expect(initialCourses);
  });

  it.each(['beginner', 'intermediate', 'advanced', 'expert'])(
    'GET /courses?level=%s filtra sin alterar los datos',
    async (level) => {
      await request(app.getHttpServer())
        .get('/courses')
        .query({ level })
        .expect(200)
        .expect(initialCourses.filter((course) => course.level === level));
      await request(app.getHttpServer())
        .get('/courses')
        .expect(200)
        .expect(initialCourses);
    },
  );

  it('GET /courses/:id devuelve un curso existente', async () => {
    await request(app.getHttpServer())
      .get('/courses/1')
      .expect(200)
      .expect(initialCourses[0]);
  });

  it.each(['beginner', 'intermediate', 'advanced'])(
    'POST acepta el nivel %s, responde 201 y permite consultar el curso',
    async (level) => {
      const body = { title: 'Curso creado por HTTP', level };
      const created = await request(app.getHttpServer())
        .post('/courses')
        .send(body)
        .expect(201);

      expect(created.body).toEqual({ id: 4, ...body });
      await request(app.getHttpServer())
        .get(`/courses/${created.body.id}`)
        .expect(200)
        .expect(created.body);
      await request(app.getHttpServer())
        .get('/courses')
        .expect(200)
        .expect([...initialCourses, created.body]);
    },
  );

  it.each([
    ['título vacío', { title: '', level: 'beginner' }, 'title'],
    ['título ausente', { level: 'beginner' }, 'title'],
    ['título numérico', { title: 42, level: 'beginner' }, 'title'],
    ['título null', { title: null, level: 'beginner' }, 'title'],
    ['nivel inválido', { title: 'Curso', level: 'expert' }, 'level'],
    ['nivel ausente', { title: 'Curso' }, 'level'],
    ['nivel null', { title: 'Curso', level: null }, 'level'],
    [
      'propiedad adicional',
      { title: 'Curso', level: 'beginner', extra: true },
      'extra',
    ],
    [
      'id proporcionado por el cliente',
      { id: 1, title: 'Curso', level: 'beginner' },
      'id',
    ],
  ])(
    'POST rechaza %s con 400 sin crear cursos',
    async (_label, body, field) => {
      const response = await request(app.getHttpServer())
        .post('/courses')
        .send(body)
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining(field)]),
      );
      await request(app.getHttpServer())
        .get('/courses')
        .expect(200)
        .expect(initialCourses);
      const valid = await request(app.getHttpServer())
        .post('/courses')
        .send({ title: 'Siguiente curso válido', level: 'beginner' })
        .expect(201);
      expect(valid.body.id).toBe(4);
    },
  );

  it('PATCH solo level preserva title y permite filtrar por el nivel nuevo', async () => {
    const expected = { ...initialCourses[0], level: 'advanced' };
    await request(app.getHttpServer())
      .patch('/courses/1')
      .send({ level: 'advanced' })
      .expect(200)
      .expect(expected);
    await request(app.getHttpServer())
      .get('/courses/1')
      .expect(200)
      .expect(expected);
    await request(app.getHttpServer())
      .get('/courses?level=advanced')
      .expect(200)
      .expect([expected]);
  });

  it('PATCH solo title preserva level y PATCH vacío conserva el curso', async () => {
    const expected = { ...initialCourses[0], title: 'Título actualizado' };
    await request(app.getHttpServer())
      .patch('/courses/1')
      .send({ title: expected.title })
      .expect(200)
      .expect(expected);
    await request(app.getHttpServer())
      .patch('/courses/1')
      .send({})
      .expect(200)
      .expect(expected);
  });

  it.each([
    ['nivel inválido', { level: 'expert' }],
    ['título vacío', { title: '' }],
    ['título numérico', { title: 42 }],
    ['título null', { title: null }],
    ['nivel null', { level: null }],
    ['propiedad adicional', { extra: true }],
    ['cambio de id', { id: 999 }],
    ['cambio mixto inválido', { title: 'No debe guardarse', level: 'expert' }],
  ])(
    'PATCH rechaza %s con 400 sin modificar el curso',
    async (_label, body) => {
      const expected = { ...initialCourses[0], level: 'advanced' };
      await request(app.getHttpServer())
        .patch('/courses/1')
        .send({ level: 'advanced' })
        .expect(200);
      const response = await request(app.getHttpServer())
        .patch('/courses/1')
        .send(body)
        .expect(400);
      expect(response.body.statusCode).toBe(400);
      await request(app.getHttpServer())
        .get('/courses/1')
        .expect(200)
        .expect(expected);
    },
  );

  it.each(['999', 'no-es-un-id', '1abc'])(
    'GET, PATCH y DELETE del id %s responden 404 sin cambiar cursos',
    async (id) => {
      const expected = {
        statusCode: 404,
        message: `Course with id ${id} not found`,
        error: 'Not Found',
      };
      await request(app.getHttpServer())
        .get(`/courses/${id}`)
        .expect(404)
        .expect(expected);
      await request(app.getHttpServer())
        .patch(`/courses/${id}`)
        .send({ level: 'advanced' })
        .expect(404)
        .expect(expected);
      await request(app.getHttpServer())
        .delete(`/courses/${id}`)
        .expect(404)
        .expect(expected);
      await request(app.getHttpServer())
        .get('/courses')
        .expect(200)
        .expect(initialCourses);
    },
  );

  it('DELETE devuelve el curso eliminado con 200; consultarlo o borrarlo de nuevo da 404', async () => {
    await request(app.getHttpServer())
      .delete('/courses/2')
      .expect(200)
      .expect(initialCourses[1]);
    await request(app.getHttpServer()).get('/courses/2').expect(404);
    await request(app.getHttpServer()).delete('/courses/2').expect(404);
    await request(app.getHttpServer())
      .get('/courses')
      .expect(200)
      .expect([initialCourses[0], initialCourses[2]]);
  });

  it('POST no reutiliza ids después de borrar un curso', async () => {
    const first = await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Curso temporal', level: 'beginner' })
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/courses/${first.body.id}`)
      .expect(200);
    const second = await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Curso siguiente', level: 'intermediate' })
      .expect(201);

    expect(second.body.id).toBeGreaterThan(first.body.id);
    const all = await request(app.getHttpServer()).get('/courses').expect(200);
    const ids = all.body.map((course: { id: number }) => course.id);
    expect(new Set(ids).size).toBe(ids.length);
    await request(app.getHttpServer())
      .get(`/courses/${first.body.id}`)
      .expect(404);
  });

  it('crear otra aplicación recupera las semillas y pierde los cambios temporales', async () => {
    await request(app.getHttpServer())
      .patch('/courses/1')
      .send({ title: 'Cambio temporal' })
      .expect(200);
    await request(app.getHttpServer()).delete('/courses/2').expect(200);
    await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'Nuevo temporal', level: 'advanced' })
      .expect(201);

    const restarted = await createApplication();
    try {
      await request(restarted.getHttpServer())
        .get('/courses')
        .expect(200)
        .expect(initialCourses);
      const created = await request(restarted.getHttpServer())
        .post('/courses')
        .send({ title: 'Primer curso tras reiniciar', level: 'beginner' })
        .expect(201);
      expect(created.body.id).toBe(4);
    } finally {
      await restarted.close();
    }
  });
});
