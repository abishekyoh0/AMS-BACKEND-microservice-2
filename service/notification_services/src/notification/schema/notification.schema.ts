
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

export enum Status {
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
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ enum: PanelType, required: true })
  panelType!: PanelType;

  @Prop({ enum: Category })
  category?: Category;

  @Prop({ enum: Priority, default: Priority.LOW }) 
  priority!: Priority;  

  @Prop({ enum: Status, default: Status.UNREAD })
  status!: Status;

  @Prop({ default: false })
  actionRequired!: boolean;

  @Prop([String])
  tags?: string[];

  @Prop()
  icon?: string;

  @Prop([
    {
      fileName: String,
      fileUrl: String,
      fileType: String,
      size: Number,
    },
  ])
  attachments?: any[];

  @Prop([
    {
      label: String,
      action: String,
      type: String,
    },
  ])
  actions?: any[];

  @Prop()
  referenceId?: string;

  @Prop({ type: Object })
  meta?: Record<string, any>;

  //  sender / receiver
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  senderId?: Types.ObjectId;

  @Prop({ default: 'SYSTEM' })
  senderType!: 'SYSTEM' | 'ADMIN' | 'USER';

  @Prop({ default: 'USER' })
  receiverType!: 'USER' | 'ROLE' | 'PANEL';

  //  UI support
  @Prop()
  redirectUrl?: string;

  @Prop()
  eventTime?: Date;

  @Prop({ default: false })
  isSeen!: boolean;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ default: false })
  isGlobal!: boolean;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: false })
isRead!: boolean;  


}

 export const NotificationSchema =
  SchemaFactory.createForClass(Notification);
