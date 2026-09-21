# Guía para entender y demostrar el trabajo

## Demostración con la interfaz gráfica

Abre **http://127.0.0.1:3001/panel/**. La pantalla se llama Campus y permite operar la API desde formularios y botones.

1. Si está vacía, pulsa **Cargar ejemplo** para crear tres estudiantes ficticios.
2. Pulsa **Nuevo estudiante**, completa sus datos y registra una persona de prueba.
3. Usa **Ver** para consultar su ficha y **Editar** para cambiar solo el semestre.
4. Combina carrera, semestre y estado; pulsa **Aplicar filtros**. Luego pulsa **Limpiar**.
5. Desactiva al estudiante: el estado y los indicadores cambian y Eliminar queda deshabilitado.
6. Actívalo de nuevo y elimínalo confirmando el diálogo.

La interfaz envía peticiones HTTP al backend; las reglas siguen en los DTOs, Pipes y servicio. El navegador presenta los errores y actualiza la pantalla con los datos devueltos por NestJS.

Para demostrar errores HTTP detallados con Postman, reinicia primero la API: su colección necesita la memoria vacía.

## Idea general

El proyecto administra estudiantes mediante peticiones HTTP. NestJS recibe la petición, comprueba sus datos y llama a un servicio que trabaja con un arreglo. La respuesta vuelve al cliente como JSON.

```text
Cliente HTTP
    ↓
Validación / transformación con Pipes y DTOs
    ↓
StudentsController: selecciona la operación
    ↓
StudentsService: verifica reglas y utiliza el arreglo
    ↓
Respuesta JSON con código HTTP
```

## Orden sugerido para estudiar el código

1. **tipo Student en students.service.ts**: identifica los siete campos del estudiante. `id` pertenece al resultado, pero no al DTO de creación.
2. **create-student.dto.ts**: revisa los decoradores. TypeScript ayuda al programar; `class-validator` comprueba los datos que llegan realmente por HTTP.
3. **setup-app.ts**: entiende dónde se activa esa validación y por qué se rechaza una propiedad desconocida.
4. **students.service.ts**: estudia `create`, `findAll`, `findOne`, `update`, `updateStatus` y `remove`. Aquí están las decisiones de negocio.
5. **students.controller.ts**: relaciona cada decorador HTTP con su método del servicio. El controlador recibe parámetros y delega.
6. **positive-id.pipe.ts**: `@Param(PositiveIdPipe)` entrega el objeto de parámetros `{ id: "1" }` al Pipe, que extrae y valida el texto original y devuelve `1`. Observa por qué `"abc"`, `"1.5"`, `"1e0"` y `"0"` producen 400. Recibir el objeto completo evita que el ValidationPipe global convierta el id antes de comprobar su formato.
7. **update-student.dto.ts**: `PartialType` vuelve opcionales los campos; `skipNullProperties: false` mantiene el rechazo de valores nulos.
8. **filter-students.dto.ts**: observa cómo se convierten los parámetros de URL. El texto `"false"` debe convertirse a `false`, no a `true`.
9. **students.module.ts / app.module.ts**: comprueba cómo Nest registra e inyecta cada clase.

## Tres recorridos importantes

### Registrar

`POST /students` con un estudiante válido:

1. El DTO verifica tipos, correo y rango del semestre.
2. El controlador envía el DTO al servicio.
3. El servicio comprueba que no haya otro correo igual.
4. Genera un id creciente e inserta el estudiante en el arreglo.
5. Nest responde 201 y el objeto creado.

Un correo bien formado pero repetido supera la validación de formato; se rechaza en el servicio con 409 porque la decisión requiere consultar los estudiantes almacenados.

### Actualizar

`PATCH /students/1` con `{ "semester": 5 }`:

1. Los Pipes verifican el id y los campos enviados.
2. El servicio busca al estudiante; si no existe, responde 404.
3. Comprueba unicidad si se envió un nuevo correo.
4. `Object.assign` copia únicamente las propiedades enviadas y validadas.
5. Devuelve el estudiante actualizado con 200.

El DTO no declara `id` y la validación global rechaza campos desconocidos. Por eso no se puede cambiar el identificador desde el body.

### Eliminar

`DELETE /students/1`:

1. El Pipe valida el id.
2. `findOne` comprueba existencia.
3. Si el estudiante está inactivo, `ConflictException` detiene la operación con 409.
4. Si está activo, `splice` lo retira del arreglo y se devuelve el estudiante eliminado con 200.

## Demostración breve en clase

Reinicia la API para comenzar sin datos. Usa estas peticiones manualmente o selecciona sus equivalentes en la colección. Los ejemplos usan datos ficticios.

| Paso | Petición | Body / resultado que debes explicar |
| --- | --- | --- |
| 1 | GET `/students` | 200 y `[]` |
| 2 | POST `/students` | Usa el JSON del README: 201, id 1 |
| 3 | POST `/students` | Repite el correo: 409 |
| 4 | POST `/students` | Otro correo y semestre 11: 400 |
| 5 | GET `/students/1` | 200 y estudiante completo |
| 6 | GET `/students/abc` | 400 del Pipe personalizado |
| 7 | GET `/students/999` | 404: id válido pero inexistente |
| 8 | PATCH `/students/1` | `{ "semester": 5 }`: 200 y demás campos conservados |
| 9 | PATCH `/students/1` | `{ "id": 99 }`: 400 |
| 10 | GET `/students?career=Software&semester=5&isActive=true` | Devuelve el estudiante que cumple todos los filtros |
| 11 | PATCH `/students/1/status` | `{ "isActive": false }`: 200 |
| 12 | GET `/students?isActive=false` | Devuelve el estudiante inactivo |
| 13 | DELETE `/students/1` | 409: no se puede borrar inactivo |
| 14 | PATCH `/students/1/status` | `{ "isActive": true }`: 200 |
| 15 | DELETE `/students/1` | 200 y estudiante eliminado |
| 16 | GET `/students/1` | 404 después de eliminar |

No ejecutes esta secuencia manual antes del Runner sin reiniciar: la colección completa necesita su propio estado inicial vacío.

## Preguntas que debes poder responder

**¿Por qué no hay lógica de negocio en el controlador?**

El controlador se ocupa de HTTP. El servicio concentra las reglas para que puedan mantenerse y reutilizarse en un solo lugar.

**¿Por qué el correo único se verifica también en PATCH?**

Si solo se verificara al registrar, una actualización podría producir dos estudiantes con el mismo correo.

**¿Por qué los filtros usan `=== undefined`?**

Porque `false` es un valor válido del filtro `isActive`. Comprobar solo si el filtro es verdadero ignoraría la búsqueda de inactivos.

**¿Qué diferencia hay entre 400, 404 y 409?**

400 indica datos mal formados; 404 indica que no existe el estudiante; 409 indica que la operación entra en conflicto con una regla de negocio.

**¿Por qué se reutiliza `findOne`?**

Centraliza la búsqueda y el error 404. Actualizar, cambiar estado y eliminar comprueban existencia con el mismo criterio.

**¿Qué ocurre al reiniciar?**

Se vacía el arreglo y el contador vuelve a 1. La práctica requiere almacenamiento temporal en memoria.

**¿Qué cambia exclusivamente la ruta `/status`?**

Solo `isActive`. Su DTO contiene una única propiedad y rechaza cualquier otra.

## Propuesta de explicación inicial

“Implementé un módulo de estudiantes con un controlador para las rutas y un servicio para los datos y las reglas de negocio. Los DTOs validan la entrada con un ValidationPipe global. El Pipe personalizado transforma y valida los ids. La información se conserva en un arreglo durante la ejecución. Voy a mostrar operaciones exitosas y errores de validación, existencia y conflicto.”

Usa esta explicación como apoyo y asegúrate de poder señalar cada parte en el código.
