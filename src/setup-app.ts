import {
  ForbiddenException,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { fileURLToPath } from 'node:url';
import { HttpErrorFilter } from './common/filters/http-error.filter.js';
import { TimingInterceptor } from './common/interceptors/timing.interceptor.js';

export function configureApp(app: INestApplication): void {
  (app as NestExpressApplication).useStaticAssets(
    fileURLToPath(new URL('../public', import.meta.url)),
    { prefix: '/panel/' },
  );

  const config = app.get(ConfigService, { strict: false });
  const rawOrigins =
    config?.get<string>('CORS_ORIGINS') ||
    'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000';
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new ForbiddenException(
            `Origen '${origin}' no admitido por la política CORS del entorno`,
          ),
        );
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Componentes transversales registrados una sola vez
  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalInterceptors(new TimingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
}
