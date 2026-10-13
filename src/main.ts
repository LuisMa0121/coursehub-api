import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') || 3000;
  await app.listen(port);
}
await bootstrap();
