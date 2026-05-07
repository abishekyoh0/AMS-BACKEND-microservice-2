import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  ComplaintType, Priority, ComplaintStatus, RaisedByRole,
} from '../common/enums/complaint.enum';

export type ComplaintDocument = HydratedDocument<Complaint>;

@Schema({ timestamps: true, collection: 'complaints' })
export class Complaint {

  // ── Auto-generated ticket number ─────────────────────────────────────────
  // Format: AMS-2025-00001
  @Prop({ required: true, unique: true })
  complaint_number!: string;

  // ── Who raised it ─────────────────────────────────────────────────────────
  // ObjectId of the User (resident or admin_maintenance) who raised the complaint
  @Prop({ type: Types.ObjectId, required: true })
  raised_by_id!: Types.ObjectId;

  @Prop({ type: String, enum: RaisedByRole, required: true })
  raised_by_role!: RaisedByRole;

  // ── Location (always filled) ──────────────────────────────────────────────
  // For residents: auto-filled from their profile
  // For maintenance admin: manually entered
  @Prop({ required: true })
  resident_name!: string;   // Name of the affected resident

  @Prop()
  block!: string;           // e.g. "A"

  @Prop()
  floor!: string;           // e.g. "3"

  @Prop({ required: true })
  unit_number!: string;     // e.g. "301"  (for common: can be "Common Area")

  // ── Complaint classification ───────────────────────────────────────────────
  @Prop({ type: String, enum: ComplaintType, required: true })
  complaint_type!: ComplaintType;   // common | individual

  // Category depends on complaint_type
  // Common:     Plumbing, Electrical, Gardening, Lift, Painting, Cleaning, Security, Carpentry, Other
  // Individual: Plumbing, Electrical, Carpentry, Painting, Pest Control, Appliance Repair, Other
  @Prop({ required: true })
  category!: string;

  @Prop({ type: String, enum: Priority, default: Priority.MEDIUM })
  priority!: Priority;

  // ── Complaint content ──────────────────────────────────────────────────────
  @Prop({ required: true })
  title!: string;           // Short summary e.g. "Water leaking from ceiling"

  @Prop({ required: true })
  description!: string;     // Detailed description

  @Prop({ type: [String], default: [] })
  images!: string[];        // Array of image URLs (optional)

  // ── Status & assignment ───────────────────────────────────────────────────
  @Prop({ type: String, enum: ComplaintStatus, default: ComplaintStatus.OPEN })
  status!: ComplaintStatus;

  // Quick reference — updated whenever a worker is assigned/changed
  @Prop({ type: Types.ObjectId, default: null })
  assigned_worker_id!: Types.ObjectId;  // References worker._id in auth_service DB

  @Prop({ default: null })
  assigned_worker_name!: string;        // Denormalized for fast display

  // Active assignment document reference
  @Prop({ type: Types.ObjectId, ref: 'ComplaintAssignment', default: null })
  current_assignment_id!: Types.ObjectId;

  // ── Resolution ────────────────────────────────────────────────────────────
  @Prop({ default: null })
  resolved_at!: Date;

  @Prop({ default: null })
  closed_at!: Date;

  @Prop({ default: null })
  closure_remark!: string;  // Resident/admin note on closing

  // ── Rating (filled after closure) ─────────────────────────────────────────
  @Prop({ min: 1, max: 5, default: null })
  rating!: number;

  @Prop({ default: null })
  rating_comment!: string;

  // ── Soft delete ───────────────────────────────────────────────────────────
  @Prop({ default: false })
  is_deleted!: boolean;
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);

// Indexes for common queries
ComplaintSchema.index({ raised_by_id: 1, status: 1 });
ComplaintSchema.index({ complaint_number: 1 });
ComplaintSchema.index({ status: 1, priority: -1 });
ComplaintSchema.index({ assigned_worker_id: 1 });
