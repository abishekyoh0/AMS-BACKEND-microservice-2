import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingConfig, BillingConfigSchema } from '../schemas/billing-config.schema';
import { ResidentUnit, ResidentUnitSchema } from '../schemas/resident-unit.schema';
import { Bill, BillSchema } from '../schemas/bill.schema';
import { BillCounter, BillCounterSchema } from '../schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BillingConfig.name, schema: BillingConfigSchema },
      { name: ResidentUnit.name,  schema: ResidentUnitSchema },
      { name: Bill.name,          schema: BillSchema },
      { name: BillCounter.name,   schema: BillCounterSchema },
    ]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
