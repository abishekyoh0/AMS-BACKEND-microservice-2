import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VisitorDocument = Visitor & Document;

@Schema({ timestamps: true })
export class Visitor {

  @Prop({ type: Types.ObjectId, required: true, ref: 'Resident' })
 resident_id!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  mobile!: string;

  @Prop()
  id_proof!: string;

  @Prop()
  relation!: string;

  @Prop({ required: true })
  visit_date!: Date;

  @Prop({ required: true })
  visit_time!: string;

  @Prop({
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending',
  })
  status!: string;

  @Prop({
    type: String,
    enum: ['Visitor', 'Delivery', 'Other'],
    required: true,
  })
  type!: string;

  @Prop()
  entry_time!: Date;

  @Prop()
  exit_time!: Date;

  @Prop({ default: false })
  is_deleted!: boolean;
}

export const VisitorSchema = SchemaFactory.createForClass(Visitor);