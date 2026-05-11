
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { PanelType, Priority, Status, Category } from '../schema/notification.schema';

export class QueryDto {
  @IsOptional() @IsEnum(PanelType) panelType?: PanelType;
  @IsOptional() @IsEnum(Status) status?: Status;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsEnum(Category) category?: Category;
  @IsOptional() @IsBoolean() actionRequired?: boolean;
}