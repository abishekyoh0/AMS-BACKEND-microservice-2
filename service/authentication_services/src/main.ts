// import { NestFactory } from '@nestjs/core';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import { ValidationPipe } from '@nestjs/common';
// import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
//     transport: Transport.TCP,
//     options: {
//       host: process.env.AUTH_SERVICE_HOST || '0.0.0.0',
//       port: parseInt(process.env.AUTH_SERVICE_PORT || '4001'),
//     },
//   });

//   app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

//   await app.listen();
//   console.log(` Auth Service (TCP) running on port ${process.env.AUTH_SERVICE_PORT || 4001}`);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Hybrid app — TCP microservice + HTTP for Swagger only
  const app = await NestFactory.create(AppModule);

  // ── TCP microservice ──────────────────────────────────────────────────────
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.AUTH_SERVICE_HOST || '0.0.0.0',
      port: parseInt(process.env.AUTH_SERVICE_PORT || '4001'),
    },
  });

  // ── Swagger (HTTP only — not for API calls) ───────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('AMS — Authentication Service')
    .setDescription(
      `## Authentication Service — Internal Docs\n\n` +
      `**Note:** These are TCP message patterns, not HTTP routes.\n` +
      `Use the API Gateway Swagger at \`http://localhost:3000/api/docs\` to make actual API calls.\n\n` +
      `### TCP Patterns\n` +
      `| Pattern | Description |\n` +
      `|---------|-------------|\n` +
      `| \`auth.login.admin\` | Admin panel login |\n` +
      `| \`auth.login.security\` | Security panel login |\n` +
      `| \`auth.login.maintenance\` | Maintenance panel login |\n` +
      `| \`auth.login.account\` | Account panel login |\n` +
      `| \`auth.login.resident\` | Resident panel login / OTP trigger |\n` +
      `| \`auth.resident.verify_otp\` | Resident OTP verification |\n` +
      `| \`auth.resident.complete_profile\` | Move-in form + set password |\n` +
      `| \`auth.verify_token\` | JWT validation (used by gateway) |\n` +
      `| \`auth.today_schedule\` | Gatekeeper gate schedule pre-login |\n` +
      `| \`auth.end_gate_session\` | End gatekeeper shift |\n` +
      `| \`users.create_admin\` | Create ADMIN |\n` +
      `| \`users.create_sub_admin\` | Create ADMIN_MAINTENANCE / SECURITY / ACCOUNT |\n` +
      `| \`users.create_gatekeeper\` | Create GATEKEEPER |\n` +
      `| \`users.create_accountant\` | Create ACCOUNTANT |\n` +
      `| \`users.create_resident\` | Create RESIDENT (no password) |\n` +
      `| \`users.create_worker\` | Add WORKER (no login) |\n` +
      `| \`users.approve_resident\` | Approve pending resident |\n` +
      `| \`gates.create\` | Create gate |\n` +
      `| \`gates.create_schedule\` | Assign gatekeeper to gate+shift |\n` +
      `| \`gates.active_sessions\` | List active sessions |\n`
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'Bearer',
    )
    .addTag('auth — login', 'Panel login endpoints')
    .addTag('auth — resident flow', 'Resident first-login OTP + move-in form')
    .addTag('auth — session', 'Token, OTP, gate session')
    .addTag('users', 'User creation per role')
    .addTag('gates', 'Gate and schedule management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'AMS Auth Service Docs',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Start TCP microservice
  await app.startAllMicroservices();

  // Start HTTP server for Swagger
  const httpPort = parseInt(process.env.AUTH_SWAGGER_PORT || '4011');
  await app.listen(httpPort);

  console.log(` Auth Service (TCP)    → port ${process.env.AUTH_SERVICE_PORT || 4001}`);
  console.log(` Auth Service (Swagger) → http://localhost:${httpPort}/docs`);
}
bootstrap();