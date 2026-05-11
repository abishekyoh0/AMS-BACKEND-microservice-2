import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Bill, BillSchema } from '../schemas/bill.schema';
import { Payment, PaymentSchema, PaymentCounter, PaymentCounterSchema, PaymentReminder, PaymentReminderSchema } from '../schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bill.name,            schema: BillSchema },
      { name: Payment.name,         schema: PaymentSchema },
      { name: PaymentCounter.name,  schema: PaymentCounterSchema },
      { name: PaymentReminder.name, schema: PaymentReminderSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
