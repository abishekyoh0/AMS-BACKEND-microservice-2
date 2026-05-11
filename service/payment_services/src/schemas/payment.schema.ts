import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMode, PaymentStatus, ReminderType } from '../common/enums/payment.enum';

// ─── Payment ──────────────────────────────────────────────────────────────────

export type PaymentDocument = HydratedDocument<Payment>;

/**
 * Payment — one record per payment transaction.
 * A bill can have multiple partial payments.
 *
 * Online (UPI): resident submits transaction_id → accountant verifies.
 * Offline (Cash/Cheque): accountant enters it directly → auto-verified.
 */
@Schema({ timestamps: true, collection: 'payments' })
export class Payment {
  // Auto-generated: PAY-2025-05-00001
  @Prop({ required: true, unique: true })
  payment_number: string;

  @Prop({ type: Types.ObjectId, ref: 'Bill', required: true })
  bill_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  resident_id: Types.ObjectId;

  @Prop({ required: true })
  resident_name: string;

  @Prop({ required: true })
  unit_number: string;

  // Payment details
  @Prop({ type: String, enum: PaymentMode, required: true })
  payment_mode: PaymentMode;

  @Prop({ required: true })
  amount: number;

  // Date/time chosen by the resident (when they actually paid)
  @Prop({ required: true })
  payment_date: Date;

  // UPI-specific
  @Prop({ default: null })
  transaction_id: string;    // UPI transaction reference

  @Prop({ default: null })
  upi_id: string;            // UPI ID used

  // Cheque-specific
  @Prop({ default: null })
  cheque_number: string;

  @Prop({ default: null })
  bank_name: string;

  // Proof (screenshot URL for UPI, cheque scan, etc.)
  @Prop({ default: null })
  proof_url: string;

  // Notes from resident
  @Prop({ default: null })
  resident_notes: string;

  // Verification (by accountant)
  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ type: Types.ObjectId, default: null })
  verified_by: Types.ObjectId;    // accountant user _id

  @Prop({ default: null })
  verified_by_name: string;

  @Prop({ default: null })
  verified_at: Date;

  @Prop({ default: null })
  rejection_reason: string;       // if accountant rejects

  // Receipt (generated after verification)
  @Prop({ default: null })
  receipt_number: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ bill_id: 1 });
PaymentSchema.index({ resident_id: 1 });
PaymentSchema.index({ payment_date: -1 });

// ─── BillCounter & PaymentCounter (for auto-numbering) ───────────────────────

export type BillCounterDocument = HydratedDocument<BillCounter>;

@Schema({ collection: 'bill_counters' })
export class BillCounter {
  @Prop({ required: true, unique: true })
  month: string;   // "YYYY-MM"

  @Prop({ default: 0 })
  seq: number;
}

export const BillCounterSchema = SchemaFactory.createForClass(BillCounter);

export type PaymentCounterDocument = HydratedDocument<PaymentCounter>;

@Schema({ collection: 'payment_counters' })
export class PaymentCounter {
  @Prop({ required: true, unique: true })
  month: string;   // "YYYY-MM"

  @Prop({ default: 0 })
  seq: number;
}

export const PaymentCounterSchema = SchemaFactory.createForClass(PaymentCounter);

// ─── PaymentReminder ──────────────────────────────────────────────────────────

export type PaymentReminderDocument = HydratedDocument<PaymentReminder>;

@Schema({ timestamps: true, collection: 'payment_reminders' })
export class PaymentReminder {
  @Prop({ type: Types.ObjectId, ref: 'Bill', required: true })
  bill_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  resident_id: Types.ObjectId;

  @Prop({ required: true })
  resident_name: string;

  @Prop({ required: true })
  billing_month: string;

  @Prop({ required: true })
  amount_due: number;

  @Prop({ type: String, enum: ReminderType, required: true })
  reminder_type: ReminderType;

  @Prop({ type: Types.ObjectId, required: true })
  sent_by: Types.ObjectId;    // accountant

  @Prop({ required: true })
  sent_by_name: string;

  // TODO: hook into notification_service for actual SMS/email dispatch
  @Prop({ default: false })
  notification_sent: boolean;
}

export const PaymentReminderSchema = SchemaFactory.createForClass(PaymentReminder);
PaymentReminderSchema.index({ bill_id: 1 });
PaymentReminderSchema.index({ resident_id: 1 });
