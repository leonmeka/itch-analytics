import 'dotenv/config';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { AppModule } from '@/api/app.module';
import { PORT_KEY } from './config.constants';
import { CORS_CONFIG } from './cors.config';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.enableShutdownHooks();

  // CSV imports can be large; the generous limit only applies to the
  // payments import path (the global pipe stays tight below it).
  app.use('/me/payments/import', json({ limit: '10mb' }));
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  for (const signal of ['unhandledRejection', 'uncaughtException'] as const) {
    process.once(signal, async (err: unknown) => {
      console.error(`Fatal ${signal}:`, err);
      setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
      await app.close().catch(() => undefined);
      process.exit(1);
    });
  }

  // Trust reverse proxy to get real client IP
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Rate limiting
  app.use(
    '/auth/login',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7' }),
  );
  for (const route of ['/auth', '/itch']) {
    app.use(route, rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-7' }));
  }

  // Enable CORS
  app.enableCors(CORS_CONFIG);

  // Security headers
  app.use(helmet());

  // DTO validation + coercion (class-validator / class-transformer)
  app.useGlobalPipes(
    new ValidationPipe({
      // strip properties that have no decorator (undeclared input is dropped)
      whitelist: true,
      // reject requests carrying unknown properties outright
      forbidNonWhitelisted: true,
      // transform payloads into DTO instances so defaults/transforms apply
      transform: true,
    }),
  );

  // OpenAPI docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('itch API')
    .setDescription('REST API powering the itch analytics dashboard (auth, itch.io games).')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = app.get<number>(PORT_KEY);

  await app.listen(port);

  Logger.log(`Application is running on port ${port}`, 'Bootstrap');
  Logger.log('REST API is available at /', 'Bootstrap');
  Logger.log('OpenAPI docs available at /docs', 'Bootstrap');
}

void bootstrap();
