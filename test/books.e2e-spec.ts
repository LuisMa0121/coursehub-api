import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/setup-app.js';

async function createApplication(): Promise<INestApplication> {
  const module = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();
  const app = module.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

describe('Books CRUD (persistencia con SQLite en memoria)', () => {
  let app: INestApplication;

  const validBook = {
    title: 'El Quijote',
    author: 'Miguel de Cervantes',
    isbn: '9788420412146',
    year: 1605,
    genre: 'Novela',
    availableCopies: 3,
  };

  beforeEach(async () => {
    app = await createApplication();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('GET /books devuelve lista vacía al inicio', async () => {
    await request(app.getHttpServer()).get('/books').expect(200).expect([]);
  });

  it('POST /books crea un libro y responde 201', async () => {
    const response = await request(app.getHttpServer())
      .post('/books')
      .send(validBook)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.title).toBe(validBook.title);
    expect(response.body.isbn).toBe(validBook.isbn);
  });

  it('GET /books/:id devuelve el libro creado', async () => {
    const created = await request(app.getHttpServer())
      .post('/books')
      .send(validBook)
      .expect(201);

    await request(app.getHttpServer())
      .get(`/books/${created.body.id}`)
      .expect(200)
      .expect(created.body);
  });

  it('GET /books/:id responde 404 si no existe', async () => {
    await request(app.getHttpServer()).get('/books/999').expect(404);
  });

  it('PATCH /books/:id actualiza parcialmente el libro', async () => {
    const created = await request(app.getHttpServer())
      .post('/books')
      .send(validBook)
      .expect(201);

    const updated = await request(app.getHttpServer())
      .patch(`/books/${created.body.id}`)
      .send({ availableCopies: 5 })
      .expect(200);

    expect(updated.body.availableCopies).toBe(5);
    expect(updated.body.title).toBe(validBook.title);
  });

  it('DELETE /books/:id elimina el libro y responde 200', async () => {
    const created = await request(app.getHttpServer())
      .post('/books')
      .send(validBook)
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/books/${created.body.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/books/${created.body.id}`)
      .expect(404);
  });

  it('POST rechaza ISBN duplicado con 409', async () => {
    await request(app.getHttpServer()).post('/books').send(validBook).expect(201);

    await request(app.getHttpServer())
      .post('/books')
      .send({ ...validBook, title: 'Otro título' })
      .expect(409);
  });

  it.each([
    ['sin title', { ...validBook, title: undefined }],
    ['title vacío', { ...validBook, title: '' }],
    ['sin author', { ...validBook, author: undefined }],
    ['isbn inválido', { ...validBook, isbn: 'abc' }],
    ['year < 1000', { ...validBook, year: 500 }],
    ['availableCopies negativo', { ...validBook, availableCopies: -1 }],
    ['propiedad extra', { ...validBook, extra: 'x' }],
  ])('POST rechaza %s con 400', async (_label, body) => {
    await request(app.getHttpServer()).post('/books').send(body).expect(400);
    await request(app.getHttpServer()).get('/books').expect(200).expect([]);
  });
});
