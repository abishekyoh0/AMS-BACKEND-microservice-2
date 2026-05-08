import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Emergency, EmergencyDocument } from './schema/emergency.schema';
import { KafkaService } from './kafka/kafka.service';
import { EmergencyGateway } from './emergency.gateway';
import { EmergencyEvent } from '../common/enums/emergency.enum';

@Injectable()
export class EscalationScheduler {
  private readonly logger = new Logger(EscalationScheduler.name);

  private readonly ESCALATE_HIGH_MIN   = parseInt(process.env.ESCALATE_HIGH_MINUTES   || '5');
  private readonly ESCALATE_MEDIUM_MIN = parseInt(process.env.ESCALATE_MEDIUM_MINUTES || '15');
  private readonly ESCALATE_LOW_MIN    = parseInt(process.env.ESCALATE_LOW_MINUTES    || '30');

  constructor(
    @InjectModel(Emergency.name)
    private readonly emergencyModel: Model<EmergencyDocument>,
    private readonly kafkaService: KafkaService,
    private readonly gateway: EmergencyGateway,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runEscalationCheck() {
    this.logger.log('Running escalation check...');
    const now = new Date();

    await this.reAlertHigh(now);

    await this.escalateMediumToHigh(now);

    await this.escalateLowToMedium(now);
  }

  private async reAlertHigh(now: Date) {
    const threshold = new Date(now.getTime() - this.ESCALATE_HIGH_MIN * 60_000);

    const alerts = await this.emergencyModel.find({
      status: 'Active',
      priority: 'High',
      acknowledged: 0,
      createdAt: { $lte: threshold },
    });

    for (const alert of alerts) {
      const id = (alert._id as any).toString();
      this.logger.warn(`Re-alerting HIGH emergency: ${alert.alertId}`);

      await this.kafkaService.sendEvent(EmergencyEvent.ESCALATED, {
        emergencyId: id,
        alertId: alert.alertId,
        type: alert.type,
        priority: 'High',
        action: 're-alert',
        escalatedAt: now.toISOString(),
        message: `URGENT: ${alert.alertId} has not been acknowledged for over ${this.ESCALATE_HIGH_MIN} minutes`,
      });

      this.gateway.broadcastEscalation(id, 'High', now);
    }
  }

  private async escalateMediumToHigh(now: Date) {
    const threshold = new Date(now.getTime() - this.ESCALATE_MEDIUM_MIN * 60_000);

    const alerts = await this.emergencyModel.find({
      status: 'Active',
      priority: 'Medium',
      acknowledged: 0,
      createdAt: { $lte: threshold },
    });

    for (const alert of alerts) {
      const id = (alert._id as any).toString();
      this.logger.warn(`Escalating MEDIUM → HIGH: ${alert.alertId}`);

      await this.emergencyModel.findByIdAndUpdate(id, { priority: 'High' });

      await this.kafkaService.sendEvent(EmergencyEvent.ESCALATED, {
        emergencyId: id,
        alertId: alert.alertId,
        type: alert.type,
        previousPriority: 'Medium',
        priority: 'High',
        action: 'escalated',
        escalatedAt: now.toISOString(),
        message: `${alert.alertId} escalated Medium → High after ${this.ESCALATE_MEDIUM_MIN} minutes without acknowledgement`,
      });

      this.gateway.broadcastEscalation(id, 'High', now);
    }
  }

  private async escalateLowToMedium(now: Date) {
    const threshold = new Date(now.getTime() - this.ESCALATE_LOW_MIN * 60_000);

    const alerts = await this.emergencyModel.find({
      status: 'Active',
      priority: 'Low',
      acknowledged: 0,
      createdAt: { $lte: threshold },
    });

    for (const alert of alerts) {
      const id = (alert._id as any).toString();
      this.logger.log(`Escalating LOW → MEDIUM: ${alert.alertId}`);

      await this.emergencyModel.findByIdAndUpdate(id, { priority: 'Medium' });

      await this.kafkaService.sendEvent(EmergencyEvent.ESCALATED, {
        emergencyId: id,
        alertId: alert.alertId,
        type: alert.type,
        previousPriority: 'Low',
        priority: 'Medium',
        action: 'escalated',
        escalatedAt: now.toISOString(),
        message: `${alert.alertId} escalated Low → Medium after ${this.ESCALATE_LOW_MIN} minutes without acknowledgement`,
      });

      this.gateway.broadcastEscalation(id, 'Medium', now);
    }
  }
}