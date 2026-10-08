import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const payloadLimit = process.env.PAYLOAD_LIMIT || process.env.BODY_LIMIT || '50mb';
  app.use(json({ limit: payloadLimit }));
  app.use(urlencoded({ limit: payloadLimit, extended: true }));

  logger.log(`📦 Express Payload Limit configured to: ${payloadLimit}`);

  app.useStaticAssets(path.join(process.cwd(), 'public', 'images'), {
    prefix: '/images/',
  });
  app.useStaticAssets(path.join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('LoRaWAN Network & IoT Platform API')
    .setDescription('NestJS Backend với Dynamic PostgreSQL Table-to-DB Routing & RBAC')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 LoRaWAN Platform Backend server is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger API Documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
