import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/setup-app.js';

describe('Trabajo Autónomo Segunda Etapa - E2E Tests', () => {
  let app: INestApplication;
  let userToken: string;
  let userId: number;
  let categoryId: number;
  let bookId: number;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('1. Autenticación y Registro (Requisito 6)', () => {
    it('POST /auth/register - registra un nuevo usuario con contraseña cifrada y emite JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Luis Cedeño',
          email: 'luis@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('luis@example.com');
      expect(res.body.user.password).toBeUndefined(); // Nunca expone la contraseña

      userId = res.body.user.id;
      userToken = res.body.access_token;
    });

    it('POST /auth/register - rechaza email duplicado con 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Otro Luis',
          email: 'luis@example.com',
          password: 'password123',
        })
        .expect(409);
    });

    it('POST /auth/login - autentica correctamente y emite JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'luis@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.email).toBe('luis@example.com');
      userToken = res.body.access_token;
    });

    it('POST /auth/login - rechaza credenciales incorrectas con 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'luis@example.com',
          password: 'wrong_password',
        })
        .expect(401);
    });

    it('GET /auth/profile - protegido con JWT: responde 200 con token y 401 sin token (Requisito 7)', async () => {
      // Sin token -> 401
      await request(app.getHttpServer()).get('/auth/profile').expect(401);

      // Con token -> 200
      const res = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.user.id).toBe(userId);
    });
  });

  describe('2. Modelo Relacional: Categorías y Libros (Requisitos 2 y 3)', () => {
    it('POST /categories - protegido con JWT (rechaza sin token con 401)', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .send({ name: 'Ficción', description: 'Novelas de ficción' })
        .expect(401);
    });

    it('POST /categories - crea categoría autenticado', async () => {
      const res = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Ficción', description: 'Novelas de ficción' })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Ficción');
      categoryId = res.body.id;
    });

    it('POST /categories - rechaza nombre de categoría duplicado con 409', async () => {
      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Ficción' })
        .expect(409);
    });

    it('POST /books - crea un libro asociado a la categoría creada', async () => {
      const res = await request(app.getHttpServer())
        .post('/books')
        .send({
          title: 'Cien Años de Soledad',
          author: 'Gabriel García Márquez',
          isbn: '9780307474728',
          year: 1967,
          genre: 'Realismo Mágico',
          availableCopies: 2,
          categoryId,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      bookId = res.body.id;
    });

    it('GET /categories/:id - retorna la categoría con sus libros relacionados', async () => {
      const res = await request(app.getHttpServer())
        .get(`/categories/${categoryId}`)
        .expect(200);

      expect(res.body.id).toBe(categoryId);
      expect(Array.isArray(res.body.books)).toBe(true);
      expect(res.body.books.length).toBeGreaterThan(0);
      expect(res.body.books[0].title).toBe('Cien Años de Soledad');
    });
  });

  describe('3. Modelo Relacional: Préstamos (Loans) (Requisitos 2, 3 y 7)', () => {
    let loanId: number;

    it('POST /loans - protegido con JWT: rechaza petición sin token con 401 (Requisito 7)', async () => {
      await request(app.getHttpServer())
        .post('/loans')
        .send({ bookId })
        .expect(401);
    });

    it('POST /loans - crea préstamo con token y descuenta una copia disponible', async () => {
      const res = await request(app.getHttpServer())
        .post('/loans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ bookId })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('active');
      expect(res.body.book.id).toBe(bookId);
      loanId = res.body.id;

      // Verificar que las copias disponibles bajaron de 2 a 1
      const bookRes = await request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(200);
      expect(bookRes.body.availableCopies).toBe(1);
    });

    it('GET /books/:id/loans - consulta préstamos asociados a un libro', async () => {
      const res = await request(app.getHttpServer())
        .get(`/books/${bookId}/loans`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(loanId);
    });

    it('PATCH /loans/:id/return - marca devuelto y reintegra la copia del libro', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/loans/${loanId}/return`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.status).toBe('returned');
      expect(res.body.returnDate).toBeDefined();

      // Verificar que las copias disponibles volvieron a 2
      const bookRes = await request(app.getHttpServer())
        .get(`/books/${bookId}`)
        .expect(200);
      expect(bookRes.body.availableCopies).toBe(2);
    });
  });

  describe('4. Consultas: Filtros, Búsqueda, Paginación y Ordenamiento (Requisito 4)', () => {
    beforeAll(async () => {
      // Crear libros adicionales para probar paginación y búsqueda
      await request(app.getHttpServer()).post('/books').send({
        title: 'Don Quijote de la Mancha',
        author: 'Miguel de Cervantes',
        isbn: '9788420412140',
        year: 1605,
        genre: 'Novela Clásica',
        availableCopies: 5,
      });

      await request(app.getHttpServer()).post('/books').send({
        title: 'El Amor en los Tiempos del Cólera',
        author: 'Gabriel García Márquez',
        isbn: '9780307389732',
        year: 1985,
        genre: 'Novela Romántica',
        availableCopies: 3,
      });

      await request(app.getHttpServer()).post('/books').send({
        title: 'Ficciones',
        author: 'Jorge Luis Borges',
        isbn: '9788420633121',
        year: 1944,
        genre: 'Cuentos',
        availableCopies: 4,
      });
    });

    it('GET /books?page=1&limit=2 - devuelve estructura paginada con metadatos consistentes', async () => {
      const res = await request(app.getHttpServer())
        .get('/books?page=1&limit=2')
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.items.length).toBe(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(4);
      expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('GET /books?search=Quijote - busca coincidencias textuales en título o autor', async () => {
      const res = await request(app.getHttpServer())
        .get('/books?search=Quijote')
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(
        res.body.items.every((b: { title: string }) =>
          b.title.toLowerCase().includes('quijote'),
        ),
      ).toBe(true);
    });

    it('GET /books?genre=Novela - filtra por género', async () => {
      const res = await request(app.getHttpServer())
        .get('/books?genre=Novela')
        .expect(200);

      expect(res.body.items).toBeDefined();
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(
        res.body.items.every((b: { genre: string }) =>
          b.genre.toLowerCase().includes('novela'),
        ),
      ).toBe(true);
    });

    it('GET /books?sortBy=year&order=DESC - ordena por año de forma descendente', async () => {
      const res = await request(app.getHttpServer())
        .get('/books?sortBy=year&order=DESC&page=1&limit=5')
        .expect(200);

      const years = res.body.items.map((b: { year: number }) => b.year);
      for (let i = 0; i < years.length - 1; i++) {
        expect(years[i]).toBeGreaterThanOrEqual(years[i + 1]);
      }
    });

    it('GET /books?page=0 - rechaza página inválida con 400 Bad Request', async () => {
      await request(app.getHttpServer()).get('/books?page=0').expect(400);
    });

    it('GET /books?limit=100 - rechaza límite superior a 50 con 400 Bad Request', async () => {
      await request(app.getHttpServer()).get('/books?limit=100').expect(400);
    });

    it('GET /books?sortBy=invalido - rechaza campo de orden no permitido con 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get('/books?sortBy=invalido')
        .expect(400);
    });
  });
});
