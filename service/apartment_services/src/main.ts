import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'apartment-service',
        brokers: ['localhost:9092'],
      },
      
      consumer: {
        groupId: 'apartment-consumer',
      },
    },
  });


  app.setGlobalPrefix('api/apartment');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Blocks Service')
    .setDescription('Apartment Blocks API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/apartment/docs', app, document);
  await app.listen(process.env.PORT || 3002);
  console.log(`Apartment service running on port ${process.env.PORT || 3002}`);
  console.log(`Swagger docs → http://localhost:3002/api/apartment/docs`);
}

bootstrap();  

