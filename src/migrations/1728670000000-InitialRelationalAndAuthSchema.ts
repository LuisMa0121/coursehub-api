import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialRelationalAndAuthSchema1728670000000
  implements MigrationInterface
{
  name = 'InitialRelationalAndAuthSchema1728670000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tabla de Categorías
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL UNIQUE,
        "description" character varying
      );
    `);

    // 2. Tabla de Libros
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "books" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying(200) NOT NULL,
        "author" character varying(200) NOT NULL,
        "isbn" character varying(13) NOT NULL UNIQUE,
        "year" integer NOT NULL,
        "genre" character varying(100) NOT NULL,
        "availableCopies" integer NOT NULL DEFAULT 1,
        "categoryId" integer,
        CONSTRAINT "FK_books_category" FOREIGN KEY ("categoryId") 
          REFERENCES "categories"("id") ON DELETE SET NULL
      );
    `);

    // 3. Tabla de Usuarios (Auth)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL UNIQUE,
        "password" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "createdAt" character varying
      );
    `);

    // 4. Tabla de Préstamos (Loans) con Foreign Keys explícitas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loans" (
        "id" SERIAL PRIMARY KEY,
        "bookId" integer NOT NULL,
        "userId" integer NOT NULL,
        "loanDate" character varying,
        "returnDate" character varying,
        "status" character varying NOT NULL DEFAULT 'active',
        CONSTRAINT "FK_loans_book" FOREIGN KEY ("bookId") 
          REFERENCES "books"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_loans_user" FOREIGN KEY ("userId") 
          REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);

    // 5. Tabla de Cursos
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "courses" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying NOT NULL,
        "level" character varying NOT NULL
      );
    `);

    // 6. Tabla de Estudiantes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying NOT NULL,
        "email" character varying NOT NULL UNIQUE,
        "age" integer NOT NULL,
        "career" character varying NOT NULL,
        "semester" integer NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true
      );
    `);

    // 7. Tabla de Matrículas (Enrollments)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "enrollments" (
        "id" SERIAL PRIMARY KEY,
        "studentId" integer NOT NULL,
        "courseId" integer NOT NULL,
        CONSTRAINT "UQ_enrollment_student_course" UNIQUE ("studentId", "courseId"),
        CONSTRAINT "FK_enrollments_student" FOREIGN KEY ("studentId") 
          REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_enrollments_course" FOREIGN KEY ("courseId") 
          REFERENCES "courses"("id") ON DELETE CASCADE
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "enrollments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loans";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "books";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories";`);
  }
}
