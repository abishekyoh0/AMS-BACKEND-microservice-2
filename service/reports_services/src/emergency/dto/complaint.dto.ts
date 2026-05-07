import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class ComplaintsDto {

  @IsNotEmpty()
  @IsString()
  category!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsEnum(["Low", "Medium", "High"])
  priority!: "Low" | "Medium" | "High";

  @IsOptional()
  @IsString()
  images?: string;
}