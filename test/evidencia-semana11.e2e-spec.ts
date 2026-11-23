import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { appendFileSync, writeFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import { Logger, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/setup-app.js';
import { RequestLoggerMiddleware } from '../src/common/middleware/request-logger.middleware.js';
import { Course } from '../src/courses/entities/course.entity.js';
import { User } from '../src/users/entities/user.entity.js';
import { Role } from '../src/users/enums/role.enum.js';

/** Demostración de la Semana 11: correcta, id inválido, inexistente y prohibida. */
describe('Semana 11 - evidencia de demostración', () => {
  let app: INestApplication;
  let tokenOwner: string;
  let tokenOther: string;
  let courseId: number;
  const OUT = process.env.EVIDENCE_FILE ?? join(tmpdir(), 'coursehub-evidencia-semana11.txt');

  beforeAll(async () => {
    writeFileSync(OUT, '');
    const origLog = Logger.prototype.log;
    Logger.prototype.log = function (message: unknown, ...rest: unknown[]) {
      if (String(message).includes('durationMs')) appendFileSync(OUT, `LOG ${String(message)}\n`);
      return origLog.call(this, message, ...(rest as []));
    };
    const moduleRef = await Test.createTestingModule({ imports: [TestAppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    const mw = new RequestLoggerMiddleware();
    app.use(mw.use.bind(mw));
    await app.init();

    const users = app.get<Repository<User>>(getRepositoryToken(User));
    const courses = app.get<Repository<Course>>(getRepositoryToken(Course));
    const owner = await users.save(users.create({ email: 'docente1@test.com', passwordHash: 'x', role: Role.TEACHER } as Partial<User>));
    const other = await users.save(users.create({ email: 'docente2@test.com', passwordHash: 'x', role: Role.TEACHER } as Partial<User>));
    courseId = (await courses.save(courses.create({ title: 'NestJS', level: 'beginner', teacherId: owner.id }))).id;

    const jwt = app.get(JwtService);
    tokenOwner = jwt.sign({ sub: owner.id, email: owner.email, role: owner.role });
    tokenOther = jwt.sign({ sub: other.id, email: other.email, role: other.role });
  });

  afterAll(() => app.close());

  const show = (label: string, res: request.Response) =>
    appendFileSync(OUT, `\n### ${label}\nHTTP ${res.status}\n${JSON.stringify(res.body, null, 2)}\n`);

  it('1. correcta (docente propietario)', async () => {
    const res = await request(app.getHttpServer()).patch(`/courses/${courseId}`)
      .set('Authorization', `Bearer ${tokenOwner}`).send({ level: 'advanced' });
    show(`PATCH /courses/${courseId} (propietario)`, res);
    expect(res.status).toBe(200);
  });

  it('2. identificador inválido', async () => {
    const res = await request(app.getHttpServer()).patch('/courses/abc')
      .set('Authorization', `Bearer ${tokenOwner}`).send({ level: 'advanced' });
    show('PATCH /courses/abc', res);
    expect(res.status).toBe(400);
  });

  it('3. recurso inexistente', async () => {
    const res = await request(app.getHttpServer()).patch('/courses/99999')
      .set('Authorization', `Bearer ${tokenOwner}`).send({ level: 'advanced' });
    show('PATCH /courses/99999', res);
    expect(res.status).toBe(404);
  });

  it('4. prohibida (docente ajeno)', async () => {
    const res = await request(app.getHttpServer()).patch(`/courses/${courseId}`)
      .set('Authorization', `Bearer ${tokenOther}`).send({ level: 'intermediate' });
    show(`PATCH /courses/${courseId} (otro docente)`, res);
    expect(res.status).toBe(403);
  });
});
