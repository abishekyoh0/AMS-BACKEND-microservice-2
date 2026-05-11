import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportStatusDocument = ReportStatus & Document;

export enum ReportStatusEnum {
  PENDING  = 'pending',
  DONE     = 'done',
  FAILED   = 'failed',
}

@Schema({ timestamps: true })
export class ReportStatus {
  @Prop({ required: true, unique: true })
  reportId!: string;                    

  @Prop({ enum: ReportStatusEnum, default: ReportStatusEnum.PENDING })
  status!: ReportStatusEnum;

  @Prop({ enum: ['ALL', 'SINGLE'] })
  reportType!: string;

  @Prop()
  emergencyId?: string;                

  @Prop()
  downloadUrl?: string;                 

  @Prop()
  errorMessage?: string;              

  @Prop()
  requestedBy?: string;                
}

export const ReportStatusSchema = SchemaFactory.createForClass(ReportStatus);