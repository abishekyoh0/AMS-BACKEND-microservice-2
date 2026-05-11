import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FloorDocument = Floor & Document;

@Schema({ timestamps: true })
export class Floor {
  @Prop({ type: Types.ObjectId, ref: 'Block', required: true })
  block_id!: Types.ObjectId;

  @Prop({ required: true })
  floor_number!: number;

  @Prop({ default: false })
  is_deleted!: boolean;
}

export const FloorSchema = SchemaFactory.createForClass(Floor);