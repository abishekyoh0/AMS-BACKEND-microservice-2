import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── TCP microservice ──────────────────────────────────────────────────────
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.REPORTS_SERVICE_HOST || '0.0.0.0',
      port: parseInt(process.env.REPORTS_SERVICE_PORT || '4005'),
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ── Swagger (internal docs) ───────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('AMS — Reports / Maintenance Service')
    .setDescription(
      `## Complaint & Maintenance Service\n\n` +
      `**Ticket lifecycle:**\n` +
      `\`Open\` → \`Assigned\` → \`Accepted\` → \`In Progress\` → \`Resolved\` → \`Closed\`\n\n` +
      `**Complaint types:**\n` +
      `- **Common** — shared areas (lift, garden, corridor, etc.)\n` +
      `- **Individual** — inside a specific flat\n\n` +
      `**Who can raise:**\n` +
      `- Resident (from their panel)\n` +
      `- Admin Maintenance (on behalf of a resident)\n\n` +
      `**Worker assignment:** Workers are registered in the auth service (no login). Their IDs are referenced here.`
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Bearer')
    .addTag('complaints', 'Complaint CRUD and lifecycle')
    .addTag('assignments', 'Worker assignment and status updates')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'AMS Reports Service Docs',
  });

  await app.startAllMicroservices();

  const httpPort = parseInt(process.env.REPORTS_SWAGGER_PORT || '4015');
  await app.listen(httpPort);

  console.log(`📋 Reports Service   (TCP)     → port ${process.env.REPORTS_SERVICE_PORT || 4005}`);
  console.log(`📖 Reports Service   (Swagger) → http://localhost:${httpPort}/docs`);
}
bootstrap();
