import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { Emergency, EmergencySchema } from '../schema/emergency.schema';
import { ReportStatus, ReportStatusSchema } from '../../schemas/report-status.schema';
import { EmergencyController } from '../controllers/emergency.controller';
import { EmergencyTcpController } from '../controllers/emergency.tcp.controller';
import { EmergencyGateway } from '../emergency.gateway';
import { EscalationScheduler } from '../escalation.scheduler';
import { EmergencyService } from '../services/emergency.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Emergency.name,    schema: EmergencySchema },
      { name: ReportStatus.name, schema: ReportStatusSchema },
    ]),
    // TCP client — sends notifications when emergency is created/resolved
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.NOTIFICATION_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '4003'),
        },
      },
    ]),
  ],
  controllers: [
    EmergencyController,      // HTTP — Swagger
    EmergencyTcpController,   // TCP  — gateway calls
  ],
  providers: [EmergencyService, EmergencyGateway, EscalationScheduler],
  exports: [EmergencyService],
})
export class EmergencyModule {}
