import {
  Injectable, BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bill, BillDocument } from '../schemas/bill.schema';
import {
  Payment, PaymentDocument,
  PaymentCounter, PaymentCounterDocument,
  PaymentReminder, PaymentReminderDocument,
} from '../schemas/payment.schema';
import { BillStatus, PaymentMode, PaymentStatus, ReminderType } from '../common/enums/payment.enum';
import {
  SubmitPaymentDto, VerifyPaymentDto,
  RecordOfflinePaymentDto, PaymentHistoryFilterDto,
} from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Bill.name) private billModel: Model<BillDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(PaymentCounter.name) private counterModel: Model<PaymentCounterDocument>,
    @InjectModel(PaymentReminder.name) private reminderModel: Model<PaymentReminderDocument>,
  ) { }

  // ─────────────────────────────────────────────────────────────────────────
  // Auto-generate payment number: PAY-2025-05-00001
  // ─────────────────────────────────────────────────────────────────────────
  private async nextPaymentNumber(): Promise<string> {
    const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const counter = await this.counterModel.findOneAndUpdate(
      { month },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return `PAY-${month}-${String(counter.seq).padStart(5, '0')}`;
  }

  private nextReceiptNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    return `RCP-${ts}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESIDENT submits a payment (online UPI or offline cash/cheque)
  // Offline cash → auto-verified (resident is handing it physically)
  // Online UPI   → pending accountant verification
  // ─────────────────────────────────────────────────────────────────────────
  async submitPayment(userId: string, userName: string, dto: SubmitPaymentDto) {
    const bill = await this.billModel.findById(dto.bill_id);
    if (!bill) throw new NotFoundException('Bill not found');

    // Validate bill belongs to this resident
    if (bill.resident_id.toString() !== userId) {
      throw new ForbiddenException('This bill does not belong to you');
    }

    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('This bill is already fully paid');
    }

    if (dto.amount <= 0 || dto.amount > bill.balance_due) {
      throw new BadRequestException(
        `Payment amount must be between ₹1 and ₹${bill.balance_due} (remaining balance)`,
      );
    }

    // UPI requires transaction_id
    if (dto.payment_mode === PaymentMode.UPI && !dto.transaction_id) {
      throw new BadRequestException('transaction_id is required for UPI payments');
    }

    const paymentNumber = await this.nextPaymentNumber();

    // Cash payments from resident — mark as pending (accountant still needs to verify)
    const isOffline = [PaymentMode.CASH, PaymentMode.CHEQUE, PaymentMode.BANK_TRANSFER].includes(dto.payment_mode);
    const initialStatus = PaymentStatus.PENDING;

    const payment = await this.paymentModel.create({
      payment_number: paymentNumber,
      bill_id: new Types.ObjectId(dto.bill_id),
      resident_id: new Types.ObjectId(userId),
      resident_name: userName,
      unit_number: bill.unit_number,
      payment_mode: dto.payment_mode,
      amount: dto.amount,
      payment_date: new Date(dto.payment_date),
      transaction_id: dto.transaction_id || null,
      upi_id: dto.upi_id || null,
      cheque_number: dto.cheque_number || null,
      bank_name: dto.bank_name || null,
      proof_url: dto.proof_url || null,
      resident_notes: dto.resident_notes || null,
      status: initialStatus,
    });

    return {
      payment_number: payment.payment_number,
      amount: payment.amount,
      payment_mode: payment.payment_mode,
      status: payment.status,
      message: isOffline
        ? 'Payment recorded. Awaiting accountant verification.'
        : 'UPI payment submitted. Awaiting accountant verification.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACCOUNTANT verifies or rejects a payment
  // On verify → update bill.amount_paid and bill.status
  // ─────────────────────────────────────────────────────────────────────────
  async verifyPayment(paymentId: string, accountantId: string, accountantName: string, dto: VerifyPaymentDto) {
    const payment = await this.paymentModel.findById(paymentId);
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment has already been processed');
    }

    if (dto.status === PaymentStatus.REJECTED && !dto.rejection_reason) {
      throw new BadRequestException('rejection_reason is required when rejecting a payment');
    }

    const update: any = {
      status: dto.status,
      verified_by: new Types.ObjectId(accountantId),
      verified_by_name: accountantName,
      verified_at: new Date(),
    };

    if (dto.status === PaymentStatus.REJECTED) {
      update.rejection_reason = dto.rejection_reason;
    } else {
      // Verified — generate receipt
      update.receipt_number = this.nextReceiptNumber();
    }

    await this.paymentModel.findByIdAndUpdate(paymentId, update);

    // Update bill totals if verified
    if (dto.status === PaymentStatus.VERIFIED) {
      const bill = await this.billModel.findById(payment.bill_id);
      if (bill) {
        bill.amount_paid += payment.amount;
        bill.balance_due = bill.total_amount - bill.amount_paid;

        if (bill.balance_due <= 0) {
          bill.status = BillStatus.PAID;
          bill.paid_at = new Date();
        } else if (bill.amount_paid > 0) {
          bill.status = BillStatus.PARTIAL;
        }

        await bill.save();
      }
    }

    return {
      message: dto.status === PaymentStatus.VERIFIED
        ? 'Payment verified. Bill updated.'
        : 'Payment rejected.',
      status: dto.status,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACCOUNTANT records offline payment directly (cash received in hand)
  // Auto-verified since accountant is entering it
  // ─────────────────────────────────────────────────────────────────────────
  async recordOfflinePayment(accountantId: string, accountantName: string, dto: RecordOfflinePaymentDto) {
    const bill = await this.billModel.findById(dto.bill_id);
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status === BillStatus.PAID) throw new BadRequestException('Bill is already paid');

    if (dto.amount > bill.balance_due) {
      throw new BadRequestException(`Amount exceeds balance due of ₹${bill.balance_due}`);
    }

    const paymentNumber = await this.nextPaymentNumber();
    const receiptNumber = this.nextReceiptNumber();

    const payment = await this.paymentModel.create({
      payment_number: paymentNumber,
      bill_id: bill._id,
      resident_id: bill.resident_id,
      resident_name: bill.resident_name,
      unit_number: bill.unit_number,
      payment_mode: dto.payment_mode,
      amount: dto.amount,
      payment_date: new Date(dto.payment_date),
      cheque_number: dto.cheque_number || null,
      bank_name: dto.bank_name || null,
      resident_notes: dto.notes || null,
      // Auto-verified by accountant
      status: PaymentStatus.VERIFIED,
      verified_by: new Types.ObjectId(accountantId),
      verified_by_name: accountantName,
      verified_at: new Date(),
      receipt_number: receiptNumber,
    });

    // Update bill immediately
    bill.amount_paid += dto.amount;
    bill.balance_due = bill.total_amount - bill.amount_paid;

    if (bill.balance_due <= 0) {
      bill.status = BillStatus.PAID;
      bill.paid_at = new Date();
    } else {
      bill.status = BillStatus.PARTIAL;
    }

    await bill.save();

    return {
      payment_number: payment.payment_number,
      receipt_number: receiptNumber,
      amount: payment.amount,
      bill_status: bill.status,
      balance_due: bill.balance_due,
      message: 'Offline payment recorded and verified.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Payment history (resident sees own, accountant sees all/per resident)
  // ─────────────────────────────────────────────────────────────────────────
  async getPaymentHistory(filter: PaymentHistoryFilterDto, forResidentId?: string) {
    const query: any = {};
    if (forResidentId) query.resident_id = new Types.ObjectId(forResidentId);
    if (filter.payment_mode) query.payment_mode = filter.payment_mode;

    // If billing_month filter — join with bill
    let billIds: Types.ObjectId[] | null = null;
    if (filter.billing_month) {
      const bills = await this.billModel.find({ billing_month: filter.billing_month }).select('_id').lean();
      billIds = bills.map(b => b._id as Types.ObjectId);
      query.bill_id = { $in: billIds };
    }

    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.paymentModel.find(query).sort({ payment_date: -1 }).skip(skip).limit(limit).lean(),
      this.paymentModel.countDocuments(query),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pending payments (accountant sees all unverified payments)
  // ─────────────────────────────────────────────────────────────────────────
  async getPendingVerifications() {
    return this.paymentModel
      .find({ status: PaymentStatus.PENDING })
      .sort({ createdAt: 1 })
      .lean();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Send reminder for a specific bill
  // ─────────────────────────────────────────────────────────────────────────
  async sendReminder(billId: string, accountantId: string, accountantName: string) {
    const bill = await this.billModel.findById(billId);
    if (!bill) throw new NotFoundException('Bill not found');

    if (bill.status === BillStatus.PAID) {
      throw new BadRequestException('Cannot send reminder for a paid bill');
    }

    const isOverdue = new Date() > bill.due_date;

    const reminder = await this.reminderModel.create({
      bill_id: bill._id,
      resident_id: bill.resident_id,
      resident_name: bill.resident_name,
      billing_month: bill.billing_month,
      amount_due: bill.balance_due,
      reminder_type: isOverdue ? ReminderType.OVERDUE : ReminderType.DUE,
      sent_by: new Types.ObjectId(accountantId),
      sent_by_name: accountantName,
      notification_sent: false, // TODO: call notification_service
    });

    // Update bill reminder stats
    await this.billModel.findByIdAndUpdate(billId, {
      $inc: { reminder_count: 1 },
      last_reminder_at: new Date(),
    });

    return {
      message: `${isOverdue ? 'Overdue' : 'Due'} reminder logged for ${bill.resident_name} — ${bill.billing_month}`,
      reminder_type: reminder.reminder_type,
      amount_due: bill.balance_due,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Bulk send reminders to all unpaid bills for a month
  // ─────────────────────────────────────────────────────────────────────────
  async sendBulkReminders(billing_month: string, accountantId: string, accountantName: string) {
    const unpaidBills = await this.billModel.find({
      billing_month,
      status: { $in: [BillStatus.PENDING, BillStatus.OVERDUE, BillStatus.PARTIAL] },
    }).lean();

    if (!unpaidBills.length) {
      return { message: 'No unpaid bills found for this month', sent: 0 };
    }

    let sent = 0;
    const now = new Date();

    for (const bill of unpaidBills) {
      const isOverdue = now > bill.due_date;
      await this.reminderModel.create({
        bill_id: bill._id,
        resident_id: bill.resident_id,
        resident_name: bill.resident_name,
        billing_month: bill.billing_month,
        amount_due: bill.balance_due,
        reminder_type: isOverdue ? ReminderType.OVERDUE : ReminderType.DUE,
        sent_by: new Types.ObjectId(accountantId),
        sent_by_name: accountantName,
      });

      await this.billModel.findByIdAndUpdate(bill._id, {
        $inc: { reminder_count: 1 },
        last_reminder_at: now,
      });

      sent++;
    }

    return { message: `Reminders sent to ${sent} residents`, sent, billing_month };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Resident payment status for a bill
  // ─────────────────────────────────────────────────────────────────────────
  async getResidentBillStatus(residentId: string, billing_month?: string): Promise<any[]> {
    const query: any = { resident_id: new Types.ObjectId(residentId) };
    if (billing_month) query.billing_month = billing_month;

    const bills = await this.billModel.find(query).sort({ billing_month: -1 }).lean();

    // Get payment records for each bill
    const billIds = bills.map(b => b._id);
    const payments = await this.paymentModel
      .find({ bill_id: { $in: billIds } })
      .sort({ payment_date: -1 })
      .lean();

    const paymentsByBill: Record<string, any[]> = {};
    for (const p of payments) {
      const key = p.bill_id.toString();
      if (!paymentsByBill[key]) paymentsByBill[key] = [];
      paymentsByBill[key].push(p);
    }

    return bills.map(bill => ({
      ...bill,
      payments: paymentsByBill[bill._id.toString()] || [],
    }));
  }
}
