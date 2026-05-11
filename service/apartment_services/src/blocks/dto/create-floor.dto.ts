import { IsNotEmpty, IsNumber, IsMongoId } from 'class-validator';

export class CreateFloorDto {
  @IsMongoId()
  @IsNotEmpty()
  block_id!: string;

  @IsNumber()
  @IsNotEmpty() 
  floor_number!: number;
}