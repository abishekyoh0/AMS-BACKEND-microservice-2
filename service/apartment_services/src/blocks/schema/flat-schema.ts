import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FlatDocument = Flat & Document;

@Schema({ timestamps: true })
export class Flat {



  @Prop({ type: Types.ObjectId, ref: 'Block', required: true })
  block_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Floor', required: true })
  floor_id!: Types.ObjectId;

  @Prop({ required: true })
  flat_number!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  owner_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  tenant_id!: Types.ObjectId;

  @Prop({
    enum: ['Occupied', 'Vacant'],
    default: 'Vacant',
  })
  status!: string;

  @Prop({ default: false })
  is_deleted!: boolean;
}

export const FlatSchema = SchemaFactory.createForClass(Flat);