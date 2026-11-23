/**
 * Errores de negocio del módulo de cursos.
 * No dependen de HTTP: el HttpErrorFilter global los traduce a 404 / 403.
 */
export class CourseNotFoundError extends Error {
  constructor(readonly courseId: number) {
    super(`Course with id ${courseId} not found`);
    this.name = 'CourseNotFoundError';
  }
}

export class CourseOwnershipError extends Error {
  constructor() {
    super('Acceso denegado: un docente solo puede modificar sus propios cursos');
    this.name = 'CourseOwnershipError';
  }
}
