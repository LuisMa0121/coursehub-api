# CourseHub API

API REST para la **gestión de cursos, estudiantes y matrículas** con persistencia en PostgreSQL.

Desarrollada con **NestJS**, **TypeORM** y **PostgreSQL**.

## Integrantes

1. Luis Mario Cedeño Bravo

## Descripción del proyecto

CourseHub API permite administrar cursos, estudiantes y matrículas. Todos los datos se persisten en PostgreSQL mediante TypeORM y se conservan entre reinicios del servidor.

### Entidades y relaciones

```
Course 1 ──── * Enrollment * ──── 1 Student

┌──────────────┐        ┌─────────────────┐        ┌──────────────┐
│   Course     │        │   Enrollment    │        │   Student    │
│──────────────│        │─────────────────│        │──────────────│
│ id           │◄───────│ id              │───────►│ id           │
│ title        │  FK    │ courseId (FK)   │  FK    │ name         │
│ level        │        │ studentId (FK)  │        │ email unique │
└──────────────┘        └─────────────────┘        │ age          │
                                                   │ career       │
┌──────────────┐                                   │ semester     │
│    Book      │                                   │ isActive     │
│──────────────│                                   └──────────────┘
│ id           │
│ title        │
│ author       │
│ isbn unique  │
│ year         │
│ genre        │
│ availableCop │
└──────────────┘
```

## Requisitos de PostgreSQL

- PostgreSQL ≥ 13 instalado y en ejecución local
- Crear la base de datos antes de iniciar la API:

```sql
CREATE DATABASE coursehub;
```

> La API usa `synchronize: true` en desarrollo, por lo que TypeORM creará las tablas automáticamente al arrancar.

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

Edita `.env` con los datos de tu instalación de PostgreSQL:

```env
PORT=3000
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=tu_contraseña
DATABASE_NAME=coursehub
```

### 4. Iniciar en modo desarrollo

```bash
npm run start:dev
```

La API quedará disponible en `http://localhost:3000`.

---

## Endpoints

### Cursos (`/courses`) — Persistencia PostgreSQL

| Método | Ruta | Descripción | Cuerpo |
|---|---|---|---|
| `GET` | `/courses` | Listar cursos (filtro opcional `?level=beginner`) | — |
| `GET` | `/courses/:id` | Obtener un curso por id | — |
| `POST` | `/courses` | Crear un curso | `{ "title": "string", "level": "beginner\|intermediate\|advanced" }` |
| `PATCH` | `/courses/:id` | Actualización parcial | JSON con campos a modificar |
| `DELETE` | `/courses/:id` | Eliminar curso | — |

---

### Estudiantes (`/students`) — Persistencia PostgreSQL

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/students` | Listar (filtros opcionales: `career`, `semester`, `isActive`) |
| `GET` | `/students/:id` | Obtener estudiante por id |
| `POST` | `/students` | Crear estudiante |
| `PATCH` | `/students/:id` | Actualizar parcialmente |
| `PATCH` | `/students/:id/status` | Activar o desactivar |
| `DELETE` | `/students/:id` | Eliminar (solo activos) |

**Cuerpo de creación (`POST /students`):**

```json
{
  "name": "string",
  "email": "correo@ejemplo.com",
  "age": 20,
  "career": "string",
  "semester": 5,
  "isActive": true
}
```

| Código | Significado |
|---|---|
| `201` | Creado |
| `400` | Datos inválidos |
| `404` | Estudiante no encontrado |
| `409` | Correo duplicado |

---

### Matrículas (`/enrollments`) — Persistencia PostgreSQL con relaciones FK

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/enrollments` | Crear matrícula (`studentId`, `courseId`) |
| `GET` | `/enrollments` | Listar (filtros opcionales: `studentId`, `courseId`) |
| `GET` | `/students/:studentId/enrollments` | Matrículas de un estudiante |
| `GET` | `/courses/:courseId/enrollments` | Matrículas de un curso |
| `DELETE` | `/enrollments/:id` | Cancelar matrícula |

**Reglas de matrícula:**

| Situación | Código HTTP |
|---|---|
| Estudiante o curso no existe | `404 Not Found` |
| Estudiante inactivo | `400 Bad Request` |
| Matrícula duplicada | `409 Conflict` |

Las respuestas incluyen los objetos completos de `student` y `course`.

---

### Libros (`/books`) — Persistencia PostgreSQL

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/books` | Listar todos los libros |
| `GET` | `/books/:id` | Obtener libro por id |
| `POST` | `/books` | Crear libro |
| `PATCH` | `/books/:id` | Actualización parcial |
| `DELETE` | `/books/:id` | Eliminar libro |

---

### Otras rutas

| Método | Ruta | Para qué sirve |
|---|---|---|
| GET | `/` | Mensaje de bienvenida |
| GET | `/welcome` | Saludo de bienvenida en JSON |

---

## Tests

```bash
# Tests unitarios
npm test

# Tests de integración E2E
npm run test:e2e
```
