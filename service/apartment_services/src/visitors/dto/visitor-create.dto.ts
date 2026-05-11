import { IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateVisitorDto {

  @IsNotEmpty()
  resident_id!: number;

  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  mobile!: string;

  @IsOptional()
  id_proof!: string;

  @IsOptional()
  relation!: string;

  @IsNotEmpty()
  visit_date!: Date;

  @IsNotEmpty()
  visit_time!: string;

  @IsIn(['Visitor', 'Delivery', 'Other'])
  type!: string;
}