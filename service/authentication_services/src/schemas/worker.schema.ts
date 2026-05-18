import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { WorkerStatus } from '../common/enums/status.enum';

export type WorkerDocument = Worker & Document;

/**
 * Workers are maintenance staff (plumbers, electricians, etc.)
 * They have NO login — no User account.
 * Created and managed by ADMIN_MAINTENANCE.
 */
@Schema({ timestamps: true, collection: 'workers' })
export class Worker {
  @Prop({ required: true, trim: true })
  full_name!: string;

  @Prop({ trim: true })
  mobile!: string;

  @Prop({ trim: true })
  expertise!: string; // Plumber / Electrician / Carpenter / Painter

  @Prop()
  address!: string;

  @Prop()
  id_proof_type!: string; // Aadhar / Passport / Driving License

  @Prop()
  id_proof_number!: string;

  @Prop({ type: String, enum: WorkerStatus, default: WorkerStatus.ACTIVE })
  status!: WorkerStatus;

  // Created by ADMIN_MAINTENANCE
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by!: Types.ObjectId;

  @Prop()
  notes!: string;
}

export const WorkerSchema = SchemaFactory.createForClass(Worker);
