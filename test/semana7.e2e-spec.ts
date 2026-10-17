import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import request from 'supertest';
import Joi from 'joi';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/setup-app.js';

describe('Semana 7: Configuración por ambientes y relaciones persistentes', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('1. Validación de variables de entorno con Joi (Sesión 13)', () => {
    const configSchema = Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'test', 'production')
        .default('development'),
      PORT: Joi.number().port().default(3000),
      DATABASE_HOST: Joi.string().default('localhost'),
      DATABASE_PORT: Joi.number().port().default(5432),
      DATABASE_USER: Joi.string().default('postgres'),
      DATABASE_PASSWORD: Joi.string().allow('').default(''),
      DATABASE_NAME: Joi.string().default('coursehub'),
    });

    it('acepta configuración válida y asigna valores por defecto', () => {
      const { error, value } = configSchema.validate({
        DATABASE_HOST: 'localhost',
        DATABASE_NAME: 'coursehub',
      });
      expect(error).toBeUndefined();
      expect(value.PORT).toBe(3000);
      expect(value.NODE_ENV).toBe('development');
      expect(value.DATABASE_PORT).toBe(5432);
    });

    it('rechaza puerto inválido que no sea numérico', () => {
      const { error } = configSchema.validate({ PORT: 'not-a-port' });
      expect(error).toBeDefined();
      expect(error?.message).toContain('"PORT" must be a number');
    });

    it('rechaza puerto fuera de rango permitido (puerto mayor a 65535)', () => {
      const { error } = configSchema.validate({ PORT: 99999 });
      expect(error).toBeDefined();
      expect(error?.message).toContain('"PORT" must be a valid port');
    });

    it('rechaza NODE_ENV fuera de los permitidos', () => {
      const { error } = configSchema.validate({ NODE_ENV: 'staging' });
      expect(error).toBeDefined();
      expect(error?.message).toContain('"NODE_ENV" must be one of [development, test, production]');
    });

    it('rechaza DATABASE_PORT inválido', () => {
      const { error } = configSchema.validate({ DATABASE_PORT: 'abc' });
      expect(error).toBeDefined();
    });
  });

  describe('2. Política de ambiente y synchronize (Sesión 14)', () => {
    function computeSynchronize(nodeEnv: string, dbSync?: string): boolean {
      return nodeEnv === 'development' && dbSync === 'true';
    }

    it('en producción synchronize es estrictamente false', () => {
      expect(computeSynchronize('production', 'true')).toBe(false);
      expect(computeSynchronize('production', 'false')).toBe(false);
    });

    it('en desarrollo solo sincroniza si DATABASE_SYNCHRONIZE es true', () => {
      expect(computeSynchronize('development', 'true')).toBe(true);
      expect(computeSynchronize('development', 'false')).toBe(false);
      expect(computeSynchronize('development', undefined)).toBe(false);
    });
  });

  describe('3. Relaciones e Integridad (Course, Student, Enrollment)', () => {
    it('crea curso y estudiante activo, matricula exitosamente y previene duplicados e inactivos', async () => {
      // 1. Crear Curso
      const courseRes = await request(app.getHttpServer())
        .post('/courses')
        .send({ title: 'Arquitectura NestJS S7', level: 'intermediate' })
        .expect(201);
      const courseId = courseRes.body.id;

      // 2. Crear Estudiante Activo
      const activeStudentRes = await request(app.getHttpServer())
        .post('/students')
        .send({
          name: 'María Estudiante S7',
          email: 'maria.s7@example.com',
          age: 22,
          career: 'Software',
          semester: 7,
          isActive: true,
        })
        .expect(201);
      const studentId = activeStudentRes.body.id;

      // 3. Crear Estudiante Inactivo
      const inactiveStudentRes = await request(app.getHttpServer())
        .post('/students')
        .send({
          name: 'Juan Inactivo S7',
          email: 'juan.inactivo.s7@example.com',
          age: 24,
          career: 'Software',
          semester: 8,
          isActive: false,
        })
        .expect(201);
      const inactiveStudentId = inactiveStudentRes.body.id;

      // 4. Matrícula válida: Estudiante activo + Curso existente -> 201
      const enrollmentRes = await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId, courseId })
        .expect(201);
      expect(enrollmentRes.body.student.id).toBe(studentId);
      expect(enrollmentRes.body.course.id).toBe(courseId);

      // 5. Matrícula duplicada: Mismo estudiante + Mismo curso -> 409 Conflict
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId, courseId })
        .expect(409);

      // 6. Matrícula con estudiante inactivo -> 400 Bad Request
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: inactiveStudentId, courseId })
        .expect(400);

      // 7. Matrícula con estudiante inexistente -> 404 Not Found
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId: 9999, courseId })
        .expect(404);

      // 8. Matrícula con curso inexistente -> 404 Not Found
      await request(app.getHttpServer())
        .post('/enrollments')
        .send({ studentId, courseId: 9999 })
        .expect(404);
    });
  });

  describe('4. Consultas con QueryBuilder, paginación y filtros (Semana 6 + 7)', () => {
    it('GET /courses responde con paginación, metadatos y ordenamiento', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses?page=1&limit=5&sortBy=title&order=ASC')
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 5);
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('GET /courses rechaza parámetros inválidos con 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get('/courses?sortBy=invalido&limit=100')
        .expect(400);
    });

    it('GET /enrollments devuelve colección vacía 200 OK cuando no hay coincidencias', async () => {
      const res = await request(app.getHttpServer())
        .get('/enrollments?search=terminoinexistente999')
        .expect(200);

      expect(res.body.items).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });
  });
});
