
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateAccessRequestDto {
  // Request Info
  @ApiProperty({
    example: 'RES-A304',
    required: false,
  })
  @IsOptional()
  @IsString()
  residentId?: string;

  // Personal Info
  @ApiProperty({ example: 'Sara Johnson' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: 'sarajohnson@gmail.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  phoneNumber!: string;

  // Unit Info
  @ApiProperty({ example: 'Tower A - A-304' })
  @IsString()
  primaryUnit!: string;

  @ApiProperty({ example: 'Tower A' })
  @IsString()
  towerName!: string;

  @ApiProperty({ example: 304 })
  @IsNumber()
  unitNo!: number;

  @ApiProperty({
    example: '2026-05-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  moveIn?: Date;

  @ApiProperty({
    example: '2026-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  moveOut?: Date;

  @ApiProperty({ example: 'John Resident' })
  @IsString()
  residentName!: string;

  // Access Type
  @ApiProperty({
    enum: ['Common', 'Biometric', 'Call'],
    example: 'Common',
    required: false,
  })
  @IsOptional()
  @IsEnum(['Common', 'Biometric', 'Call'])
  accessCardType?: string;

  // Additional Cards
  @ApiProperty({
    example: 1,
    required: false,
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  additionalCards?: number;

  // Reason
  @ApiProperty({
    example: 'Need access for family member',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  // Status
  @ApiProperty({
    enum: ['Pending', 'Approved', 'Rejected'],
    required: false,
    example: 'Pending',
  })
  @IsOptional()
  @IsEnum(['Pending', 'Approved', 'Rejected'])
  status?: string;
}  

