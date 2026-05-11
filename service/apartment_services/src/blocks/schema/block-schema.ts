import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = Block & Document;

@Schema({ timestamps: true })
export class Block {

  @Prop({ required: true })
  block_name!: string;

  @Prop({ required: true, unique: true })
  block_code!: string;

  @Prop({ required: true })
  address!: boolean;

}

export const BlockSchema = SchemaFactory.createForClass(Block);