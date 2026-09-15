import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { fileURLToPath } from 'node:url';
export function configureApp(app: INestApplication): void {
  (app as NestExpressApplication).useStaticAssets(
    fileURLToPath(new URL('../public', import.meta.url)),
    { prefix: '/panel/' },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
}
