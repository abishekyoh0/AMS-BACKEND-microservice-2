import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Hybrid app — TCP microservice (for gateway) + HTTP (for Swagger)
  const app = await NestFactory.create(AppModule);

  // ── TCP microservice ──────────────────────────────────────────────────────
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.NOTIFICATION_SERVICE_HOST || '0.0.0.0',
      port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '4003'),
    },
  });

  app.setGlobalPrefix('api/notification');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors();

  // ── Swagger ───────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('AMS — Notification Service')
    .setDescription('Notifications and access request management')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Bearer')
    .addTag('notifications', 'Notification management')
    .addTag('access-requests', 'Access request management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/notification/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'AMS Notification Service Docs',
  });

  // Start TCP
  await app.startAllMicroservices();

  // Start HTTP for Swagger
  const httpPort = parseInt(process.env.NOTIFICATION_SWAGGER_PORT || '4013');
  await app.listen(httpPort);

  console.log(`🔔 Notification Service (TCP)     → port ${process.env.NOTIFICATION_SERVICE_PORT || 4003}`);
  console.log(`📖 Notification Service (Swagger) → http://localhost:${httpPort}/api/notification/docs`);
}

bootstrap();
