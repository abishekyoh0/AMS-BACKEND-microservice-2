import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AuthGatewayController } from './auth/auth.gateway.controller';
import { UsersGatewayController } from './users/users.gateway.controller';
import { GatesGatewayController } from './gates/gates.gateway.controller';
import { ComplaintsGatewayController } from './complaints/complaints.gateway.controller';
import { PaymentsGatewayController } from './payments/payments.gateway.controller';
import { NotificationsGatewayController } from './notifications/notifications.gateway.controller';
import { EmergencyGatewayController } from './emergency/emergency.gateway.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.AUTH_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.AUTH_SERVICE_PORT || '4001'),
        },
      },
      {
        name: 'APARTMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.APARTMENT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.APARTMENT_SERVICE_PORT || '4002'),
        },
      },
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '4003'),
        },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PAYMENT_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.PAYMENT_SERVICE_PORT || '4004'),
        },
      },
      {
        name: 'REPORTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.REPORTS_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.REPORTS_SERVICE_PORT || '4005'),
        },
      },
    ]),
  ],

  controllers: [
    AuthGatewayController,
    UsersGatewayController,
    GatesGatewayController,
    ComplaintsGatewayController,
    PaymentsGatewayController,
    NotificationsGatewayController,
    EmergencyGatewayController,
  ],

  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],

})
export class AppModule {}
