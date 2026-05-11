import { IsMongoId, IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateFlatDto {

  

  @IsMongoId()
  block_id!: string;

  @IsMongoId()   
  floor_id!: string;

  @IsString()
  @IsNotEmpty()
  flat_number!: string;

  @IsOptional()
  owner_id!: number;

  @IsOptional()
  tenant_id!: number;

  @IsOptional()
  status!: string;
}