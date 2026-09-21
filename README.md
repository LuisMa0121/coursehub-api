# CourseHub API · Proyecto integrador

Proyecto del repositorio original de LuisMa0121, ampliado con gestión de estudiantes, matrículas en memoria y una interfaz gráfica de estudiantes. Se conserva la base NestJS 12, TypeScript, módulos ESM, cursos y pruebas de las sesiones 1–6.

## Ejecutar

Requiere Node.js 24.18 o superior compatible y npm.

```sh
npm ci
npm run build
npm run start:dev
```

Con npm, el puerto predeterminado es **3000**: abre http://127.0.0.1:3000/panel/.
En Visual Studio Code: abre esta carpeta, compila con Ctrl+Shift+B y pulsa F5. La configuración de depuración usa el puerto **3001**: http://127.0.0.1:3001/panel/.

La interfaz permite registrar, consultar, editar, activar, desactivar y eliminar estudiantes, así como combinar filtros. Los datos viven en memoria: reiniciar el servidor restablece los cursos y vacía estudiantes, como solicita el curso.

## Rutas de las sesiones

- GET / → CourseHub API está en línea.
- GET /welcome → JSON con el mensaje Bienvenido a CourseHub API.
- GET /courses y GET /courses/:id; filtro opcional ?level=beginner.
- POST /courses, PATCH /courses/:id y DELETE /courses/:id.

Los tres cursos iniciales, DTOs y comportamiento de cursos del repositorio original se conservan. Consulta SESIONES-1-A-6.md y requests.http para sus ejemplos.

## Proyecto integrador: estudiantes

| Método | Ruta | Función |
| --- | --- | --- |
| POST | /students | Registrar |
| GET | /students | Listar y filtrar |
| GET | /students/:id | Consultar |
| PATCH | /students/:id | Actualizar parcialmente |
| PATCH | /students/:id/status | Cambiar estado |
| DELETE | /students/:id | Eliminar si está activo |

Ejemplo de creación:

```json
{"name":"Ana Pérez","email":"ana@example.com","age":20,"career":"Sistemas","semester":3,"isActive":true}
```

Los filtros career, semester e isActive son opcionales y combinables, por ejemplo /students?career=Sistemas&semester=3&isActive=false. Se rechazan propiedades desconocidas, identificadores inválidos, correos duplicados y semestres fuera de 1–10. El id lo genera el servidor y no puede modificarse. Un estudiante inexistente responde 404; un conflicto responde 409; datos inválidos responden 400.

## Verificación

```sh
npm run lint
npm test
npm run test:e2e
npm run test:acceptance
```

Se conservan las pruebas unitarias y HTTP originales. La aceptación adicional ejecuta 80 escenarios de estudiantes, 27 de la base CourseHub y 14 de la interfaz sobre servidores aislados con puertos temporales.

Las dos colecciones de postman/ incluyen casos correctos y errores esperados. Para ejecutarlas manualmente utiliza una instancia nueva y configura baseUrl con su puerto (las colecciones proponen 3001). **Las colecciones crean, modifican y eliminan registros de prueba**: no ejecutarlas contra una sesión con datos que quieras conservar. Los resúmenes Newman incluyen los resultados de una instancia aislada.

## Organización

- src/courses/: base de las sesiones, conservada.
- src/students/: módulo, controlador, servicio, DTOs, tipo local y Pipe personalizado.
- src/setup-app.ts: validación global y recursos de la interfaz.
- public/: interfaz HTML, CSS y JavaScript conectada a la misma API.
- test/: pruebas originales y escenarios adicionales.
- AUDITORIA-REQUISITOS.md: matriz de cumplimiento.
- GUIA-EXPLICACION.md: guía para la demostración.

Consigna: https://epanchanaf.github.io/nestjs-course/semana-03/proyecto-integrador
Repositorio: https://github.com/LuisMa0121/coursehub-api

## Evaluación práctica Integración Cursos y Estudiantes

### Merge verificable

Al recibir la evaluación, Cursos y Estudiantes ya estaban juntos en main (213e13c) y el remoto no tenía una rama alternativa de estudiantes. Se creó integracion-estudiantes desde esa base, se preparó StudentsService para compartir sus datos y se incorporó mediante un merge --no-ff desde main. No se reescribió el historial ni se sustituyeron los módulos. Esta rama documenta la adaptación actual; no representa una rama histórica del trabajo anterior.

Comprueba el merge y sus dos padres con:

```sh
git log --graph --oneline --all
git log --merges --oneline
```

AppModule registra CoursesModule, StudentsModule y EnrollmentsModule. Los servicios de cursos y estudiantes se exportan desde sus módulos e inyectan en EnrollmentsService, compartiendo las listas originales. Matrículas usa un tipo local, un arreglo y un contador. No hay base de datos, ORM, entidades ni repositorios de persistencia.

### Endpoints de matrículas

| Método | Ruta | Respuesta correcta |
| --- | --- | --- |
| POST | /enrollments | 201, matrícula creada |
| GET | /enrollments | 200, lista; filtros opcionales studentId y courseId combinables |
| GET | /students/:studentId/enrollments | 200, matrículas del estudiante existente |
| GET | /courses/:courseId/enrollments | 200, matrículas del curso existente |
| DELETE | /enrollments/:id | 200, matrícula cancelada |

CreateEnrollmentDto requiere studentId y courseId como enteros positivos JSON. Los filtros se validan y convierten desde texto. Se conserva ValidationPipe global con whitelist y forbidNonWhitelisted; ParseIntPipe valida los identificadores de las consultas y PositiveIdPipe el de cancelación. Las decisiones de existencia, estado y duplicado permanecen en el servicio.

### Demostración reproducible

Ejecuta los ejemplos de enrollments.http en una instancia nueva (puerto predeterminado 3000; cambia baseUrl a 3001 si usas F5). Los ejemplos crean dos estudiantes ficticios y usan los cursos iniciales. No ejecutar la secuencia sobre datos que quieras conservar.

1. POST /students con {"name":"Ana Prueba","email":"ana@example.com","age":20,"career":"Software","semester":5,"isActive":true} devuelve 201 con id 1. Crea otro estudiante con email inactivo@example.com e isActive false; obtiene id 2.
2. **Válida:** POST /enrollments con {"studentId":1,"courseId":1} → 201, {"id":1,"studentId":1,"courseId":1}.
3. **Duplicada:** repite el body anterior → 409, mensaje “El estudiante ya está matriculado en ese curso”.
4. **Inactivo:** {"studentId":2,"courseId":1} → 409, mensaje “No se puede matricular a un estudiante inactivo”.
5. **Inexistentes:** {"studentId":999,"courseId":1} → 404; {"studentId":1,"courseId":999} → 404. No se crea ninguna matrícula.
6. **Datos inválidos:** {"studentId":"1","courseId":1} o añadir una propiedad desconocida → 400.
7. **Filtros:** GET /enrollments?studentId=1&courseId=1 → 200, [{"id":1,"studentId":1,"courseId":1}]. Cada filtro funciona también por separado.
8. **Por estudiante/curso:** GET /students/1/enrollments y GET /courses/1/enrollments → la misma lista de una matrícula. Un padre inexistente responde 404; uno existente sin matrículas devuelve [].
9. **Cancelación:** DELETE /enrollments/1 → 200, {"id":1,"studentId":1,"courseId":1}. GET /enrollments → []. Repetir DELETE → 404. Volver a matricular a la misma pareja se permite y genera id 2.

Los errores tienen el formato NestJS: {"message":"...","error":"Conflict","statusCode":409} (o Not Found/404 y Bad Request/400). Los errores de DTO pueden devolver una lista de mensajes.

### Evidencia automatizada

```sh
npm run test:e2e
```

El archivo test/enrollments.e2e-spec.ts verifica los casos anteriores contra HTTP real de NestJS, filtros individuales/combinados, cancelación, contador, datos inválidos y que cursos/estudiantes comparten sus instancias. Las suites anteriores se conservan para comprobar que la integración no rompe su funcionamiento. La interfaz existente sigue siendo exclusivamente de estudiantes: la evaluación solicita matrículas por API.

Verificación del 21/09/2026: compilación y lint correctos; 70 pruebas HTTP (35 de matrículas y 35 originales), 10 unitarias y 121 escenarios adicionales aprobados. Ningún fallo.
