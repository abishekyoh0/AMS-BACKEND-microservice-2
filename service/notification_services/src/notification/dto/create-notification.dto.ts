
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PanelType, Priority, Category } from '../schema/notification.schema';

class AttachmentDto {
  @IsString() fileName!: string;
  @IsString() fileUrl!: string;
  @IsString() fileType!: string;
  @IsOptional() size?: number;
}

class ActionDto {
  @IsString() label!: string;
  @IsString() action!: string;
  @IsString() type!: string;
}

export class CreateNotificationDto {
  @IsString() title!: string;
  @IsString() message!: string;

  @IsEnum(PanelType)
  panelType!: PanelType;

  @IsEnum(Category)
  category! : Category;

  @IsEnum(Priority)
  priority!: Priority;

  @IsBoolean()
  @IsOptional()
  actionRequired?: boolean;

  @IsOptional()
eventTime?: Date;

@IsOptional()
isGlobal?: boolean;

@IsOptional()
redirectUrl?: string;

@IsOptional()
senderId?: string;

@IsOptional()
receiverId?: string;

@IsOptional()
senderType?: 'SYSTEM' | 'ADMIN' | 'USER';

@IsOptional()
receiverType?: 'USER' | 'ROLE' | 'PANEL';

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsOptional()
  icon?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @IsOptional()
  attachments?: AttachmentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  @IsOptional()
  actions?: ActionDto[];

  @IsOptional()
  referenceId?: string;

  @IsOptional()
  meta?: Record<string, any>;

  @IsOptional()
  userId?: string;

  @IsOptional()
  expiresAt?: Date; 

  @IsBoolean()
  isRead!: boolean;

}  

