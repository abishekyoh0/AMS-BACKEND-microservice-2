import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

export type ComplaintsAssignmentsDocument = HydratedDocument<ComplaintsAssignments>;

@Schema({ timestamps: true })
export class ComplaintsAssignments {
  @Prop()
  user_id!: string;

  // Flat reference (to be resolved by reports-service)
  @Prop({ required: true })
  complaint_id!: string;

  @Prop({ required: true })
  assignment_id!: string;

  @Prop({ required: true })
  technician_id!: string;

  @Prop({ required: true })
  assigned_date!: Date;

  @Prop({ required: true, enum: [ 'Assigned', 'Accepted', 'Rejected'], default: 'Assigned' })
  status!: 'Assigned' | 'Accepted'| 'Rejected';

  @Prop()
  scheduled_date!: Date;

  @Prop()
  created_at!: Date;

  @Prop()
  updated_at!: Date;

}

export const ComplaintsAssignmentsSchema = SchemaFactory.createForClass(ComplaintsAssignments);
