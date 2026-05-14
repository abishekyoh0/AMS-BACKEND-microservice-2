import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum PanelType {
  RESIDENT = 'RESIDENT',
  SECURITY = 'SECURITY',
  MAINTENANCE = 'MAINTENANCE',
  ACCOUNTS = 'ACCOUNTS',
  ADMIN = 'ADMIN',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum NotifStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export enum Category {
  PAYMENT = 'PAYMENT',
  VISITOR = 'VISITOR',
  SECURITY_ALERT = 'SECURITY_ALERT',
  MAINTENANCE = 'MAINTENANCE',
  SYSTEM = 'SYSTEM',
  EMERGENCY = 'EMERGENCY',
  COMPLAINT = 'COMPLAINT',
  BILL = 'BILL',
}

/**
 * Notification Schema
 *
 * targetType = 'user'  → shown only to receiverId (specific user)
 * targetType = 'role'  → shown to ALL users whose role matches targetRole
 * targetType = 'all'   → shown to every authenticated user
 *
 * This removes the need for the notification service to know individual user IDs
 * at broadcast time. The query logic handles matching at read time.
 */
@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ enum: ['user', 'role', 'all'], required: true, default: 'user' })
  targetType!: 'user' | 'role' | 'all';

  // Filled when targetType = 'user'
  @Prop({ type: Types.ObjectId, default: null })
  receiverId!: Types.ObjectId;

  // Filled when targetType = 'role' (matches auth service role values)
  // e.g. 'resident', 'admin', 'admin_security', 'admin_maintenance', 'gatekeeper', 'accountant'
  @Prop({ default: null })
  targetRole!: string;

  // Who sent it
  @Prop({ type: Types.ObjectId, default: null })
  senderId!: Types.ObjectId;

  @Prop({ default: 'SYSTEM' })
  senderType!: string;

  @Prop({ default: null })
  category!: string;

  @Prop({ enum: Object.values(Priority), default: Priority.LOW })
  priority!: string;

  @Prop({ enum: Object.values(NotifStatus), default: NotifStatus.UNREAD })
  status!: string;

  @Prop({ default: false })
  actionRequired!: boolean;

  @Prop({ default: false })
  isRead!: boolean;

  @Prop({ default: false })
  isSeen!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;

  // What triggered this notification
  @Prop({ default: null })
  referenceId!: string;    // e.g. complaint_id, emergency_id, bill_id

  @Prop({ default: null })
  referenceType!: string;  // 'complaint' | 'emergency' | 'bill' | 'visitor'

  @Prop({ default: null })
  redirectUrl!: string;

  @Prop({ type: Object })
  meta!: Record<string, any>;

  @Prop({ default: null })
  expiresAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ receiverId: 1, status: 1, isDeleted: 1 });
NotificationSchema.index({ targetRole: 1, status: 1, isDeleted: 1 });
NotificationSchema.index({ targetType: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });
