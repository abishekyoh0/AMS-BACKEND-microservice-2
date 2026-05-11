import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AccessRequestDocument = AccessRequest & Document;

@Schema({ timestamps: true })
export class AccessRequest {
  //  Request Info (Admin Panel)
  @Prop({  unique: true })
  residentId!: string; // RES-A304

  //  Personal Info
  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  phoneNumber!: string;

  //  Unit Info
  @Prop({ required: true })
  primaryUnit!: string; // "Tower A - A-304" or "4B"

  @Prop({ required: true })
  towerName!: string; // Tower-A

  @Prop({ required: true })
  unitNo!: number;

  @Prop()
  moveIn?: Date;

  @Prop()
  moveOut?: Date; 


  @Prop({ required: true })
  residentName!: string;

  //  Access Type (Resident form)
  @Prop({
    enum: ['Common', 'Biometric', 'Call'],
    default: 'Common',
  })
  accessCardType!: string;

  //  Parking
  // @Prop({ default: false })
  // parkingAccess!: boolean;

  // @Prop({
  //   enum: [1, 2, 3, 4],
  //   default: 1,
  // })
  // numberOfVehicles!: number;

  //  Amenities
  // @Prop({
  //   type: [String],
  //   enum: [
  //     'Pool',
  //     'Gym',
  //     'Clubhouse',
  //     'Tennis Court',
  //     'Business Center',
  //     'Rooftop',
  //   ],
  //   default: [],
  // })
  // amenitiesAccess!: string[];

  //  Card Details (Admin panel)
  // @Prop({ enum: ['Standard', 'Premium'], default: 'Standard' })
  // cardType!: string;

  @Prop({ enum: [1, 2, 3, 4], default: 1 })
  additionalCards!: number; 

  // @Prop({ enum: ['Pickup', 'Mail'], default: 'Pickup' })
  // deliveryMethod!: string;

  // @Prop({
  //   enum: ['Standard', 'Rush', 'Emergency'],
  //   default: 'Standard',
  // })
  // urgency!: string;

  @Prop()
  reason?: string; 

  //created submit

  //  Status 

  @Prop({
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status!: string;
}

export const AccessRequestSchema =
SchemaFactory.createForClass(AccessRequest);    

