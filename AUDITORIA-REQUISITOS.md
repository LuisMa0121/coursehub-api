# Auditoría del trabajo práctico

**Fecha:** 15 de septiembre de 2026.
**Fuente contrastada:** [Trabajo práctico · Semana 3 — Gestión de estudiantes](https://epanchanaf.github.io/nestjs-course/semana-03/proyecto-integrador), releída durante esta auditoría.

## Dictamen

**El módulo cumple los requisitos funcionales, las nueve reglas de negocio y las restricciones técnicas de almacenamiento y separación de responsabilidades.** Las verificaciones del código y de las peticiones HTTP no detectaron incumplimientos funcionales.

**Integrado sobre el repositorio original coursehub-api (base 6604e17).** Se conservan NestJS 12, ESM, CoursesModule, WelcomeController, WelcomeService y sus pruebas. StudentsModule se añade al AppModule original.

La demostración ante el docente debe realizarla el estudiante o equipo. Se entregan la colección Postman probada, sus resultados y una guía de exposición.

## 1. Información mínima del estudiante

| Campo | Resultado | Evidencia |
| --- | --- | --- |
| `id` | Cumple | Identificador numérico generado mediante contador; no se recibe en DTOs |
| `name` | Cumple | Texto no vacío validado y almacenado |
| `email` | Cumple | Correo válido, normalizado y único |
| `age` | Cumple | Edad entera no negativa |
| `career` | Cumple | Carrera como texto no vacío |
| `semester` | Cumple | Semestre entero de 1 a 10 |
| `isActive` | Cumple | Estado booleano |

Archivos principales: `src/students/entities/student.entity.ts` y `src/students/dto/create-student.dto.ts`.

## 2. Operaciones solicitadas

| Operación | Resultado | Ruta y verificación |
| --- | --- | --- |
| Registrar | Cumple | `POST /students` devuelve 201 y crea el estudiante |
| Consultar todos | Cumple | `GET /students` devuelve un arreglo con 200 |
| Consultar por id | Cumple | `GET /students/:id` devuelve 200 o 404 |
| Actualizar parcialmente | Cumple | `PATCH /students/:id` conserva los campos no enviados |
| Eliminar | Cumple | `DELETE /students/:id` elimina estudiantes activos y devuelve 200 |
| Cambiar exclusivamente el estado | Cumple | `PATCH /students/:id/status` solo admite `isActive` |
| Filtrar por carrera, semestre y estado | Cumple | Los tres filtros son opcionales y se combinan con condición AND; `isActive=false` funciona |

Archivos principales: `students.controller.ts`, `students.service.ts` y `dto/filter-students.dto.ts` dentro de `src/students/`.

## 3. Las nueve reglas de negocio

| N.º | Regla | Resultado | Evidencia de implementación y prueba |
| --- | --- | --- | --- |
| 1 | Correo único | Cumple | `ensureUniqueEmail` se usa al crear y actualizar; los duplicados, incluso con mayúsculas diferentes, responden 409 |
| 2 | Semestre entre 1 y 10 | Cumple | `IsInt`, `Min(1)` y `Max(10)`; se probaron extremos válidos y valores inválidos |
| 3 | No eliminar estudiantes inactivos | Cumple | `remove` responde 409; el registro permanece. La interfaz también deshabilita su botón Eliminar |
| 4 | Verificar existencia antes de consultar, modificar o eliminar | Cumple | `findOne` centraliza el 404 y se reutiliza en `update`, `updateStatus` y `remove` |
| 5 | Validar datos antes de la lógica | Cumple | `ValidationPipe` global y DTOs; peticiones inválidas responden 400 |
| 6 | Actualización parcial sin cambiar id | Cumple | `PartialType` conserva validadores; `id` es rechazado como propiedad no permitida |
| 7 | Transformar o validar parámetros de rutas | Cumple | El Pipe procesa el id original de la URL y devuelve un entero positivo seguro |
| 8 | Al menos un Pipe personalizado | Cumple | `PositiveIdPipe`, aplicado a las rutas que reciben identificador |
| 9 | Excepciones y códigos HTTP apropiados | Cumple | 400 para entrada inválida, 404 para estudiante inexistente y 409 para conflictos; 200 y 201 en operaciones exitosas |

## 4. Restricciones y condiciones de entrega

| Condición | Resultado | Observación |
| --- | --- | --- |
| Sin base de datos | Cumple | No hay ORM ni conexión a base de datos |
| Almacenamiento en memoria | Cumple | Arreglo privado en `StudentsService`; se vacía al reiniciar |
| Controllers sin lógica de negocio | Cumple | Los métodos del controlador delegan al servicio |
| Organización por responsabilidades | Cumple | Módulo, controlador, servicio, DTOs, entidad y Pipe separados |
| Conceptos de NestJS hasta Semana 3 | Compatible en el módulo | El núcleo usa módulos, inyección, rutas, DTOs, Pipes y excepciones; no se añadió persistencia ni autenticación |
| Usar como base el proyecto del curso | Cumple | Integrado en el repositorio original, conservando cursos y bienvenida |
| Demostrar éxitos y errores con cliente HTTP | Preparado y probado | Colección Postman ejecutada con Newman: 80 solicitudes y 168 comprobaciones, sin fallos; el equipo debe presentarla en clase |
| Trabajo individual o en parejas; duración indicada | No verificable desde el código | Son condiciones de organización de la actividad |

La interfaz gráfica fue añadida por solicitud del usuario. Está en `public/`, utiliza HTML/CSS/JavaScript y solicita datos a la misma API. Las reglas exigidas continúan en el backend. El alcance concreto de lo permitido en clase debe contrastarse con las indicaciones adicionales del docente, si las hubiera.

## 5. Evidencia ejecutada sobre el repositorio integrado

- Compilación TypeScript y lint: sin errores.
- Vitest: 10 pruebas unitarias y 35 pruebas HTTP originales aprobadas.
- test:acceptance: 80 escenarios de estudiantes, 27 de cursos/bienvenida y 14 de interfaz aprobados (121 escenarios; Node informa 124 al contar los tres contenedores).
- Newman: estudiantes, 80 solicitudes y 168 comprobaciones; CourseHub, 27 solicitudes y 58 comprobaciones. Cero fallos en ambas colecciones.
- Las pruebas arrancan servidores aislados; no modifican la instancia de demostración.

## 6. Base de las sesiones 1–6

Se conserva el proyecto original, su historial Git, NestJS 12, módulos ESM y Vitest. Se mantienen CoursesModule con CRUD, DTOs y excepciones, WelcomeController/WelcomeService y scaffolding Nest CLI. GET / se ajustó al texto exacto de la sesión 1. La interfaz se sirve en /panel/.

## 7. Presentación

El código y las colecciones están preparados. El estudiante debe realizar la exposición: ejecutar una colección sobre una instancia nueva, mostrar éxitos y errores y explicar controlador, servicio, DTOs y Pipe con la guía adjunta.

La ausencia de persistencia es intencionada: los datos se pierden al reiniciar, según la consigna. La interfaz es un complemento solicitado por el usuario.
