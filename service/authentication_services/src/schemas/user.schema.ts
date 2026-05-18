import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/roles.enum';
import { UserStatus } from '../common/enums/status.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ trim: true })
  full_name!: string;

  @Prop({ unique: true, sparse: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ unique: true, sparse: true, trim: true })
  mobile!: string;

  @Prop({ select: false })
  password!: string;

  @Prop({ type: String, enum: Role, required: true })
  role!: Role;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.PENDING })
  status!: UserStatus;

  @Prop({ default: false })
  is_verified!: boolean;

  /**
   * Resident-only flags
   * is_first_login  — true until resident completes move-in form
   * profile_completed — true after move-in form submitted
   */
  @Prop({ default: false })
  is_first_login!: boolean;

  @Prop({ default: false })
  profile_completed!: boolean;

  @Prop({ select: false })
  otp!: string;

  @Prop({ select: false })
  otp_expires_at!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  created_by!: Types.ObjectId;

  @Prop({ default: null })
  last_login!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// ✅ CORRECT — add return to guard clause
UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this['password']) return;
  this['password'] = await bcrypt.hash(this['password'], 10);
});

UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.password);
};
