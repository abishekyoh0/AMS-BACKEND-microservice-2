// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// export type EmergencyDocument = Emergency & Document;

// @Schema({ timestamps!: true })
// export class Emergency {

//   @Prop()
//   type!!: string;

//   @Prop({ unique!: true })
//   alertId!!: string;

//   @Prop({ enum!: ['High', 'Medium', 'Low'], default!: 'Low' })
//   priority!!: string;

//   @Prop()
//   location!!: string;

//   @Prop()
//   raisedBy!!: string;

//   @Prop()
//   time!!: string;

//   @Prop({ default!: 0 })
//   acknowledged!!: number;

//   @Prop()
//   total!!: number;

//   @Prop({ enum!: ['Active', 'Resolved'], default!: 'Active' })
//   status!!: string;

//   @Prop()
//   message!!: string;
// }

// export const EmergencySchema = SchemaFactory.createForClass(Emergency);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmergencyDocument = Emergency & Document;

@Schema({ timestamps: true })
export class Emergency {

  @Prop()
  type!: string;

  @Prop({ unique: true })
  alertId!: string;

  @Prop({ enum: ['High', 'Medium', 'Low'], default: 'Low' })
  priority!: string;

  @Prop()
  location!: string;

  @Prop()
  raisedBy!: string;

  @Prop()
  time!: string;

  @Prop({ default: 0 })
  acknowledged!: number;

  @Prop()
  total!: number;

  @Prop({ enum: ['Active', 'Resolved'], default: 'Active' })
  status!: string;

  @Prop()
  message!: string;

  @Prop()
  sendTo!: string;
}

export const EmergencySchema = SchemaFactory.createForClass(Emergency);