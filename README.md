# CourseHub API · Proyecto integrador

Proyecto del repositorio original de LuisMa0121, ampliado con gestión de estudiantes y una interfaz gráfica. Se conserva la base NestJS 12, TypeScript, módulos ESM, cursos y pruebas de las sesiones 1–6.

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
- src/students/: módulo, controlador, servicio, DTOs, entidad y Pipe personalizado.
- src/setup-app.ts: validación global y recursos de la interfaz.
- public/: interfaz HTML, CSS y JavaScript conectada a la misma API.
- test/: pruebas originales y escenarios adicionales.
- AUDITORIA-REQUISITOS.md: matriz de cumplimiento.
- GUIA-EXPLICACION.md: guía para la demostración.

Consigna: https://epanchanaf.github.io/nestjs-course/semana-03/proyecto-integrador
Repositorio: https://github.com/LuisMa0121/coursehub-api
