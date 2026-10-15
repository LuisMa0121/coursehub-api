# Library API — CourseHub (Segunda Etapa)

API REST modular desarrollada con **NestJS**, **TypeORM** y **PostgreSQL** para la gestión de biblioteca, cursos, estudiantes y matrículas, incorporando **modelo relacional**, **consultas avanzadas (búsqueda, filtros, paginación y ordenamiento)**, **autenticación JWT** y **migraciones de base de datos**.

## Integrantes

1. **Luis Mario Cedeño Bravo**

---

## Tema: Modelo Relacional y Autenticación (Segunda Etapa)

### Objetivos Cumplidos
- Modelar relaciones entre entidades y aplicar reglas de integridad referencial en PostgreSQL con reglas explícitas de borrado.
- Ofrecer consultas paginadas, filtrables y ordenables mediante parámetros de consulta con metadatos de paginación (`total`, `page`, `limit`, `totalPages`).
- Incorporar registro de usuarios con contraseña cifrada (`bcryptjs`), autenticación y emisión de tokens **JWT**.
- Proteger rutas de escritura con un Guard JWT (`JwtAuthGuard`) diferenciando accesos autorizados y no autorizados (401).
- Implementar migraciones versionadas de TypeORM sin depender de `synchronize` en la entrega.

---

## Modelo Relacional

### Diagrama Entidad-Relación

```text
  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │     User     │ 1     * │     Loan     │ *     1 │     Book     │
  │──────────────│─────────│──────────────│─────────│──────────────│
  │ id (PK)      │         │ id (PK)      │         │ id (PK)      │
  │ name         │         │ bookId (FK)  │         │ title        │
  │ email (UQ)   │         │ userId (FK)  │         │ author       │
  │ password     │         │ loanDate     │         │ isbn (UQ)    │
  │ role         │         │ returnDate   │         │ year         │
  │ createdAt    │         │ status       │         │ genre        │
  └──────────────┘         └──────────────┘         │ availCopies  │
                                                    │ categoryId(FK│
                                                    └──────┬───────┘
                                                           │ *
                                                           │
                                                           │ 1
                                                    ┌──────┴───────┐
                                                    │   Category   │
                                                    │──────────────│
                                                    │ id (PK)      │
                                                    │ name (UQ)    │
                                                    │ description  │
                                                    └──────────────┘

  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │   Student    │ 1     * │  Enrollment  │ *     1 │    Course    │
  │──────────────│─────────│──────────────│─────────│──────────────│
  │ id (PK)      │         │ id (PK)      │         │ id (PK)      │
  │ name         │         │ studentId(FK)│         │ title        │
  │ email (UQ)   │         │ courseId(FK) │         │ level        │
  │ age, career  │         │ UQ(st, co)   │         └──────────────┘
  │ semester     │         └──────────────┘
  │ isActive     │
  └──────────────┘
```

### Reglas de Integridad y Borrado Declaradas

| Tabla | Clave Foránea | Referencia | Regla `ON DELETE` | Justificación |
|---|---|---|---|---|
| `loans` | `bookId` | `books(id)` | **`RESTRICT`** | No se permite eliminar un libro que tenga un registro histórico o activo de préstamos. |
| `loans` | `userId` | `users(id)` | **`CASCADE`** | Si se da de baja una cuenta de usuario, se eliminan sus registros de préstamos asociados. |
| `books` | `categoryId` | `categories(id)` | **`SET NULL`** | Si se elimina una categoría temática, los libros permanecen en el catálogo quedando sin categoría asignada. |
| `enrollments` | `studentId` | `students(id)` | **`CASCADE`** | Al eliminar un estudiante, se eliminan sus matrículas registradas. |
| `enrollments` | `courseId` | `courses(id)` | **`CASCADE`** | Al eliminar un curso, se cancelan las matrículas asociadas. |

---

## Configuración y Variables de Entorno

El archivo `.env` debe crearse a partir de `.env.example` y **nunca** debe subirse a Git.

```dotenv
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=tu_contraseña_aqui
DATABASE_NAME=coursehub

# Esquema administrado por migraciones en todos los entornos de entrega
DATABASE_SYNCHRONIZE=false

# Seguridad y Autenticación JWT
JWT_SECRET=super_secret_jwt_key_para_desarrollo_cambiar_en_produccion
JWT_EXPIRES_IN=1d
```

---

## Cómo Ejecutar el Proyecto

### 1. Requisitos previos
- Node.js ≥ 24
- PostgreSQL en ejecución local (crear base de datos `coursehub`)

```sql
CREATE DATABASE coursehub;
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Migraciones de Base de Datos
Ejecutar siempre antes de iniciar la API. El DataSource carga `.env` desde la raíz del proyecto:
```bash
# Compilar proyecto y ejecutar migraciones versionadas
npm run build
npm run migration:run
```

### 4. Iniciar en modo desarrollo
```bash
npm run start:dev
```
La API quedará disponible en `http://localhost:3000`.

---

## Tabla de Endpoints

### 1. Autenticación (`/auth`)

| Método | Ruta | Descripción | Acceso | Body / Parámetros |
|---|---|---|---|---|
| `POST` | `/auth/register` | Registro de usuario (contraseña cifrada con `bcryptjs`, emite JWT) | Público | `{ "name": "...", "email": "...", "password": "..." }` |
| `POST` | `/auth/login` | Inicio de sesión y emisión de JWT | Público | `{ "email": "...", "password": "..." }` |
| `GET` | `/auth/profile` | Consulta del perfil autenticado | **Protegido (JWT)** | Header `Authorization: Bearer <token>` |

---

### 2. Libros (`/books`) — Consultas Avanzadas y Paginación

| Método | Ruta | Descripción | Acceso | Query / Body |
|---|---|---|---|---|
| `GET` | `/books` | Listado paginado con búsqueda, filtros y ordenamiento | Público | `?page=1&limit=10&search=Quijote&genre=Novela&sortBy=year&order=DESC` |
| `GET` | `/books/:id` | Detalle del libro (con categoría) | Público | — |
| `POST` | `/books` | Crear libro | Público / DTO validado | `{ "title": "...", "author": "...", "isbn": "...", "year": 1967, "genre": "...", "availableCopies": 3, "categoryId": 1 }` |
| `PATCH` | `/books/:id` | Actualización parcial | Público / DTO validado | JSON con campos a modificar |
| `DELETE` | `/books/:id` | Eliminar libro | Público / ID validado | — |
| `GET` | `/books/:id/loans` | Consultar préstamos relacionados de un libro | Público | — |

#### Formato de Respuesta Paginada (`GET /books?page=1&limit=10`):
```json
{
  "items": [
    {
      "id": 1,
      "title": "Cien Años de Soledad",
      "author": "Gabriel García Márquez",
      "isbn": "9780307474728",
      "year": 1967,
      "genre": "Realismo Mágico",
      "availableCopies": 2,
      "categoryId": 1,
      "category": { "id": 1, "name": "Ficción" }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### 3. Categorías (`/categories`) — Entidad de Dominio Relacionada

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `GET` | `/categories` | Listar todas las categorías | Público |
| `GET` | `/categories/:id` | Obtener categoría con sus libros relacionados | Público |
| `POST` | `/categories` | Crear categoría (nombre único) | **Protegido (JWT)** |
| `PATCH` | `/categories/:id` | Actualizar categoría | **Protegido (JWT)** |
| `DELETE` | `/categories/:id` | Eliminar categoría | **Protegido (JWT)** |

---

### 4. Préstamos (`/loans`) — Entidad Relacional con Reglas de Negocio

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| `POST` | `/loans` | Registrar préstamo (valida existencia, copias > 0 y descuenta 1) | **Protegido (JWT)** |
| `GET` | `/loans` | Listar préstamos (con datos de libro y usuario) | **Protegido (JWT)** |
| `GET` | `/loans/:id` | Detalle del préstamo | **Protegido (JWT)** |
| `PATCH` | `/loans/:id/return` | Devolver libro (marca devuelto e incrementa en 1 copia) | **Protegido (JWT)** |
| `DELETE` | `/loans/:id` | Eliminar registro de préstamo | **Protegido (JWT)** |

---

### 5. Rutas Protegidas y Demostración de Seguridad (Requisito 7)

Cualquier petición a un endpoint protegido sin la cabecera `Authorization: Bearer <token>` responde con:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

Al incluir el token válido emitido en `/auth/login` o `/auth/register`:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
La petición se ejecuta con código `200` o `201`.

---

### 6. Cursos, Estudiantes y Matrículas (`/courses`, `/students`, `/enrollments`)

#### Semana 6: Paginación, Filtros y Búsqueda con QueryBuilder

##### A. Cursos (`GET /courses`)
Consulta paginada, filtrable por nivel y ordenable con `findAndCount` de TypeORM.
- **Parámetros disponibles:**
  - `level`: `beginner` | `intermediate` | `advanced` | `expert`
  - `page`: Número entero ≥ 1 (predeterminado: `1`)
  - `limit`: Número entero entre 1 y 50 (predeterminado: `10`)
  - `sortBy`: Campo para ordenar: `id`, `title` o `level` (predeterminado: `id`)
  - `order`: Sentido del orden: `ASC` o `DESC` (predeterminado: `ASC`)
- **Respuesta estándar:**
  ```json
  {
    "items": [
      { "id": 1, "title": "NestJS Fundamentals", "level": "beginner" }
    ],
    "meta": {
      "total": 3,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

##### B. Matrículas (`GET /enrollments`)
Consulta avanzada construida con `createQueryBuilder('enrollment')` con `leftJoinAndSelect` sobre `student` y `course`.
- **Parámetros disponibles:**
  - `search`: Texto para búsqueda parcial insensible a mayúsculas (case-insensitive) sobre el nombre del estudiante (`student.name`) o el título del curso (`course.title`).
  - `studentId`: Entero positivo (ID del estudiante).
  - `courseId`: Entero positivo (ID del curso).
  - `activeOnly`: Booleano en texto (`true` o `false`), filtra matrículas cuyo estudiante tenga `student.isActive = true`.
  - `page`: Número entero ≥ 1 (predeterminado: `1`)
  - `limit`: Número entero entre 1 y 50 (predeterminado: `10`)
- **Orden:** `enrollment.id ASC`.
- **Respuesta estándar:**
  ```json
  {
    "items": [
      {
        "id": 1,
        "studentId": 1,
        "courseId": 1,
        "student": { "id": 1, "name": "Ana Gómez", "email": "ana@example.com", "isActive": true },
        "course": { "id": 1, "title": "NestJS Fundamentals", "level": "beginner" }
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

##### URLs de Ejemplo Probadas (Semana 6)
1. **Paginación y ordenamiento de cursos por título ascendente:**
   `GET /courses?page=1&limit=5&sortBy=title&order=ASC`
2. **Filtrado de cursos por nivel con orden descendente:**
   `GET /courses?level=beginner&page=1&limit=10&sortBy=level&order=DESC`
3. **Búsqueda insensible a mayúsculas en matrículas por texto de curso o estudiante:**
   `GET /enrollments?search=NestJS&page=1&limit=5`
4. **Filtro combinado de búsqueda, estudiante activo y curso específico con paginación:**
   `GET /enrollments?search=Ana&activeOnly=true&courseId=1&page=1&limit=10`
5. **Filtrado de matrículas por estudiante y curso específicos:**
   `GET /enrollments?studentId=1&courseId=2&page=1&limit=10`

---

## Pruebas Automatizadas

```bash
# Tests unitarios
npm test

# Tests de integración E2E (130 pruebas E2E)
npm run test:e2e
```


## Verificación de la segunda etapa del 11 de octubre de 2026

Se verificaron 108 pruebas E2E en SQL.js y 26 comprobaciones locales en PostgreSQL.
`docs/etapa2/verificacion.json` contiene respuestas sanitizadas sin tokens utilizables ni contraseñas de la base de datos.
La API se reinició con `DATABASE_SYNCHRONIZE=false` y conservó la categoría y sus tres libros.

### Migración desde la etapa anterior

La migración inicial crea las tablas ausentes. `UpgradeStageOneSchema1791676800000` agrega `books.categoryId` cuando la tabla ya existe, conserva los libros y alinea las claves foráneas de matrículas con `ON DELETE CASCADE`.
Su reversión conserva `categoryId` para no perder datos; devuelve las claves de matrículas a `NO ACTION`. No ejecutar la reversión de la migración inicial sobre una base con datos que deban conservarse, pues elimina las tablas.

```bash
npm run build
npm run migration:run
npm run test:migrations
npm run start:dev
```

`test:migrations` comprueba un esquema vacío y un esquema de primera etapa dentro de transacciones que se revierten. Requiere permiso para crear un esquema temporal en la base local. No usa synchronize.

### Parámetros de GET books

Sin parámetros se conserva la respuesta de lista de la etapa anterior. Con cualquiera de los parámetros siguientes se devuelve `{ items, meta }`, incluyendo `total`, `page`, `limit` y `totalPages`.

| Parámetro | Validación y efecto |
|---|---|
| search | Texto; busca título o autor sin distinguir mayúsculas |
| genre | Texto; coincidencia parcial de género |
| year | Entero mayor o igual a 1000; coincidencia exacta |
| categoryId | Entero positivo; filtra por clave de categoría |
| page | Entero mayor o igual a 1; predeterminado 1 |
| limit | Entero entre 1 y 50; predeterminado 10 |
| sortBy | id, title, author, year o availableCopies; predeterminado id |
| order | ASC o DESC; se admite entrada en minúsculas; predeterminado ASC |

### Cuenta exclusiva para demostración local

Correo: `etapa2.demo@example.test`. Contraseña de demostración: `Etapa2Demo2026!`.
No corresponde a una cuenta personal ni debe reutilizarse en servicios externos. Login en `POST /auth/login`.
Datos conservados en la base local `coursehub`: categoría 1, libros 1, 2 y 3, préstamo 1 devuelto.
El puerto local de PostgreSQL usado en esta revisión fue 5433; adaptar `.env` a cada equipo. El ejemplo 5432 es el puerto estándar.

El registro público fija el rol `user` y rechaza `role` en el DTO. `JWT_SECRET` es obligatorio; definir un valor privado en `.env`. Nunca publicar el secreto ni el token completo en las capturas.
