import { ValidationPipe, type INestApplication } from '@nestjs/common';

// La aplicación y las pruebas HTTP usan la misma validación global.
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
}
