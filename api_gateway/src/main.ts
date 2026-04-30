import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.CORS_ORIGIN || '*' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // ── Swagger ──────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Apartment Management System — API')
    .setDescription(
      `## Authentication Service API\n\n` +
      `### Login Endpoints\n` +
      `Each panel has its own login endpoint:\n\n` +
      `| Panel | Endpoint | Roles |\n` +
      `|-------|----------|-------|\n` +
      `| Admin | POST /api/auth/login/admin | super_admin, admin |\n` +
      `| Security | POST /api/auth/login/security | admin_security, gatekeeper |\n` +
      `| Maintenance | POST /api/auth/login/maintenance | admin_maintenance |\n` +
      `| Account | POST /api/auth/login/account | admin_account, accountant |\n` +
      `| Resident | POST /api/auth/login/resident | resident |\n\n` +
      `### Resident First-Login Flow\n` +
      `1. POST /api/auth/login/resident with **{ email }** only → returns \`{ requires_otp, user_id }\`\n` +
      `2. POST /api/auth/resident/verify-otp with **{ user_id, otp }** → returns \`{ temp_token }\`\n` +
      `3. POST /api/auth/resident/complete-profile with **temp_token as Bearer** + move-in form → account active\n` +
      `4. All future logins: POST /api/auth/login/resident with **{ email, password }**\n\n` +
      `### Authorization\n` +
      `All protected endpoints require **Bearer <token>** in the Authorization header.\n` +
      `Use the **Authorize** button above to set your token.`
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'Bearer',
    )
    .addTag('auth', 'Login endpoints and token management')
    .addTag('users', 'User creation and management')
    .addTag('gates', 'Gate management, schedules, and sessions')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,   // keeps token after page refresh
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'AMS API Docs',
  });

  const port = process.env.GATEWAY_PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀  API Gateway   → http://localhost:${port}/api`);
  console.log(`📖  Swagger Docs  → http://localhost:${port}/api/docs\n`);
  console.log(`   AUTH_SERVICE        TCP :${process.env.AUTH_SERVICE_PORT || 4001}`);
  console.log(`   APARTMENT_SERVICE   TCP :${process.env.APARTMENT_SERVICE_PORT || 4002}`);
  console.log(`   NOTIFICATION        TCP :${process.env.NOTIFICATION_SERVICE_PORT || 4003}`);
  console.log(`   PAYMENT_SERVICE     TCP :${process.env.PAYMENT_SERVICE_PORT || 4004}`);
  console.log(`   REPORTS_SERVICE     TCP :${process.env.REPORTS_SERVICE_PORT || 4005}`);
}
bootstrap();
