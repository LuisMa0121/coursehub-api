# CourseHub API · Semanas 1 a 3

API del [curso de NestJS](https://epanchanaf.github.io/nestjs-course/).
Incluye la estructura modular de las primeras semanas y la entrega de
[Semana 3: DTOs, validación y errores HTTP](https://epanchanaf.github.io/nestjs-course/semana-03/proyecto-integrador).

## Requisitos y ejecución

- Node.js 24 LTS y npm. Entorno de comprobación: Node.js 24.18.0.
- Dependencias fijadas en `package-lock.json`.
- No se necesitan base de datos, Docker, cuentas externas ni archivo `.env`.

Desde la carpeta del proyecto:

```bash
npm ci
npm run start:dev
```

La API escucha en `http://localhost:3000`. Para detenerla, usa `Ctrl+C`.
En Windows PowerShell se puede usar `npm.cmd` si la política local bloquea `npm.ps1`.
El puerto se puede cambiar con `$env:PORT = '3001'` antes de iniciar.

Para ejecutar la compilación:

```bash
npm run build
npm run start:prod
```

## Alcance de la entrega

- Semana 1: `GET /`, `GET /welcome`, controlador y servicio registrados.
- Semana 2: `CoursesModule`, `CoursesController`, `CoursesService`,
  lectura, filtro por nivel y CRUD en memoria.
- Semana 3: `CreateCourseDto`, `UpdateCourseDto`, validación global,
  errores 400 y 404 y ejemplos verificables.
- Los datos son temporales: al reiniciar regresan los tres cursos iniciales.
  La base de datos, persistencia, autenticación y usuarios corresponden a semanas posteriores.

## Endpoints

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/` | 200: texto `Bienvenido a CourseHub API` |
| GET | `/welcome` | 200: `{"message":"Bienvenido a CourseHub API"}` |
| GET | `/courses` | 200: lista de cursos |
| GET | `/courses?level=beginner` | 200: cursos del nivel indicado |
| GET | `/courses/:id` | 200: curso; 404 si no existe |
| POST | `/courses` | 201: curso creado; 400 si el cuerpo es inválido |
| PATCH | `/courses/:id` | 200: curso actualizado; 400 o 404 |
| DELETE | `/courses/:id` | 200: curso eliminado; 404 si no existe |

`DELETE` devuelve el objeto eliminado con 200, como en el ejemplo principal
de la sesión 6. Los filtros sin coincidencias devuelven `[]`.

Estado inicial de `GET /courses`:

```json
[
  {"id":1,"title":"NestJS Fundamentals","level":"beginner"},
  {"id":2,"title":"REST APIs with NestJS","level":"beginner"},
  {"id":3,"title":"NestJS Architecture","level":"intermediate"}
]
```

## Contratos y flujo de una petición

`CreateCourseDto` exige:

| Campo | Regla |
| --- | --- |
| `title` | `@IsString()` y `@IsNotEmpty()`: texto no vacío |
| `level` | `@IsIn(['beginner', 'intermediate', 'advanced'])` |

`UpdateCourseDto` reutiliza esas reglas con `PartialType(CreateCourseDto)`.
Permite omitir campos y conserva los valores anteriores. Se configura
`skipNullProperties: false`: enviar `null` explícitamente falla la validación;
omitir el campo sigue estando permitido. Un PATCH `{}` no modifica el curso.

La función `configureApp`, llamada desde `src/main.ts`, registra
`new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`
globalmente. Las pruebas HTTP llaman a esa misma función.

```text
JSON → ValidationPipe → CoursesController → CoursesService → array en memoria
```

Las propiedades adicionales, incluido un `id` enviado en el cuerpo, se
rechazan con 400. No se aceptan por accidente.
El controlador delega la búsqueda y los cambios en el servicio.
`findOne` convierte el id de texto a número y lanza `NotFoundException` si no
lo encuentra; `update` y `remove` reutilizan esa búsqueda.

Los IDs empiezan en 4 porque existen tres semillas (1, 2 y 3).
El contador aumenta en cada creación y no reutiliza IDs eliminados durante
la misma ejecución. Al reiniciar también se reinicia ese contador.

## Pruebas manuales reproducibles

Con la aplicación recién iniciada, abre [requests.http](./requests.http)
en un cliente HTTP compatible, como REST Client de VS Code, y ejecuta las
peticiones de arriba hacia abajo. También puedes copiar método, URL y JSON
a Postman o Insomnia. No es necesario instalar una extensión para ejecutar
las pruebas automatizadas.

### Sesión 5 · POST válido y cuerpos inválidos

Petición válida:

```http
POST http://localhost:3000/courses
Content-Type: application/json

{"title":"Diseño de APIs","level":"intermediate"}
```

Respuesta: **201 Created**.

```json
{"id":4,"title":"Diseño de APIs","level":"intermediate"}
```

Comprueba después `GET /courses/4` y `GET /courses`.

Título vacío:

```http
POST http://localhost:3000/courses
Content-Type: application/json

{"title":"","level":"beginner"}
```

Respuesta: **400 Bad Request**.

```json
{
  "message":["title should not be empty"],
  "error":"Bad Request",
  "statusCode":400
}
```

Nivel no permitido:

```http
POST http://localhost:3000/courses
Content-Type: application/json

{"title":"Diseño de APIs","level":"expert"}
```

Respuesta: **400 Bad Request**.

```json
{
  "message":["level must be one of the following values: beginner, intermediate, advanced"],
  "error":"Bad Request",
  "statusCode":400
}
```

Otros casos incluidos en `requests.http`:

| Body del POST | Estado | Motivo |
| --- | --- | --- |
| `{"level":"beginner"}` | 400 | Falta el título |
| `{"title":42,"level":"beginner"}` | 400 | El título no es texto |
| `{"title":"Diseño de APIs","level":"beginner","duration":20}` | 400 | `property duration should not exist` |

Comprueba con `GET /courses` que los POST rechazados no agregaron cursos.

### Sesión 6 · PATCH, DELETE y 404

Ejecuta el siguiente recorrido en orden:

| Paso | Petición | Body | Comprobación |
| --- | --- | --- | --- |
| 1 | `GET /courses/1` | — | 200; título `NestJS Fundamentals`, nivel `beginner` |
| 2 | `PATCH /courses/1` | `{"level":"advanced"}` | 200; cambia el nivel y conserva el título |
| 3 | `PATCH /courses/1` | `{"level":"expert"}` | 400; el mensaje identifica el nivel inválido |
| 4 | `GET /courses/1` | — | 200; el nivel sigue siendo `advanced` |
| 5 | `PATCH /courses/1` | `{"id":99}` | 400; no cambia el identificador |
| 6 | `PATCH /courses/999` | `{"level":"advanced"}` | 404 |
| 7 | `DELETE /courses/1` | — | 200; devuelve el curso eliminado |
| 8 | `GET /courses/1` | — | 404 |
| 9 | `DELETE /courses/1` | — | 404; no inventa una segunda eliminación |
| 10 | `GET /courses/999` | — | 404 |
| 11 | `DELETE /courses/999` | — | 404 |

Respuesta del PATCH válido y del DELETE del paso 7:

```json
{"id":1,"title":"NestJS Fundamentals","level":"advanced"}
```

Respuesta para el id inexistente 999 en lectura, edición con body válido
o eliminación:

```json
{
  "message":"Course with id 999 not found",
  "error":"Not Found",
  "statusCode":404
}
```

Para completar el ciclo sobre el curso creado en la sesión 5:

1. `PATCH /courses/4` con `{"title":"Testing APIs with NestJS"}` → 200.
2. `GET /courses/4` → 200, con el nuevo título y el mismo nivel.
3. `DELETE /courses/4` → 200, con el curso eliminado.
4. `GET /courses/4` → 404.
5. Detén e inicia otra vez el servidor. `GET /courses` debe devolver
   exactamente los cursos 1, 2 y 3 del estado inicial.

## Verificación automatizada

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

Las pruebas unitarias comprueban el comportamiento de los servicios y
controladores. Las pruebas e2e envían peticiones HTTP a una instancia real
de Nest con la validación global: comprueban éxitos, errores, preservación
de datos ante entradas inválidas y aislamiento del estado en memoria.

La configuración de Vitest transpila TypeScript conservando los metadatos
de los decoradores. Nest necesita esos metadatos para la inyección de
dependencias y para identificar los DTOs durante las pruebas.

Comprobación realizada con Node.js 24.18.0: compilación y lint correctos,
10 pruebas unitarias y 35 pruebas e2e aprobadas. Además, se ejecutaron las
29 peticiones de `requests.http` contra `node dist/main.js`, incluido un
reinicio real que restauró las tres semillas.

## Organización

```text
src/
  main.ts
  setup-app.ts
  app.module.ts
  app.controller.ts
  app.service.ts
  welcome.controller.ts
  welcome.service.ts
  courses/
    courses.module.ts
    courses.controller.ts
    courses.service.ts
    dto/
      create-course.dto.ts
      update-course.dto.ts
test/
  app.e2e-spec.ts
requests.http
```

El proyecto conserva NestJS 12 y módulos ESM de la copia original; por eso
los imports relativos de TypeScript terminan en `.js`, que es la extensión
de los archivos compilados. No se requieren credenciales del servicio
Observe para realizar este ejercicio.

## Referencias de la entrega

- [Sesión 4: CRUD en memoria](https://epanchanaf.github.io/nestjs-course/semana-02/sesion-04)
- [Sesión 5: crear cursos con DTOs](https://epanchanaf.github.io/nestjs-course/semana-03/sesion-05)
- [Sesión 6: completar el CRUD](https://epanchanaf.github.io/nestjs-course/semana-03/sesion-06)
- [Lista de comprobación de Semana 3](https://epanchanaf.github.io/nestjs-course/semana-03/proyecto-integrador)
