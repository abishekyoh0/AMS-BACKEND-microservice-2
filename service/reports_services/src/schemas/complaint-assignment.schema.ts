import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AssignmentStatus } from '../common/enums/complaint.enum';

export type ComplaintAssignmentDocument = HydratedDocument<ComplaintAssignment>;

/**
 * ComplaintAssignment
 *
 * One record per assignment attempt.
 * A complaint can have multiple assignment records (if worker rejects, re-assign to another).
 * The active one is referenced in complaint.current_assignment_id.
 *
 * Worker referenced here is from auth_service workers collection (no login).
 * We store worker_id + worker_name (denormalized) for fast reads.
 */
@Schema({ timestamps: true, collection: 'complaint_assignments' })
export class ComplaintAssignment {

  // ── Links ─────────────────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Complaint', required: true })
  complaint_id!: Types.ObjectId;

  // Worker from auth_service (cross-service reference — no DB FK)
  @Prop({ type: Types.ObjectId, required: true })
  worker_id!: Types.ObjectId;

  @Prop({ required: true })
  worker_name!: string;         // Denormalized for fast display

  @Prop()
  worker_expertise!: string;    // Plumber / Electrician etc.

  // ── Assigned by ───────────────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, required: true })
  assigned_by_id!: Types.ObjectId;   // admin_maintenance user

  @Prop({ required: true })
  assigned_by_name!: string;

  // ── Scheduling ────────────────────────────────────────────────────────────
  @Prop({ required: true })
  assigned_date!: Date;

  @Prop({ default: null })
  scheduled_visit_date!: Date;   // When the worker plans to visit

  // ── Status ────────────────────────────────────────────────────────────────
  @Prop({ type: String, enum: AssignmentStatus, default: AssignmentStatus.ASSIGNED })
  status!: AssignmentStatus;

  // ── Worker actions ────────────────────────────────────────────────────────
  @Prop({ default: null })
  accepted_at!: Date;

  @Prop({ default: null })
  rejection_reason!: string;   // Filled when worker rejects

  @Prop({ default: null })
  work_started_at!: Date;

  // ── Resolution ────────────────────────────────────────────────────────────
  @Prop({ default: null })
  resolved_at!: Date;

  @Prop({ default: null })
  work_notes!: string;          // Worker's notes after completing

  @Prop({ type: [String], default: [] })
  completion_images!: string[]; // Photos after work done

  // ── Extra charges (if any spare parts used) ───────────────────────────────
  @Prop({ default: false })
  has_extra_charges!: boolean;

  @Prop({ default: null })
  extra_charge_amount!: number;

  @Prop({ default: null })
  extra_charge_description!: string;

  @Prop({ default: false })
  extra_charges_approved!: boolean;
}

export const ComplaintAssignmentSchema = SchemaFactory.createForClass(ComplaintAssignment);

ComplaintAssignmentSchema.index({ complaint_id: 1 });
ComplaintAssignmentSchema.index({ worker_id: 1, status: 1 });
