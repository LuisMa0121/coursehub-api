import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { BooksModule } from './books/books.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { CoursesModule } from './courses/courses.module.js';
import { EnrollmentsModule } from './enrollments/enrollments.module.js';
import { LoansModule } from './loans/loans.module.js';
import { StudentsModule } from './students/students.module.js';
import { UsersModule } from './users/users.module.js';
import { WelcomeController } from './welcome.controller.js';
import { WelcomeService } from './welcome.service.js';
import Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().port().default(3000),
        DATABASE_HOST: Joi.string().default('localhost'),
        DATABASE_PORT: Joi.number().port().default(5432),
        DATABASE_USER: Joi.string().default('postgres'),
        DATABASE_PASSWORD: Joi.string().allow('').default(''),
        DATABASE_NAME: Joi.string().default('coursehub'),
        DB_HOST: Joi.string().optional(),
        DB_PORT: Joi.number().port().optional(),
        DB_USER: Joi.string().optional(),
        DB_PASSWORD: Joi.string().allow('').optional(),
        DB_NAME: Joi.string().optional(),
        DATABASE_SYNCHRONIZE: Joi.string().valid('true', 'false').default('false'),
        JWT_SECRET: Joi.string().default('super_secret_jwt_key_para_desarrollo_cambiar_en_produccion'),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST') || config.get<string>('DB_HOST') || 'localhost',
        port: Number(config.get('DATABASE_PORT') || config.get('DB_PORT') || 5432),
        username: config.get<string>('DATABASE_USER') || config.get<string>('DB_USER') || 'postgres',
        password: config.get<string>('DATABASE_PASSWORD') ?? config.get<string>('DB_PASSWORD') ?? '',
        database: config.get<string>('DATABASE_NAME') || config.get<string>('DB_NAME') || 'coursehub',
        autoLoadEntities: true,
        synchronize:
          config.getOrThrow<string>('NODE_ENV') === 'development' &&
          config.get('DATABASE_SYNCHRONIZE') === 'true',
      }),
    }),
    CoursesModule,
    StudentsModule,
    EnrollmentsModule,
    BooksModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    LoansModule,
  ],
  controllers: [AppController, WelcomeController],
  providers: [AppService, WelcomeService],
})
export class AppModule {}
