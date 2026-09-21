# CourseHub

Trabajo práctico para gestionar cursos, estudiantes y matrículas. Los datos se guardan en memoria y se pierden al reiniciar.

## Cómo usarlo

Ejecuta `npm ci` y `npm run start:dev`. La API abre en el puerto 3000 y la pantalla de estudiantes en `/panel/`. Con F5 en Visual Studio Code se usa el puerto 3001.

## Rutas

| Método | Ruta | Para qué sirve |
| --- | --- | --- |
| GET | `/`, `/welcome` | Bienvenida |
| GET / POST | `/courses` | Consultar o crear cursos |
| GET / PATCH / DELETE | `/courses/:id` | Consultar, editar o eliminar un curso |
| GET / POST | `/students` | Consultar o registrar estudiantes |
| GET / PATCH / DELETE | `/students/:id` | Consultar, editar o eliminar un estudiante |
| PATCH | `/students/:id/status` | Activar o desactivar |
| POST | `/enrollments` | Matricular |
| GET | `/enrollments` | Consultar; permite combinar `studentId` y `courseId` |
| GET | `/students/:studentId/enrollments` | Matrículas de un estudiante |
| GET | `/courses/:courseId/enrollments` | Matrículas de un curso |
| DELETE | `/enrollments/:id` | Cancelar una matrícula |

## Ejemplo para la evaluación

En una sesión nueva, crea un estudiante con `POST /students`:

```json
{"name":"Ana","email":"ana@example.com","age":20,"career":"Software","semester":5,"isActive":true}
```

Recibirás sus datos con `id: 1`. Crea otro con correo distinto e `isActive: false`; tendrá `id: 2`. El curso 1 ya viene creado.

| Caso | Petición | Respuesta esperada |
| --- | --- | --- |
| Matrícula válida | `POST /enrollments` con `{"studentId":1,"courseId":1}` | 201: `{"id":1,"studentId":1,"courseId":1}` |
| Duplicada | Repetir la petición anterior | 409: “El estudiante ya está matriculado en ese curso” |
| Estudiante inactivo | `POST /enrollments` con `{"studentId":2,"courseId":1}` | 409: “No se puede matricular a un estudiante inactivo” |
| Estudiante inexistente | `POST /enrollments` con `{"studentId":999,"courseId":1}` | 404 |
| Curso inexistente | `POST /enrollments` con `{"studentId":1,"courseId":999}` | 404 |
| Filtrar | `GET /enrollments?studentId=1&courseId=1` | 200: `[{"id":1,"studentId":1,"courseId":1}]` |
| Cancelar | `DELETE /enrollments/1` | 200: `{"id":1,"studentId":1,"courseId":1}` |
| Comprobar cancelación | `GET /enrollments` | 200: `[]` |

Las pruebas se ejecutan con `npm run test:e2e`. Pasaron los 35 casos de matrículas y las pruebas anteriores.

El merge está en el commit `5ba3440`. Como estudiantes ya estaba en `main`, se creó la rama `integracion-estudiantes` para adaptar el módulo y unirlo sin perder lo anterior.
