import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/setup-app.js';
import { Course } from '../src/courses/entities/course.entity.js';
import { User } from '../src/users/entities/user.entity.js';
import { Role } from '../src/users/enums/role.enum.js';

/**
 * Semana 13 · Sesión 25 — Pruebas de integración y end-to-end.
 *
 * - Usa TestAppModule: SQLite en memoria, sin .env ni credenciales reales.
 * - Cada caso parte de datos limpios (beforeEach), así no depende del orden.
 * - Verifica respuestas HTTP concretas: 200/201, 401 y 403.
 */
describe('Semana 13 - e2e de cursos con datos aislados', () => {
  let app: INestApplication;
  let users: Repository<User>;
  let courses: Repository<Course>;
  let jwt: JwtService;

  const tokenFor = (user: User) =>
    jwt.sign({ sub: user.id, email: user.email, role: user.role });

  const createUser = (email: string, role: Role) =>
    users.save(users.create({ email, passwordHash: 'x', role } as Partial<User>));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    users = app.get(getRepositoryToken(User));
    courses = app.get(getRepositoryToken(Course));
    jwt = app.get(JwtService);
  });

  // Limpieza entre casos: cada prueba arranca con la base vacía.
  beforeEach(async () => {
    await courses.clear();
    await users.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /courses responde 200 con una lista vacía al iniciar', async () => {
    const res = await request(app.getHttpServer()).get('/courses').expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.meta.total).toBe(0);
  });

  it('POST /courses crea un curso y GET /courses lo devuelve', async () => {
    const created = await request(app.getHttpServer())
      .post('/courses')
      .send({ title: 'NestJS e2e', level: 'beginner' })
      .expect(201);

    expect(created.body).toMatchObject({ title: 'NestJS e2e', level: 'beginner' });

    const list = await request(app.getHttpServer()).get('/courses').expect(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.meta.total).toBe(1);
  });

  it('escritura autenticada: el docente propietario actualiza su curso (200)', async () => {
    const owner = await createUser('docente@test.com', Role.TEACHER);
    const course = await courses.save(
      courses.create({ title: 'Testing', level: 'beginner', teacherId: owner.id }),
    );

    const res = await request(app.getHttpServer())
      .patch(`/courses/${course.id}`)
      .set('Authorization', `Bearer ${tokenFor(owner)}`)
      .send({ level: 'advanced' })
      .expect(200);

    expect(res.body.level).toBe('advanced');
  });

  it('escritura autenticada: un docente ajeno recibe 403', async () => {
    const owner = await createUser('duenio@test.com', Role.TEACHER);
    const other = await createUser('ajeno@test.com', Role.TEACHER);
    const course = await courses.save(
      courses.create({ title: 'Testing', level: 'beginner', teacherId: owner.id }),
    );

    await request(app.getHttpServer())
      .patch(`/courses/${course.id}`)
      .set('Authorization', `Bearer ${tokenFor(other)}`)
      .send({ level: 'advanced' })
      .expect(403);
  });

  it('ruta protegida sin token responde 401', async () => {
    await request(app.getHttpServer()).get('/admin/dashboard').expect(401);
  });

  it('ruta protegida con rol insuficiente responde 403', async () => {
    const student = await createUser('alumno@test.com', Role.USER);

    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${tokenFor(student)}`)
      .expect(403);
  });

  it('ruta protegida con rol admin responde 200', async () => {
    const admin = await createUser('admin@test.com', Role.ADMIN);

    const res = await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .expect(200);

    expect(res.body.access).toBe('granted');
  });
});
