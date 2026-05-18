import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: process.env.PAYMENT_SERVICE_HOST || '0.0.0.0',
      port: parseInt(process.env.PAYMENT_SERVICE_PORT || '4004'),
    },
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('AMS — Payment Service')
    .setDescription(
      `## Billing & Payment Service\n\n` +
      `### How billing works\n` +
      `1. Accountant sets **rate per sq ft** (e.g. ₹2/sq ft)\n` +
      `2. Admin registers each resident's **unit with sq ft** (e.g. 850 sq ft)\n` +
      `3. Each month → accountant runs **Generate Bills** → system creates bills: 850 × ₹2 = **₹1,700**\n` +
      `4. If not paid by due date → **late fee** applied automatically\n` +
      `5. Resident pays online (UPI) or offline (cash) → accountant verifies → **receipt generated**\n\n` +
      `### Bill number format\n` +
      `\`BILL-2025-05-00001\`\n\n` +
      `### Payment number format\n` +
      `\`PAY-2025-05-00001\`\n\n` +
      `### Bill status flow\n` +
      `\`Pending\` → \`Partial\` → \`Paid\`  (or \`Overdue\` if past due date)`
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'Bearer')
    .addTag('billing-config', 'Set rate per sqft and late fee rules')
    .addTag('resident-units', 'Register resident sq ft for billing')
    .addTag('bills', 'Bill generation and management')
    .addTag('payments', 'Payment submission and verification')
    .addTag('reminders', 'Send payment reminders')
    .build();

    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'AMS Payment Service Docs',
  });

  await app.startAllMicroservices();
  const httpPort = parseInt(process.env.PAYMENT_SWAGGER_PORT || '4014');
  await app.listen(httpPort);

  console.log(`💳 Payment Service  (TCP)     → port ${process.env.PAYMENT_SERVICE_PORT || 4004}`);
  console.log(`📖 Payment Service  (Swagger) → http://localhost:${httpPort}/docs`);
}
bootstrap();
