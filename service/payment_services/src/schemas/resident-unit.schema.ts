import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ResidentUnitDocument = HydratedDocument<ResidentUnit>;

/**
 * ResidentUnit — payment service's own record per resident.
 *
 * When a resident is created in auth_service, admin also registers
 * their unit here with sq_ft. This is the source of truth for billing.
 *
 * Cross-service: resident_id references auth_service users._id
 */
@Schema({ timestamps: true, collection: 'resident_units' })
export class ResidentUnit {
  // Cross-service ref to auth_service users._id
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  resident_id: Types.ObjectId;

  // Denormalized for fast bill display (no cross-service call needed)
  @Prop({ required: true })
  resident_name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  mobile: string;

  // Unit details
  @Prop()
  block: string;

  @Prop()
  floor: string;

  @Prop({ required: true })
  unit_number: string;

  // THE key field — set by admin, used for bill calculation
  @Prop({ required: true })
  sq_ft: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: Types.ObjectId, required: true })
  registered_by: Types.ObjectId;  // admin_account who registered this unit
}

export const ResidentUnitSchema = SchemaFactory.createForClass(ResidentUnit);
ResidentUnitSchema.index({ resident_id: 1 });
