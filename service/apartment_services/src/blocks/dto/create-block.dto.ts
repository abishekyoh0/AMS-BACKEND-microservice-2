import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBlockDto {
  @IsString()
  @IsNotEmpty()
  block_name!: string;

  @IsString()
  @IsNotEmpty()
  block_code!: string;

  @IsString()
  @IsNotEmpty()
  address!: string;
}