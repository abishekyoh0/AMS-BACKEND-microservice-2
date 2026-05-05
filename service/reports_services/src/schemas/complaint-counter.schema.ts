import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ComplaintCounterDocument = HydratedDocument<ComplaintCounter>;

/**
 * Tracks the running count per year to generate complaint numbers.
 * e.g.  AMS-2025-00001, AMS-2025-00002 ...
 * One document per year — { year: 2025, seq: 42 }
 */
@Schema({ collection: 'complaint_counters' })
export class ComplaintCounter {
  @Prop({ required: true, unique: true })
  year: number;

  @Prop({ default: 0 })
  seq: number;
}

export const ComplaintCounterSchema = SchemaFactory.createForClass(ComplaintCounter);
