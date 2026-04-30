import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GateStatus, ShiftDay, SessionStatus } from '../common/enums/status.enum';

// ─── Gate ──────────────────────────────────────────────────────────────────

export type GateDocument = Gate & Document;

@Schema({ timestamps: true, collection: 'gates' })
export class Gate {
  @Prop({ required: true, unique: true, trim: true })
  gate_name: string; // "Gate A", "Main Gate", "Back Gate"

  @Prop()
  location: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: GateStatus, default: GateStatus.ACTIVE })
  status: GateStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;
}

export const GateSchema = SchemaFactory.createForClass(Gate);

// ─── GateSchedule ──────────────────────────────────────────────────────────

export type GateScheduleDocument = GateSchedule & Document;

/**
 * ADMIN_SECURITY assigns: gatekeeper → gate → shift time
 * Either recurring (day_of_week) or one-time (specific_date)
 */
@Schema({ timestamps: true, collection: 'gate_schedules' })
export class GateSchedule {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  gatekeeper: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Gate', required: true })
  gate: Types.ObjectId;

  @Prop({ required: true }) // "06:00"
  shift_start: string;

  @Prop({ required: true }) // "14:00"
  shift_end: string;

  @Prop() // Morning / Evening / Night
  shift_name: string;

  // For recurring weekly schedule
  @Prop({ type: String, enum: ShiftDay })
  day_of_week: ShiftDay;

  // For one-time schedule (takes priority over day_of_week)
  @Prop()
  specific_date: string; // "YYYY-MM-DD"

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;

  @Prop()
  notes: string;
}

export const GateScheduleSchema = SchemaFactory.createForClass(GateSchedule);

// ─── GatekeeperSession ─────────────────────────────────────────────────────

export type GatekeeperSessionDocument = GatekeeperSession & Document;

/**
 * Created every day a gatekeeper logs in.
 * Tracks which gate, login time, logout time.
 */
@Schema({ timestamps: true, collection: 'gatekeeper_sessions' })
export class GatekeeperSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  gatekeeper: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Gate', required: true })
  gate: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'GateSchedule', default: null })
  schedule: Types.ObjectId;

  @Prop({ required: true }) // "YYYY-MM-DD"
  session_date: string;

  @Prop({ required: true })
  login_time: Date;

  @Prop({ default: null })
  logout_time: Date;

  @Prop({ type: String, enum: SessionStatus, default: SessionStatus.ACTIVE })
  status: SessionStatus;

  @Prop()
  notes: string;
}

export const GatekeeperSessionSchema = SchemaFactory.createForClass(GatekeeperSession);
