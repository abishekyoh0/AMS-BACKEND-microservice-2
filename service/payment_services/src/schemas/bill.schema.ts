import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BillStatus } from '../common/enums/payment.enum';

export type BillDocument = HydratedDocument<Bill>;

@Schema({ timestamps: true, collection: 'bills' })
export class Bill {
  // Auto-generated: BILL-2025-05-00001
  @Prop({ required: true, unique: true })
  bill_number: string;

  // Cross-service ref to auth_service
  @Prop({ type: Types.ObjectId, required: true })
  resident_id: Types.ObjectId;

  // Denormalized snapshot at time of billing
  @Prop({ required: true })
  resident_name: string;

  @Prop()
  email: string;

  @Prop()
  mobile: string;

  @Prop()
  block: string;

  @Prop()
  floor: string;

  @Prop({ required: true })
  unit_number: string;

  // Billing period
  @Prop({ required: true })
  billing_month: string;  // "YYYY-MM"  e.g. "2025-05"

  // Calculation snapshot (so historical bills aren't affected by config changes)
  @Prop({ required: true })
  sq_ft: number;

  @Prop({ required: true })
  rate_per_sqft: number;

  @Prop({ required: true })
  maintenance_amount: number;   // sq_ft × rate_per_sqft

  // Extra charges added by accountant (e.g. special repair, event fees)
  @Prop({
    type: [{
      description: String,
      amount: Number,
    }],
    default: [],
  })
  extra_charges: { description: string; amount: number }[];

  @Prop({ default: 0 })
  extra_charges_total: number;

  @Prop({ default: 0 })
  late_fee: number;

  @Prop({ required: true })
  total_amount: number;         // maintenance_amount + extra_charges_total + late_fee

  @Prop({ default: 0 })
  amount_paid: number;          // running total of verified payments

  @Prop({ default: 0 })
  balance_due: number;          // total_amount - amount_paid

  // Dates
  @Prop({ required: true })
  due_date: Date;

  @Prop({ default: null })
  paid_at: Date;                // when fully paid

  @Prop({ type: String, enum: BillStatus, default: BillStatus.PENDING })
  status: BillStatus;

  @Prop({ default: false })
  late_fee_applied: boolean;

  @Prop({ default: 0 })
  reminder_count: number;

  @Prop({ default: null })
  last_reminder_at: Date;
}

export const BillSchema = SchemaFactory.createForClass(Bill);
BillSchema.index({ resident_id: 1, billing_month: 1 }, { unique: true });
BillSchema.index({ status: 1, due_date: 1 });
BillSchema.index({ billing_month: 1 });
