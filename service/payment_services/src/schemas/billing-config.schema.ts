import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BillingConfigDocument = HydratedDocument<BillingConfig>;

/**
 * BillingConfig — global settings set by accountant/admin.
 * Only ONE active config at a time (enforced by is_active flag).
 *
 * Monthly bill formula:
 *   maintenance_amount = sq_ft × rate_per_sqft
 *   late_fee = maintenance_amount × (late_fee_percentage / 100)   [if fixed=0]
 *              OR late_fee_fixed                                   [if fixed > 0]
 */
@Schema({ timestamps: true, collection: 'billing_configs' })
export class BillingConfig {
  // Rate applied to every resident's sq_ft
  @Prop({ required: true, default: 2 })
  rate_per_sqft: number;            // e.g. 2 = ₹2 per sq ft

  // Which day of month bills are due (1–28)
  @Prop({ required: true, default: 5 })
  due_day_of_month: number;         // e.g. 5 = bill due on 5th of each month

  // Late fee applied after due date
  @Prop({ default: 0 })
  late_fee_percentage: number;      // e.g. 5 = 5% of maintenance amount

  @Prop({ default: 0 })
  late_fee_fixed: number;           // Fixed ₹ amount, overrides percentage if > 0

  // Grace period in days after due_day before late fee kicks in
  @Prop({ default: 0 })
  grace_period_days: number;

  // From which month this config is effective (YYYY-MM)
  @Prop({ required: true })
  effective_from: string;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: Types.ObjectId, required: true })
  created_by: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  updated_by: Types.ObjectId;
}

export const BillingConfigSchema = SchemaFactory.createForClass(BillingConfig);
