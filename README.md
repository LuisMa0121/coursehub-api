# Library API — CourseHub

API REST para la **gestión de una biblioteca**: libros, cursos, estudiantes y matrículas.

Desarrollada con **NestJS**, **TypeORM** y **PostgreSQL**.

## Integrantes

1. _______________________________________________

## Descripción del proyecto

La API permite administrar el catálogo de libros de una biblioteca. Los datos se persisten en PostgreSQL y se conservan al reiniciar el servidor.

### Entidades previstas

```
┌──────────────┐       ┌──────────────┐
│    Book      │       │   Student    │
│──────────────│       │──────────────│
│ id           │       │ id           │
│ title        │       │ name         │
│ author       │       │ email        │
│ isbn         │       │ age          │
│ year         │       │ career       │
│ genre        │       │ semester     │
│ availableCop │       │ isActive     │
└──────────────┘       └──────────────┘

┌──────────────┐       ┌──────────────┐
│   Course     │       │  Enrollment  │
│──────────────│       │──────────────│
│ id           │◄──────│ id           │
│ title        │       │ studentId    │
│ level        │       │ courseId     │
└──────────────┘       └──────────────┘
```

## Cómo ejecutar

### 1. Requisitos previos

- Node.js ≥ 18
- PostgreSQL en ejecución local
- Git

### 2. Instalar dependencias

```bash
npm ci
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y ajusta los valores:

```bash
cp .env.example .env
```

Edita `.env` con los datos de tu base de datos PostgreSQL:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=library
```

> **Nota:** Debes crear la base de datos `library` en PostgreSQL antes de iniciar:
> ```sql
> CREATE DATABASE library;
> ```

### 4. Iniciar en modo desarrollo

```bash
npm run start:dev
```

La API quedará disponible en `http://localhost:3000`.  
El panel de estudiantes en `http://localhost:3000/panel/`.

---

## Endpoints

### Libros (`/books`) — Recurso principal con persistencia PostgreSQL

| Método | Ruta | Descripción | Cuerpo |
|---|---|---|---|
| `GET` | `/books` | Listar todos los libros | — |
| `GET` | `/books/:id` | Obtener un libro por id | — |
| `POST` | `/books` | Crear un libro | JSON |
| `PATCH` | `/books/:id` | Actualizar parcialmente | JSON |
| `DELETE` | `/books/:id` | Eliminar un libro | — |

**Cuerpo de creación (`POST /books`):**

```json
{
  "title": "El Quijote",
  "author": "Miguel de Cervantes",
  "isbn": "9788420412146",
  "year": 1605,
  "genre": "Novela",
  "availableCopies": 3
}
```

**Campos requeridos:**

| Campo | Tipo | Reglas |
|---|---|---|
| `title` | string | no vacío |
| `author` | string | no vacío |
| `isbn` | string | 10 o 13 dígitos numéricos, único |
| `year` | number | entero, 1000 — año actual |
| `genre` | string | no vacío |
| `availableCopies` | number | entero ≥ 0 |

**Códigos de respuesta:**

| Código | Significado |
|---|---|
| `200` | OK — operación exitosa |
| `201` | Created — libro creado |
| `400` | Bad Request — datos inválidos |
| `404` | Not Found — libro no existe |
| `409` | Conflict — ISBN duplicado |

---

### Rutas conservadas de semanas anteriores

| Método | Ruta | Para qué sirve |
|---|---|---|
| GET | `/`, `/welcome` | Bienvenida |
| GET / POST | `/courses` | Consultar o crear cursos |
| GET / PATCH / DELETE | `/courses/:id` | Gestionar un curso |
| GET / POST | `/students` | Consultar o registrar estudiantes |
| GET / PATCH / DELETE | `/students/:id` | Gestionar un estudiante |
| PATCH | `/students/:id/status` | Activar o desactivar |
| POST / GET | `/enrollments` | Matricular o consultar |
| GET | `/students/:id/enrollments` | Matrículas de un estudiante |
| GET | `/courses/:id/enrollments` | Matrículas de un curso |
| DELETE | `/enrollments/:id` | Cancelar matrícula |

---

## Tests

```bash
# Tests unitarios
npm test

# Tests de integración E2E
npm run test:e2e

# Tests de aceptación HTTP (requiere build)
npm run test:acceptance
```
