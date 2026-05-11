

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/notification');

  // Global validation pipe — uses class-validator DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

   app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('AMS Notification Service')
    .setDescription('Notification API for Apartment Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/notification/docs', app, document);

  await app.listen(process.env.PORT || 3004);
  console.log(`Notification service running on port ${process.env.PORT || 3004}`);
  console.log(`Swagger docs → http://localhost:3004/api/notification/docs`);
}
bootstrap();   

