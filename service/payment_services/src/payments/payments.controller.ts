import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @MessagePattern('payments.submit')
  submit(@Payload() d: any) { return this.service.submitPayment(d.user_id, d.user_name, d.dto); }

  @MessagePattern('payments.verify')
  verify(@Payload() d: any) { return this.service.verifyPayment(d.payment_id, d.accountant_id, d.accountant_name, d.dto); }

  @MessagePattern('payments.record_offline')
  recordOffline(@Payload() d: any) { return this.service.recordOfflinePayment(d.user_id, d.user_name, d.dto); }

  @MessagePattern('payments.history')
  history(@Payload() d: any) { return this.service.getPaymentHistory(d.filter, d.resident_id); }

  @MessagePattern('payments.pending_verifications')
  pendingVerifications() { return this.service.getPendingVerifications(); }

  @MessagePattern('payments.send_reminder')
  sendReminder(@Payload() d: any) { return this.service.sendReminder(d.bill_id, d.user_id, d.user_name); }

  @MessagePattern('payments.bulk_reminders')
  bulkReminders(@Payload() d: any) { return this.service.sendBulkReminders(d.billing_month, d.user_id, d.user_name); }

  @MessagePattern('payments.resident_bill_status')
  residentBillStatus(@Payload() d: any) { return this.service.getResidentBillStatus(d.resident_id, d.billing_month); }
}
