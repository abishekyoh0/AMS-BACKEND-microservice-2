import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

export type WorkLogsDocument = HydratedDocument<WorkLogs>;

@Schema({ timestamps: true })
export class WorkLogs {
  @Prop()
  user_id!: string;

  // Flat reference (to be resolved by reports-service)
  @Prop({ required: true })
  worklog_id!: string;

  @Prop({ required: true })
  assignment_id!: string;

  @Prop({ required: true })
  start_time!: Date;
  
  @Prop({ required: true})
  end_time!: Date;

  @Prop({ required: true, enum: [ 'In Progress', 'Completed'], default: 'In Progress' })
  status!: 'In Progress'| 'Completed';

  @Prop({ required: true })
  notes!: string;
  
  @Prop()
  created_at!: Date;

  @Prop()
  updated_at!: Date;

}

export const WorkLogsSchema = SchemaFactory.createForClass(WorkLogs);
