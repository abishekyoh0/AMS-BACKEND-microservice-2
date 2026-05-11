import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { Emergency, EmergencySchema } from '../schema/emergency.schema';
import { KafkaModule } from '../kafka/kafka.module';
import { ReportStatus, ReportStatusSchema } from '../../schemas/report-status.schema';
import { EmergencyController } from '../controllers/emergency.controller';
import { EmergencyGateway } from '../emergency.gateway';
import { EscalationScheduler } from '../escalation.scheduler';
import { EmergencyService } from '../services/emergency.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Emergency.name,     schema: EmergencySchema },
      { name: ReportStatus.name,  schema: ReportStatusSchema },
    ]),
    KafkaModule,
  ],
  controllers: [EmergencyController],
  providers: [
    EmergencyService,
    EmergencyGateway,
    EscalationScheduler,
  ],
  exports: [EmergencyService],
})
export class EmergencyModule {}