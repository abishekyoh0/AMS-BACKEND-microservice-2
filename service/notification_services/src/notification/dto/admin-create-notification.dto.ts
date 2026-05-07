
import { IsEnum, IsOptional, IsArray, IsString, IsBoolean } from 'class-validator';
import { Priority, Category, PanelType } from '../schema/notification.schema';

export class AdminCreateNotificationDto {
  @IsString() title!: string;
  @IsString() message!: string;

  @IsEnum(Category)
  category!: Category;

  @IsEnum(Priority)
  priority!: Priority;

  @IsOptional()
  actionRequired?: boolean;

  @IsEnum(PanelType)
  @IsOptional()
  targetPanel?: PanelType;

  @IsOptional()
senderId?: string; // admin id

  @IsArray()
  @IsOptional()
  userIds?: string[];

  @IsArray()
  @IsOptional()
  roles?: string[];

  @IsOptional()
  tags?: string[];

  @IsOptional()
  meta?: Record<string, any>;

   @IsBoolean()
    isRead!: boolean;
  
}
