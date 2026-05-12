import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UnitDocument = Unit & Document;

@Schema({ timestamps: true })
export class Unit {

  @Prop({ type: Types.ObjectId, ref: 'Block', required: true })
  block_id!: Types.ObjectId;

  @Prop({ required: true })
  unit_number!: string;

  @Prop({ required: true })
  floor!: number;

  @Prop({ required: true })
  rent!: number;

  @Prop({ default: 'VACANT' })
  status!: string;

  @Prop({ default: false })
  is_deleted!: boolean;

}

export const UnitSchema = SchemaFactory.createForClass(Unit);  

