import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUnitDto {

  @IsString()
  @IsNotEmpty()
  block_id!: string;

  @IsString()
  @IsNotEmpty()
  unit_number!: string;

  @IsNumber()
  floor!: number;

  @IsNumber()
  rent!: number;

}