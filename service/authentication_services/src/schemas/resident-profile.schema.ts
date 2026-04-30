import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ResidentType } from '../common/enums/status.enum';

export type ResidentProfileDocument = ResidentProfile & Document;

/**
 * ResidentProfile — filled during the move-in form (first login).
 * All fields are optional at creation; required fields are enforced in the DTO.
 */
@Schema({ timestamps: true, collection: 'resident_profiles' })
export class ResidentProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: ResidentType, default: ResidentType.OWNER })
  resident_type: ResidentType;

  /** Cross-service reference to apartment_services flat */
  @Prop({ type: Types.ObjectId, default: null })
  flat_id: Types.ObjectId;

  /** Block + unit set by admin on creation */
  @Prop()
  block: string;

  @Prop()
  unit_number: string;

  /** Filled during move-in form */
  @Prop()
  id_proof_type: string;       // Aadhar / Passport / Driving License

  @Prop()
  id_proof_number: string;

  @Prop()
  id_proof_url: string;        // S3 / storage URL

  @Prop()
  address_proof_url: string;

  @Prop()
  permanent_address: string;

  /** Emergency contact */
  @Prop()
  emergency_contact_name: string;

  @Prop()
  emergency_contact_relation: string;

  @Prop()
  emergency_contact_mobile: string;

  /** Move-in / move-out */
  @Prop()
  move_in_date: string;        // YYYY-MM-DD

  @Prop()
  move_out_date: string;

  /** Vehicle (primary) */
  @Prop()
  vehicle_number: string;

  @Prop()
  vehicle_type: string;        // Car / Bike / Other

  @Prop()
  vehicle_model: string;

  @Prop()
  vehicle_color: string;

  /** Parking slot assigned (cross-service ref) */
  @Prop()
  parking_slot: string;

  /** Additional family members added via profile update (stored as sub-docs) */
  @Prop({
    type: [
      {
        name: String,
        relation: String,
        mobile: String,
      },
    ],
    default: [],
  })
  family_members: { name: string; relation: string; mobile: string }[];
}

export const ResidentProfileSchema = SchemaFactory.createForClass(ResidentProfile);
