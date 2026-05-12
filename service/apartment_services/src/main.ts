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
      host: process.env.APARTMENT_SERVICE_HOST || '0.0.0.0',
      port: parseInt(process.env.APARTMENT_SERVICE_PORT || '4002'),
    },
  });

  app.setGlobalPrefix('api/apartment');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors();

  // ── Swagger ───────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('AMS — Apartment Service')
    .setDescription('Blocks, Floors, Flats, Units and Visitor management')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Bearer')
    .addTag('blocks', 'Block management')
    .addTag('floors', 'Floor management')
    .addTag('flats', 'Flat management')
    .addTag('units', 'Unit management')
    .addTag('visitors', 'Visitor management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/apartment/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'AMS Apartment Service Docs',
  });

  // Start TCP
  await app.startAllMicroservices();

  // Start HTTP for Swagger
  const httpPort = parseInt(process.env.APARTMENT_SWAGGER_PORT || '4012');
  await app.listen(httpPort);

  console.log(`🏢 Apartment Service (TCP)     → port ${process.env.APARTMENT_SERVICE_PORT || 4002}`);
  console.log(`📖 Apartment Service (Swagger) → http://localhost:${httpPort}/api/apartment/docs`);
}

bootstrap();
