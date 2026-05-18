import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmergencyDocument = Emergency & Document;

@Schema({ timestamps: true, collection: 'emergencies' })
export class Emergency {

  // Auto-generated from type — never sent by frontend
  @Prop({ unique: true })
  alertId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ enum: ['High', 'Medium', 'Low'], default: 'Medium' })
  priority!: string;

  @Prop({ required: true })
  location!: string;

  @Prop({ required: true })
  message!: string;

  // Array: ['all'] | ['resident'] | ['maintenance'] | ['admin'] | ['security'] | combined
  @Prop({ type: [String], required: true })
  sendTo!: string[];

  @Prop({ default: null })
  total!: number;

  // Auto-set on create
  @Prop()
  time!: string;

  @Prop({ default: 0 })
  acknowledged!: number;

  @Prop({ enum: ['Active', 'Resolved'], default: 'Active' })
  status!: string;

  // Who raised — from JWT in gateway
  @Prop({ type: Types.ObjectId, required: true })
  raisedById!: Types.ObjectId;

  @Prop({ required: true })
  raisedByName!: string;

  @Prop({ required: true })
  raisedByRole!: string;

  // Who resolved
  @Prop({ type: Types.ObjectId, default: null })
  resolvedById!: Types.ObjectId;

  @Prop({ default: null })
  resolvedByName!: string;

  @Prop({ default: null })
  resolvedAt!: Date;

  @Prop({ default: null })
  resolutionNote!: string;
}

export const EmergencySchema = SchemaFactory.createForClass(Emergency);
EmergencySchema.index({ status: 1, createdAt: -1 });
EmergencySchema.index({ raisedById: 1 });
