// import { IsString, IsNumber } from 'class-validator';

// export class CreateEmergencyDto {

//   @IsString()
//   type!!: string;

//   @IsString()
//   priority!!: string;

//   @IsString()
//   location!!: string;

//   @IsString()
//   raisedBy!!: string;

//   @IsNumber()
//   total!!: number;

//   @IsString()
//   message!!: string;
// }

import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export class CreateEmergencyDto {
  @IsString()
  type!: string;

  @IsString()
  alertId!: string;

  @IsEnum(['High', 'Medium', 'Low'])
  @IsOptional()
  priority?: string;

  @IsString()
  location!: string;

  @IsString()
  raisedBy!: string;

  @IsString()
  time!: string;

  @IsNumber()
  @IsOptional()
  acknowledged?: number;

  @IsNumber()
  total!: number;

  @IsEnum(['Active', 'Resolved'])
  @IsOptional()
  status?: string;

  @IsString()
  message!: string;

  @IsString()
  sendTo!: string;
}